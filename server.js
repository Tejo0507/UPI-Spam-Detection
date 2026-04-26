const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const packageInfo = require('./package.json');

const app = express();
const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.static(publicPath, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return;
    }
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
  }
}));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/meta', (_req, res) => {
  res.status(200).json({
    name: packageInfo.name,
    version: packageInfo.version,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

app.listen(port, () => {
  console.log(`UPI Fraud Keyword Detection running on http://localhost:${port}`);
});
