#!/bin/bash

# Auto Git Upload Script
# This script adds all changes, commits them with an auto-generated timestamp, and pushes to the current branch.

echo "🚀 Starting auto-upload to Git..."

# Ensure we are in a git repository
if [ ! -d ".git" ]; then
  echo "❌ This is not a git repository. Please run 'git init' first."
  exit 1
fi

# Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ No local changes to commit. Ensuring remote is up to date..."
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git push origin "$BRANCH"
  echo "🎉 Done! Everything is in sync."
  exit 0
fi

# Add all changes
git add .

# Create commit with current timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "update: $TIMESTAMP"

# Push to current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📤 Pushing to $BRANCH..."
git push origin "$BRANCH"

echo "🎉 Auto-upload completed successfully!"
