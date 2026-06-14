#!/bin/bash
# Backend startup script

export PYTHONDONTWRITEBYTECODE=1
cd /Users/apple/Desktop/Builder_app/Homeviz_app/backend
exec /Users/apple/Desktop/Builder_app/Homeviz_app/.venv/bin/python << 'EOF'
import sys
import os
sys.path.insert(0, os.getcwd())

from server import app
import uvicorn

uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
