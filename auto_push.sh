#!/bin/bash

# Auto Git Upload Script
# This script adds all changes, commits them with an auto-generated timestamp, and pushes to the current branch.

echo "🚀 Starting auto-upload to Git..."

# Ensure we are in a git repository
if [ ! -d ".git" ]; then
  echo "❌ This is not a git repository. Please run 'git init' first."
  exit 1
fi

# Ensure commit author is always LR0988
git config user.name "LR0988"
git config user.email "273574533+LR0988@users.noreply.github.com"

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

# Create commit with current timestamp and enforce owner author
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "feat: user management & cloud sync $TIMESTAMP" --author="LR0988 <273574533+LR0988@users.noreply.github.com>"

# Push to current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📤 Pushing to $BRANCH..."
git push origin "$BRANCH"

echo "🎉 Auto-upload completed successfully!"
