#!/bin/bash
# build.sh — Render build script
# Installs system dependencies then Python packages

set -e

echo "=== Installing Python dependencies ==="

# Upgrade pip first — old pip causes metadata generation failures
pip install --upgrade pip setuptools wheel

# Install packages one group at a time to isolate any failures
echo "Installing FastAPI..."
pip install fastapi==0.115.0 uvicorn[standard]==0.30.6 python-multipart==0.0.9

echo "Installing database drivers..."
pip install sqlalchemy==2.0.35 psycopg2-binary==2.9.9

echo "Installing auth packages..."
pip install "python-jose[cryptography]==3.3.0" "passlib[bcrypt]==1.7.4"

echo "Installing settings..."
pip install pydantic==2.9.2 pydantic-settings==2.5.2 python-dotenv==1.0.1

echo "Installing AWS SDK..."
pip install boto3==1.35.30

echo "Installing ML packages..."
pip install numpy==1.26.4
pip install scikit-learn==1.5.2
pip install joblib==1.4.2

echo "Installing remaining packages..."
pip install httpx==0.27.2 python-json-logger==2.0.7

echo "=== Build complete ==="
pip list