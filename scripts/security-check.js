import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();

const KNOWN_SECRET_PATTERNS = [
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: 'Groq key', regex: /gsk_[0-9A-Za-z]{20,}/g },
  { name: 'OpenRouter key', regex: /sk-or-v1-[0-9A-Za-z]{20,}/g },
  { name: 'Supabase service role key', regex: /sb_secret_[0-9A-Za-z_-]{20,}/g },
  { name: 'GitHub personal access token', regex: /github_pat_[0-9A-Za-z_]{20,}/g },
  { name: 'Cloudflare token', regex: /cfut_[0-9A-Za-z]{20,}/g },
  { name: 'Generic bearer token', regex: /Bearer\s+[A-Za-z0-9._-]{20,}/gi },
];

const EXCLUDED_SECRET_SCAN_PATHS = new Set([
  '.env.example',
  'LICENSE',
]);

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.zip',
  '.gz',
]);

const ALLOWED_PUBLIC_VITE_KEYS = new Set([
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_TEMPLATE_ID',
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_CHAT_API_URL',
]);

const RISKY_VITE_KEYWORDS = [
  'SECRET',
  'TOKEN',
  'PASSWORD',
  'PRIVATE',
  'SERVICE_ROLE',
  'API_KEY',
  'ACCESS_KEY',
];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function getTrackedFiles() {
  const output = execSync('git ls-files', {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return output
    .split(/\r?\n/)
    .map(file => normalizePath(file.trim()))
    .filter(Boolean);
}

function isBinaryFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(extension);
}

function readUtf8File(absolutePath) {
  const content = fs.readFileSync(absolutePath);
  if (content.includes(0)) {
    return null;
  }
  return content.toString('utf-8');
}

function parseEnvKeys(content) {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0]?.trim())
    .filter(Boolean);
}

function checkTrackedEnvFiles(trackedFiles, findings) {
  const trackedEnvFiles = trackedFiles.filter(file => {
    const fileName = path.basename(file);
    return /^\.env(?:\..+)?$/.test(fileName) && file !== '.env.example';
  });

  for (const file of trackedEnvFiles) {
    findings.push(`${file}: tracked .env file detected (only .env.example should be tracked).`);
  }
}

function checkTrackedFilesForSecrets(trackedFiles, findings) {
  for (const file of trackedFiles) {
    if (EXCLUDED_SECRET_SCAN_PATHS.has(file)) continue;
    if (isBinaryFile(file)) continue;

    const absolutePath = path.join(rootDir, file);
    let content;
    try {
      content = readUtf8File(absolutePath);
    } catch {
      continue;
    }

    if (!content) continue;

    for (const pattern of KNOWN_SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(content)) {
        findings.push(`${file}: possible ${pattern.name} found.`);
      }
    }
  }
}

function checkFrontendEnvUsage(trackedFiles, findings) {
  const frontendFiles = trackedFiles.filter(file => {
    if (!file.startsWith('src/')) return false;
    return /\.(ts|tsx|js|jsx)$/.test(file);
  });

  const accessRegex = /import\.meta\.env\.([A-Z0-9_]+)/g;

  for (const file of frontendFiles) {
    const absolutePath = path.join(rootDir, file);
    let content;
    try {
      content = readUtf8File(absolutePath);
    } catch {
      continue;
    }

    if (!content) continue;

    for (const match of content.matchAll(accessRegex)) {
      const key = match[1];
      if (!key.startsWith('VITE_')) {
        findings.push(`${file}: import.meta.env uses non-VITE key (${key}).`);
      }
    }
  }
}

function checkRiskyViteKeys(findings) {
  const envFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test',
    '.env.example',
  ];

  for (const envFile of envFiles) {
    const absolutePath = path.join(rootDir, envFile);
    if (!fs.existsSync(absolutePath)) continue;

    let content;
    try {
      content = readUtf8File(absolutePath);
    } catch {
      continue;
    }

    if (!content) continue;

    const keys = parseEnvKeys(content);
    for (const key of keys) {
      if (!key.startsWith('VITE_')) continue;
      if (ALLOWED_PUBLIC_VITE_KEYS.has(key)) continue;

      const isRisky = RISKY_VITE_KEYWORDS.some(keyword => key.includes(keyword));
      if (isRisky) {
        findings.push(
          `${envFile}: ${key} looks sensitive but is prefixed with VITE_ (public in frontend).`
        );
      }
    }
  }
}

function run() {
  const findings = [];
  const trackedFiles = getTrackedFiles();

  checkTrackedEnvFiles(trackedFiles, findings);
  checkTrackedFilesForSecrets(trackedFiles, findings);
  checkFrontendEnvUsage(trackedFiles, findings);
  checkRiskyViteKeys(findings);

  if (findings.length > 0) {
    console.error('Security checks failed:\n');
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log('Security checks passed: no tracked secret leaks or risky VITE usage found.');
}

run();
