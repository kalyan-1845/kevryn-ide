#!/bin/bash
# Kevryn IDE - Global Dependency Setup Script
# "One-time setup for the World's Best Cloud IDE"

echo "[KEVRYN-SETUP] Initializing Global Cache..."

# 1. NODE.JS - Global Workspace
echo "[KEVRYN-SETUP] Installing Web Powerhouse (React, Tailwind, Framer Motion)..."
npm install -g npm@latest
npm install -g react react-dom next framer-motion lucide-react \
    express mongoose axios tailwindcss postcss autoprefixer \
    vitest jest typescript ts-node nodemon

# 2. PYTHON - Global Environment
echo "[KEVRYN-SETUP] Installing AI & Backend Powerhouse (NumPy, FastAPI, Django)..."
pip install --upgrade pip
pip install numpy pandas scikit-learn matplotlib \
    fastapi uvicorn django flask requests \
    pytest black flake8

# 3. SYSTEMS - Ensuring compilers are linked
echo "[KEVRYN-SETUP] Verifying Systems Powerhouse (GCC, G++, Go)..."
gcc --version || echo "GCC missing, install via apt if on Linux"
g++ --version || echo "G++ missing, install via apt if on Linux"
go version || echo "Go missing, install via apt if on Linux"

# 4. ENVIRONMENT LINKING
# Create a local 'node_modules' in the server root that projects can symlink to
mkdir -p /opt/kevryn/cache/node_modules
cp -r $(npm root -g)/* /opt/kevryn/cache/node_modules/

echo "[KEVRYN-SETUP] KEVRYN WORLD SETUP COMPLETE. USER CAN NOW BLINDLY CODE."
