set -e  

REGISTRY="${DOCKER_REGISTRY:-}"  
BACKEND_IMAGE="guardian-backend"
FRONTEND_IMAGE="guardian-frontend"
TAG="${IMAGE_TAG:-latest}"
NAMESPACE="guardian"


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[Guardian]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

log "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || fail "Docker not found. Install Docker Desktop."
command -v kubectl >/dev/null 2>&1 || fail "kubectl not found. Install kubectl."
ok "Docker and kubectl found."

CONTEXT=$(kubectl config current-context)
warn "Deploying to cluster context: $CONTEXT"
read -p "Continue? (y/N) " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }


log "Building backend image..."
docker build \
    -f devops/docker/Dockerfile.backend \
    -t "$BACKEND_IMAGE:$TAG" \
    ./backend
ok "Backend image built: $BACKEND_IMAGE:$TAG"

log "Building frontend image..."
docker build \
    -f devops/docker/Dockerfile.frontend \
    --build-arg VITE_API_BASE_URL=/api \
    -t "$FRONTEND_IMAGE:$TAG" \
    ./frontend
ok "Frontend image built: $FRONTEND_IMAGE:$TAG"


if [[ "$1" == "--registry" ]]; then
    [[ -z "$REGISTRY" ]] && fail "Set DOCKER_REGISTRY env var first. e.g. export DOCKER_REGISTRY=your-username"

    log "Pushing images to registry: $REGISTRY"
    docker tag "$BACKEND_IMAGE:$TAG" "$REGISTRY/$BACKEND_IMAGE:$TAG"
    docker tag "$FRONTEND_IMAGE:$TAG" "$REGISTRY/$FRONTEND_IMAGE:$TAG"
    docker push "$REGISTRY/$BACKEND_IMAGE:$TAG"
    docker push "$REGISTRY/$FRONTEND_IMAGE:$TAG"
    ok "Images pushed to $REGISTRY"

    # Update image names in manifests
    sed -i "s|guardian-backend:latest|$REGISTRY/$BACKEND_IMAGE:$TAG|g" devops/k8s/base/03-backend.yaml
    sed -i "s|guardian-frontend:latest|$REGISTRY/$FRONTEND_IMAGE:$TAG|g" devops/k8s/base/04-frontend.yaml
fi


if kubectl config current-context | grep -q "minikube"; then
    log "Detected minikube — loading images directly (no registry needed)..."
    minikube image load "$BACKEND_IMAGE:$TAG"
    minikube image load "$FRONTEND_IMAGE:$TAG"
    ok "Images loaded into minikube."
fi


kubectl apply -f devops/k8s/base/00-namespace.yaml
kubectl apply -f devops/k8s/base/01-config.yaml
kubectl apply -f devops/k8s/base/02-postgres.yaml

log "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod \
    -l app=postgres \
    -n $NAMESPACE \
    --timeout=120s

kubectl apply -f devops/k8s/base/03-backend.yaml
kubectl apply -f devops/k8s/base/04-frontend.yaml
kubectl apply -f devops/k8s/base/05-ingress.yaml
kubectl apply -f devops/k8s/base/06-hpa.yaml

log "Waiting for deployments to roll out..."
kubectl rollout status deployment/guardian-backend -n $NAMESPACE --timeout=120s
kubectl rollout status deployment/guardian-frontend -n $NAMESPACE --timeout=120s

ok "Deployment complete!"
echo ""
log "Access the dashboard:"

if kubectl config current-context | grep -q "minikube"; then
    echo ""
    echo "  Run: minikube tunnel"
    echo "  Then open: http://guardian.local"
    echo ""
    echo "  Or use port-forward directly:"
    echo "  kubectl port-forward svc/frontend-service 8080:80 -n guardian"
    echo "  Then open: http://localhost:8080"
else
    EXTERNAL_IP=$(kubectl get ingress guardian-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    echo "  External IP: $EXTERNAL_IP"
    echo "  URL: http://guardian.local (add to /etc/hosts if needed)"
fi