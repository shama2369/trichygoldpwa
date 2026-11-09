import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, sep } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';

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

app.set('trust proxy', 1);

// Login gate: one username/password from Railway variables APP_USER and APP_PASS.
// Staff log in ONCE on a login page; a long-lived cookie keeps them signed in
// (also inside the installed app). Install files (manifest, icons, service worker)
// stay public so the browser can offer "Install".
const AUTH_COOKIE = 'tg_auth';
const AUTH_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000; // ~400 days (browser maximum)
const authToken = (u, p) => createHmac('sha256', String(p)).update('trichygold:' + String(u)).digest('hex');
const readCookie = (req, name) => {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
};
const safeEqual = (a, b) => {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
};
const isPublicPath = (p) =>
  p === '/health' ||
  p === '/login' ||
  p === '/sw.js' ||
  p === '/registerSW.js' ||
  p.startsWith('/workbox-') ||
  p === '/manifest.webmanifest' ||
  p === '/favicon.ico' ||
  p === '/apple-touch-icon.png' ||
  p === '/masked-icon.svg' ||
  /^\/icon-[\w-]+\.png$/.test(p);
const loginPage = (error = '') => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#7c3aed">
<link rel="manifest" href="/manifest.webmanifest"><title>Trichy Gold - Login</title>
<style>body{font-family:system-ui,sans-serif;background:#f5f3ff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
form{background:#fff;padding:28px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.08);width:min(320px,90vw)}
h1{font-size:20px;margin:0 0 16px;color:#5b21b6}input{width:100%;box-sizing:border-box;padding:12px;margin:6px 0 12px;border:1px solid #ccc;border-radius:8px;font-size:16px}
button{width:100%;padding:12px;background:#7c3aed;color:#fff;border:0;border-radius:8px;font-size:16px}.e{color:#b91c1c;margin-bottom:10px}</style></head>
<body><form method="post" action="/login"><h1>Trichy Gold</h1>${error ? `<div class="e">${error}</div>` : ''}
<label>Username<input name="username" autocomplete="username" required></label>
<label>Password<input name="password" type="password" autocomplete="current-password" required></label>
<button type="submit">Log in</button></form></body></html>`;

app.get('/login', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.send(loginPage());
});
app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  const U = process.env.APP_USER, P = process.env.APP_PASS;
  if (!U || !P) return res.redirect('/');
  const { username = '', password = '' } = req.body || {};
  if (safeEqual(username, U) && safeEqual(password, P)) {
    const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie(AUTH_COOKIE, authToken(U, P), {
      httpOnly: true, sameSite: 'lax', secure, maxAge: AUTH_MAX_AGE_MS, path: '/'
    });
    return res.redirect('/');
  }
  res.status(401).setHeader('Cache-Control', 'no-store');
  return res.send(loginPage('Wrong username or password'));
});
app.get('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
  res.redirect('/login');
});

app.use((req, res, next) => {
  const U = process.env.APP_USER, P = process.env.APP_PASS;
  if (!U || !P || isPublicPath(req.path)) return next();
  if (safeEqual(readCookie(req, AUTH_COOKIE), authToken(U, P))) return next();
  const wantsPage = req.method === 'GET' && (req.headers.accept || '').includes('text/html');
  if (wantsPage) return res.redirect('/login');
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

// Health check endpoint (includes Railway commit + built JS file so you can verify the live deploy)
app.get('/health', (req, res) => {
  let bundle = null;
  try {
    const html = readFileSync(resolve(distPath, 'index.html'), 'utf8');
    const match = html.match(/\/assets\/(index-[^"]+\.js)/);
    bundle = match ? match[1] : null;
  } catch {
    bundle = null;
  }
  res.status(200).json({
    status: 'ok',
    distPath,
    port: PORT,
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
    bundle
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

