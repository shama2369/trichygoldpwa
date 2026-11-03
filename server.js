import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, sep } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
const distPath = resolve(__dirname, 'dist');

// Check if dist directory exists
if (!existsSync(distPath)) {
  console.error(`ERROR: dist directory not found at ${distPath}`);
  console.error('Please ensure "npm run build" has been executed successfully.');
  process.exit(1);
}

// Login gate: one username/password from Railway variables APP_USER and APP_PASS
app.use((req, res, next) => {
  const U = process.env.APP_USER, P = process.env.APP_PASS;
  if (!U || !P || req.path === '/health') return next();
  const h = req.headers.authorization || '';
  if (h.startsWith('Basic ')) {
    const [u, ...rest] = Buffer.from(h.slice(6), 'base64').toString().split(':');
    if (u === U && rest.join(':') === P) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Trichy Gold"');
  return res.status(401).send('Login required');
});

// Set proper MIME types for PWA files
app.use((req, res, next) => {
  if (req.path.endsWith('.webmanifest')) {
    res.type('application/manifest+json');
  } else if (req.path.endsWith('.js') && req.path.includes('sw')) {
    res.type('application/javascript');
  }
  next();
});

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
    // Always revalidate HTML / SW so new deploys are not stuck behind PWA cache
    if (
      filePath.endsWith('index.html') ||
      filePath.endsWith('sw.js') ||
      filePath.endsWith('registerSW.js') ||
      filePath.endsWith('.webmanifest')
    ) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes(`${sep}assets${sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Health check endpoint (includes Railway commit so you can verify the live deploy)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    distPath,
    port: PORT,
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'local'
  });
});

// Error handling middleware (must be before catch-all route)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal server error');
});

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = resolve(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  } else {
    console.error(`Index file not found at: ${indexPath}`);
    res.status(404).send('Build files not found. Please run "npm run build" first.');
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
  console.log(`Index file exists: ${existsSync(resolve(distPath, 'index.html'))}`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

