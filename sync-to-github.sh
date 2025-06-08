#!/bin/bash

# GitHub Sync Script for PersonalTab v0.4
# This script prepares the project for syncing with GitHub

echo "🚀 Preparing PersonalTab v0.4 for GitHub sync..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: PersonalTab v0.4 with RSS widget and improved menu"
fi

# Add your GitHub remote (replace with your actual repo URL)
GITHUB_REPO="https://github.com/MrRobinGood/personaltab-v0-4.git"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin $GITHUB_REPO
fi

# Stage all changes
echo "📝 Staging changes..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "feat: Add RSS widget, fix hover menu, improve positioning

- Added RSS Feed widget with last 5 items display
- Fixed hover menu disappearing issue with timeout
- Improved automatic widget positioning in grid
- Enhanced menu layout and interaction
- Added date, title, description, and image support for RSS items"

echo "✅ Ready for GitHub sync!"
echo ""
echo "To complete the sync, run:"
echo "git push -u origin main"
echo ""
echo "Or if you prefer to force push (overwrites remote):"
echo "git push -f origin main"