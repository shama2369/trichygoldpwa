# Railway Deployment Guide

This guide will help you deploy your Trichy Gold PWA to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Install Dependencies Locally (Optional)

First, install the new Express dependency:

```bash
npm install
```

### 2. Build Your App Locally (Optional - for testing)

Test that everything works locally:

```bash
npm run build
npm start
```

Visit `http://localhost:3000` to verify the app works.

### 3. Deploy to Railway

#### Option A: Deploy via Railway Dashboard

1. **Login to Railway**: Go to [railway.app](https://railway.app) and sign in
2. **Create New Project**: Click "New Project"
3. **Connect Repository**: 
   - Select "Deploy from GitHub repo" (or GitLab/Bitbucket)
   - Choose your repository
   - Railway will automatically detect it's a Node.js project
4. **Configure Build**:
   - Railway will automatically detect the `railway.json` configuration
   - The build command `npm run build` will run automatically
   - The start command `npm start` will be used to run the server
5. **Deploy**: Railway will automatically build and deploy your app
6. **Get Your URL**: Once deployed, Railway will provide you with a public URL (e.g., `your-app-name.up.railway.app`)

#### Option B: Deploy via Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

### 4. Configure Custom Domain (Optional)

1. Go to your project settings in Railway
2. Click on "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## How It Works

- **Build Phase**: Railway runs `npm run build` which creates the production build in the `dist` folder
- **Start Phase**: Railway runs `npm start` which starts the Express server
- **Server**: The Express server serves static files from the `dist` directory and handles client-side routing

## Environment Variables

No environment variables are required for basic deployment. The server will use:
- `PORT`: Automatically provided by Railway (defaults to 3000 if not set)

## Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Ensure `npm run build` works locally
- Check Railway build logs for specific errors

### App Doesn't Load
- Verify the build completed successfully
- Check that `dist` folder contains `index.html`
- Review server logs in Railway dashboard

### 404 Errors on Routes
- This is normal for client-side routing - the server handles this by serving `index.html` for all routes

## Files Created for Railway

- `server.js`: Express server to serve static files
- `railway.json`: Railway deployment configuration
- `.railwayignore`: Files to exclude from deployment

## Notes

- Railway automatically detects Node.js projects
- The app will rebuild automatically when you push to your connected branch
- Railway provides HTTPS automatically
- No database configuration needed as requested

