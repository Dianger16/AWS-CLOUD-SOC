#!/bin/bash
set -e

echo "=== Starting AI Cloud Security Guardian ==="
echo "Python: $(python --version)"

# Run uvicorn — Render sets PORT automatically
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --workers 1 \
    --log-level info
