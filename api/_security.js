const DEFAULT_ALLOWED_ORIGINS = [
  'https://shizu0n.vercel.app',
  'https://shizu0n.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /gsk_[0-9A-Za-z]{20,}/g,
  /sk-or-v1-[0-9A-Za-z]{20,}/g,
  /sb_secret_[0-9A-Za-z_-]{20,}/g,
  /github_pat_[0-9A-Za-z_]{20,}/g,
  /cfut_[0-9A-Za-z]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{10,}/gi,
];

function toOriginString(origin) {
  if (typeof origin !== 'string' || origin.trim().length === 0) {
    return null;
  }

  try {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return null;
  }
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
}

function withRedactedSecrets(input) {
  if (typeof input !== 'string' || input.length === 0) {
    return input;
  }

  let sanitized = input;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export function buildAllowedOrigins(rawOrigins = process.env.ALLOWED_ORIGINS) {
  const originList = toStringArray(rawOrigins);
  const source = originList.length > 0 ? originList : DEFAULT_ALLOWED_ORIGINS;
  const normalized = source.map(toOriginString).filter(Boolean);
  return new Set(normalized);
}

export function applyCors(req, res, options = {}) {
  const {
    allowedOrigins = buildAllowedOrigins(),
    methods = 'GET,POST,OPTIONS',
    allowedHeaders = 'Content-Type',
  } = options;

  const requestOrigin = Array.isArray(req.headers.origin)
    ? req.headers.origin[0]
    : req.headers.origin;
  const normalizedOrigin = toOriginString(requestOrigin);
  const allowed = !requestOrigin || (normalizedOrigin ? allowedOrigins.has(normalizedOrigin) : false);

  if (allowed && normalizedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
    res.setHeader('Vary', 'Origin');
  } else if (requestOrigin) {
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
  res.setHeader('Access-Control-Max-Age', '86400');

  return { allowed, requestOrigin, normalizedOrigin };
}

export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
}

export function getClientIp(req) {
  const realIpHeader = Array.isArray(req.headers['x-real-ip'])
    ? req.headers['x-real-ip'][0]
    : req.headers['x-real-ip'];

  const forwardedFor = Array.isArray(req.headers['x-forwarded-for'])
    ? req.headers['x-forwarded-for'][0]
    : req.headers['x-forwarded-for'];

  const firstForwardedIp =
    typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : null;

  return realIpHeader || firstForwardedIp || req.socket?.remoteAddress || 'unknown';
}

export function sanitizeErrorForLogs(error) {
  if (!error || typeof error !== 'object') {
    return { message: withRedactedSecrets(String(error || 'Unknown error')) };
  }

  const maybeMessage = typeof error.message === 'string' ? error.message : String(error);
  const maybeName = typeof error.name === 'string' ? error.name : 'Error';
  const maybeStatus = typeof error.status === 'number' ? error.status : undefined;
  const maybeCode = typeof error.code === 'string' ? error.code : undefined;

  return {
    name: maybeName,
    status: maybeStatus,
    code: maybeCode,
    message: withRedactedSecrets(maybeMessage),
  };
}
