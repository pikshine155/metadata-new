#!/bin/bash
set -e

echo "Starting build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Navigate to the project directory
cd metadata-main
echo "Changed to metadata-main directory"

# Force install dependencies with legacy peer deps
echo "Installing dependencies with force flag..."
npm install --legacy-peer-deps --force

# Install specific eslint version to resolve conflicts
echo "Installing specific eslint version to resolve conflicts..."
npm install eslint@8.56.0 @typescript-eslint/eslint-plugin@6.19.0 @typescript-eslint/parser@6.19.0 --force --no-save

# Verify installations
echo "Verifying package installations..."
npm list vite
npm list eslint || true
npm list @typescript-eslint/eslint-plugin || true
npm list @typescript-eslint/parser || true

# Build the project
echo "Building the project..."
npx vite build

echo "Build completed successfully!" 