#!/bin/bash
set -e

echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"

# Upgrade pip and build tools first
pip install --upgrade pip setuptools wheel

# Install all packages using pre-built binary wheels only
# --only-binary :all: prevents any source compilation
pip install --only-binary :all: \
    numpy==1.26.4 \
    pydantic-core==2.23.4

# Install everything else normally (these all have wheels for 3.11)
pip install \
    fastapi==0.115.0 \
    "uvicorn[standard]==0.30.6" \
    python-multipart==0.0.9 \
    sqlalchemy==2.0.35 \
    psycopg2-binary==2.9.9 \
    "python-jose[cryptography]==3.3.0" \
    "passlib[bcrypt]==1.7.4" \
    bcrypt==4.0.1 \
    pydantic==2.9.2 \
    pydantic-settings==2.5.2 \
    python-dotenv==1.0.1 \
    boto3==1.35.30 \
    botocore==1.35.30 \
    scikit-learn==1.5.2 \
    joblib==1.4.2 \
    httpx==0.27.2 \
    python-json-logger==2.0.7

echo "=== All packages installed ==="
pip list | grep -E "fastapi|pydantic|sqlalchemy|boto3|scikit|numpy"