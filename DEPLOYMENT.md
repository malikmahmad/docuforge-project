# 🚂 Railway Deployment Guide

Deploy DocuForge to Railway in minutes!

## 📋 Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **Railway Account** - Sign up at [railway.app](https://railway.app)

## 🚀 Deployment Steps

### Step 1: Push to GitHub

Make sure all files are committed and pushed:

```bash
git add .
git commit -m "feat: Add Railway deployment configuration"
git push
```

### Step 2: Deploy on Railway

#### Option A: Using Railway Dashboard (Recommended)

1. **Go to Railway**
   - Visit: https://railway.app
   - Click "Start a New Project"

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Select your repository: `malikmahmad/docuforge-project`
   - Click "Deploy Now"

3. **Configure Environment**
   - Railway will auto-detect the configuration
   - Wait for the build to complete (~3-5 minutes)

4. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Your app will be live at: `https://your-app.up.railway.app`

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 3: Configure Environment Variables (Optional)

If you want to add custom environment variables:

1. Go to your Railway project
2. Click on "Variables" tab
3. Add variables:
   - `PORT` (default: 8080)
   - Any other custom variables

### Step 4: Access Your App

Your DocuForge app will be live at:
```
https://your-app-name.up.railway.app
```

## 🔧 Configuration Files

Railway uses these files for deployment:

- **`railway.toml`** - Railway-specific configuration
- **`nixpacks.toml`** - Build configuration
- **`Procfile`** - Start command
- **`.railwayignore`** - Files to ignore during deployment

## 📊 Deployment Architecture

```
GitHub Repository
       ↓
Railway Build System
       ↓
   Build Steps:
   1. Install dependencies (pnpm install)
   2. Build API server
   3. Build frontend
       ↓
   Start Command:
   - Run API server on PORT
       ↓
Live Application
```

## 🌐 What Gets Deployed

- ✅ **Backend API** - Express server on port 8080 (or Railway's PORT)
- ✅ **Frontend** - Static files served by the API
- ✅ **Template Generator** - No API keys needed!

## 🔍 Monitoring

Railway provides:
- **Logs** - Real-time application logs
- **Metrics** - CPU, Memory, Network usage
- **Deployments** - History of all deployments

## 🐛 Troubleshooting

### Build Fails

**Problem:** Build fails with TypeScript errors

**Solution:**
```bash
# Locally test the build
pnpm build

# If it works locally, push again
git push
```

### App Crashes on Start

**Problem:** App crashes after deployment

**Solution:**
1. Check Railway logs
2. Ensure `PORT` environment variable is set
3. Verify start command in `Procfile`

### Cannot Access App

**Problem:** Domain not working

**Solution:**
1. Check if deployment is successful
2. Generate a new domain in Railway settings
3. Wait 1-2 minutes for DNS propagation

## 💰 Pricing

Railway offers:
- **Free Tier**: $5 credit/month (enough for small projects)
- **Pro Plan**: $20/month for production apps

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Railway automatically deploys! 🚀
```

## 📱 Custom Domain (Optional)

To use your own domain:

1. Go to Railway project settings
2. Click "Custom Domain"
3. Add your domain (e.g., `docuforge.yourdomain.com`)
4. Update DNS records as shown
5. Wait for SSL certificate generation

## ✅ Post-Deployment Checklist

- [ ] App is accessible via Railway URL
- [ ] Documentation generation works
- [ ] Export features work (Markdown, PDF, DOCX)
- [ ] All document types generate correctly
- [ ] No console errors in browser

## 🎉 Success!

Your DocuForge app is now live and accessible worldwide!

Share your deployment:
```
🚀 DocuForge is live!
📝 Generate professional documentation instantly
🔗 https://your-app.up.railway.app
```

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **GitHub Issues**: https://github.com/malikmahmad/docuforge-project/issues

---

**Happy Deploying! 🚂**
