#!/bin/bash
set -e

echo "🚀 Setting up React TypeScript Vite project with Vitest testing..."

# Update package lists
sudo apt-get update

# Install Node.js 18.x (required by the project)
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Add Node.js to PATH in user profile
echo 'export PATH="/usr/bin:$PATH"' >> $HOME/.profile

# Navigate to workspace directory
cd /mnt/persist/workspace

# Install project dependencies
echo "📦 Installing npm dependencies..."
npm ci

# Create test-results directory if it doesn't exist
mkdir -p test-results

# Verify the installation by checking if key packages are available
echo "🔍 Verifying installation..."
npx vitest --version

echo "✅ Setup completed successfully!"
echo "📁 Working directory: $(pwd)"
echo "🧪 Ready to run tests!"