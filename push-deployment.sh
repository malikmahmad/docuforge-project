#!/bin/bash

echo "🚀 Pushing Railway deployment files to GitHub..."

# Add all deployment files
git add railway.toml
git add nixpacks.toml
git add Procfile
git add .railwayignore
git add DEPLOYMENT.md
git add README.md
git add lib/integrations-openai-ai-server/src/batch/utils.ts
git add lib/integrations-openai-ai-server/src/image/client.ts

# Commit
git commit -m "feat: Add Railway deployment configuration and fix TypeScript errors

- Add railway.toml for Railway configuration
- Add nixpacks.toml for build setup
- Add Procfile for start command
- Add .railwayignore to exclude unnecessary files
- Add DEPLOYMENT.md with detailed deployment guide
- Update README.md with deployment section
- Fix pRetry.AbortError issues in batch utils
- Fix response.data optional chaining in image client
- Build tested and working ✅"

# Push to GitHub
git push

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "🚂 Next Steps:"
echo "1. Go to https://railway.app"
echo "2. Click 'Deploy from GitHub'"
echo "3. Select your repository"
echo "4. Wait 3-5 minutes"
echo "5. Get your live URL! 🎉"
echo ""
