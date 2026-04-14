"""
start.py — Guaranteed clean startup for Guardian backend.
Run with: python start.py
"""
import uvicorn
import sys
import os

# Ensure the app can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print("  AI Cloud Security Guardian — Backend")
    print("  http://localhost:8000")
    print("  API docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug",   # Show full errors including tracebacks
    )
