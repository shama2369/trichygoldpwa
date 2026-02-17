import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
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
  setHeaders: (res, path) => {
    if (path.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', distPath, port: PORT });
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

