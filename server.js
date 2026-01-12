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
app.use(express.static(distPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', distPath, port: PORT });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
  console.log(`Index file exists: ${existsSync(resolve(distPath, 'index.html'))}`);
});

