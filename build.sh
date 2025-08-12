#!/bin/bash

echo "🚀 Starting Render build process..."

# Navigate to API directory
cd src/api

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run any setup scripts if needed
echo "🔧 Running setup scripts..."

# Check if database setup is needed
if [ ! -z "$SETUP_DB" ]; then
  echo "🗄️ Setting up database..."
  node scripts/create-users-table.js
fi

echo "✅ Build completed successfully!"
