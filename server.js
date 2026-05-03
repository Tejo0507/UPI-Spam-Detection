const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const packageInfo = require('./package.json');
const { analyzeMessage, computeHashForString } = require('./shared/detector-core');
const { DEFAULT_KEYWORDS, FRAUD_KEYWORDS_EN, FRAUD_KEYWORDS_HI } = require('./shared/keywords');

const app = express();
const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '200kb' }));
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

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const analysisCache = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 120;
const rateLimitState = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const state = rateLimitState.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > state.resetAt) {
    state.count = 0;
    state.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  state.count += 1;
  rateLimitState.set(ip, state);
  return state.count > RATE_LIMIT_MAX;
}

function readCache(cacheKey) {
  const entry = analysisCache.get(cacheKey);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(cacheKey);
    return null;
  }
  return entry.payload;
}

function writeCache(cacheKey, payload) {
  analysisCache.set(cacheKey, { timestamp: Date.now(), payload });
  if (analysisCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = analysisCache.keys().next().value;
    analysisCache.delete(oldestKey);
  }
}

function selectKeywords(language) {
  const normalized = String(language || '').toLowerCase();
  if (normalized === 'en') {
    return FRAUD_KEYWORDS_EN;
  }
  if (normalized === 'hi') {
    return FRAUD_KEYWORDS_HI;
  }
  return DEFAULT_KEYWORDS;
}

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

app.options('/analyze', (_req, res) => {
  applyCors(res);
  res.status(204).end();
});

app.post('/analyze', (req, res) => {
  applyCors(res);
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({
      status: 'error',
      message: 'Rate limit exceeded. Please retry later.'
    });
    return;
  }

  const message = String(req.body && req.body.message ? req.body.message : '');
  const language = String(req.body && req.body.language ? req.body.language : 'both');
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    res.status(400).json({
      status: 'error',
      message: 'Message input is required.'
    });
    return;
  }

  if (trimmedMessage.length > 10000) {
    res.status(413).json({
      status: 'error',
      message: 'Message input is too large.'
    });
    return;
  }

  const cacheKey = computeHashForString(`${language}|${trimmedMessage.toLowerCase()}`);
  const cached = readCache(cacheKey);
  if (cached) {
    res.status(200).json({
      status: 'ok',
      cached: true,
      analysis: cached,
      meta: {
        version: packageInfo.version,
        language
      }
    });
    return;
  }

  const keywords = selectKeywords(language);
  const analysis = analyzeMessage(trimmedMessage, keywords, { includeHighlight: false });
  const payload = {
    ...analysis,
    language
  };
  writeCache(cacheKey, payload);

  res.status(200).json({
    status: 'ok',
    cached: false,
    analysis: payload,
    meta: {
      version: packageInfo.version,
      language
    }
  });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

app.listen(port, () => {
  console.log(`UPI Fraud Keyword Detection running on http://localhost:${port}`);
});
