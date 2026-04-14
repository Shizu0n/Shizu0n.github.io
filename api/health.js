import { applyCors, buildAllowedOrigins, setSecurityHeaders } from './_security.js';

const ALLOWED_ORIGINS = buildAllowedOrigins(process.env.ALLOWED_ORIGINS);

export default function handler(req, res) {
  setSecurityHeaders(res);
  const { allowed } = applyCors(req, res, {
    allowedOrigins: ALLOWED_ORIGINS,
    methods: 'GET,OPTIONS',
    allowedHeaders: 'Content-Type',
  });

  if (req.method === 'OPTIONS') {
    return allowed
      ? res.status(204).end()
      : res.status(403).json({ error: 'Origin not allowed' });
  }

  if (!allowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({ status: 'ok' });
}