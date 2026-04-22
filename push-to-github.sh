#!/bin/bash

# Initialize git repository
git init

# Configure git (replace with your details)
git config user.name "malikmahmad"
git config user.email "your-email@example.com"

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: DocuForge with template-based documentation generator (no API keys required)"

# Add remote repository
git remote add origin https://github.com/malikmahmad/docuforge-project.git

# Push to GitHub
git branch -M main
git push -u origin main

echo "Successfully pushed to GitHub!"
