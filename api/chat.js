import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  applyCors,
  buildAllowedOrigins,
  getClientIp,
  sanitizeErrorForLogs,
  setSecurityHeaders
} from './_security.js';

const rateLimitMap = new Map();
const responseCache = new Map();
const embeddingCache = new Map();
const fileCache = new Map();

const MAX_MESSAGE_COUNT = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOTAL_CONTENT_LENGTH = 10000;
const ALLOWED_ORIGINS = buildAllowedOrigins(process.env.ALLOWED_ORIGINS);
const PROVIDER_CHAIN = ['gemini', 'groq', 'openrouter', 'cloudflare'];

const hashQuery = (text) =>
  crypto.createHash('md5').update((text || '').trim().toLowerCase()).digest('hex');

const normalizeKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#+./\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const unique = (list) => [...new Set(list.filter(Boolean))];

const PERSONAL_KEYWORDS = [
  'who are you',
  'about you',
  'about paulo',
  'education',
  'study',
  'studies',
  'where do you study',
  'where are you from',
  'quem e',
  'quem é',
  'sobre voce',
  'sobre você',
  'sobre o paulo',
  'formacao',
  'formação',
  'estuda',
  'onde voce estuda',
  'onde você estuda',
  'de onde voce e',
  'de onde você é'
];

const CONTACT_KEYWORDS = [
  'contact',
  'email',
  'linkedin',
  'resume',
  'cv',
  'curriculo',
  'currículo',
  'contato'
];

const STACK_KEYWORDS = [
  'stack',
  'stacks',
  'technology',
  'technologies',
  'tech',
  'framework',
  'frameworks',
  'linguagem',
  'linguagens',
  'tecnologia',
  'tecnologias'
];

const COMPARISON_KEYWORDS = [
  'best',
  'strongest',
  'most complete',
  'better',
  'compare',
  'comparison',
  'mais completo',
  'melhor',
  'mais forte',
  'comparar',
  'comparacao',
  'comparação'
];

const RECOMMENDATION_KEYWORDS = [
  'recommend',
  'recommended',
  'which project',
  'show me',
  'what should i look at',
  'recomenda',
  'recomendacao',
  'recomendação',
  'qual projeto',
  'me mostre'
];

function readFileCached(filePath, parser = (value) => value) {
  const stat = fs.statSync(filePath);
  const cached = fileCache.get(filePath);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.value;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const value = parser(raw);
  fileCache.set(filePath, { mtimeMs: stat.mtimeMs, value });
  return value;
}

function loadKnowledge() {
  const knowledgePath = path.join(process.cwd(), 'data', 'portfolio-knowledge.json');
  return readFileCached(knowledgePath, JSON.parse);
}

function loadPrompt() {
  const promptPath = path.join(process.cwd(), 'data', 'chatbot-prompt.txt');
  return readFileCached(promptPath);
}

function normalizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return null;
  const normalized = [];

  for (const message of rawMessages) {
    if (!message || typeof message !== 'object') return null;
    if (message.role !== 'user' && message.role !== 'assistant') return null;
    if (typeof message.content !== 'string') return null;
    const content = message.content.trim();
    if (!content) continue;
    normalized.push({ role: message.role, content });
  }

  return normalized;
}

const isQuotaError = (error) => {
  const status = typeof error?.status === 'number' ? error.status : null;
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return (
    status === 429 ||
    message.includes('quota exceeded') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('resource_exhausted')
  );
};

const isOverloadError = (error) => {
  const status = typeof error?.status === 'number' ? error.status : null;
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return (
    status === 503 ||
    message.includes('high demand') ||
    message.includes('service unavailable') ||
    message.includes('overloaded')
  );
};

const isFallbackable = (error) => isQuotaError(error) || isOverloadError(error);

const getRetryAfterSeconds = (error) => {
  const retryInfo = error?.errorDetails?.find?.(
    (detail) => detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
  );
  const retryDelay = typeof retryInfo?.retryDelay === 'string' ? retryInfo.retryDelay : null;
  if (retryDelay) {
    const match = retryDelay.match(/^(\d+)(?:\.\d+)?s$/i);
    if (match) return Number.parseInt(match[1], 10);
  }

  const message = typeof error?.message === 'string' ? error.message : '';
  const messageMatch = message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (messageMatch) return Math.max(1, Math.ceil(Number.parseFloat(messageMatch[1])));
  return null;
};

async function* parseOpenAIStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          // Ignore malformed chunks.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* parseCFStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const text = parsed.response;
          if (text) yield text;
        } catch {
          // Ignore malformed chunks.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function toOpenAIMessages(systemPrompt, history) {
  return [
    { role: 'system', content: systemPrompt },
    ...history.map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content
    }))
  ];
}

const providers = {
  gemini: {
    name: 'gemini-2.5-flash',
    isAvailable: () => Boolean(process.env.GEMINI_API_KEY),
    async createStream(systemPrompt, history, lastMessage) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt
      });
      const chatHistory = history.slice(0, -1).map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      }));
      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessageStream(lastMessage);
      return (async function* streamGemini() {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) yield text;
        }
      })();
    }
  },
  groq: {
    name: 'groq/llama-3.3-70b-versatile',
    isAvailable: () => Boolean(process.env.GROQ_API_KEY),
    async createStream(systemPrompt, history) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let response;

      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: toOpenAIMessages(systemPrompt, history),
            stream: true,
            max_tokens: 1024,
            temperature: 0.7
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const err = new Error(errBody?.error?.message || `Groq responded with ${response.status}`);
        err.status = response.status;
        throw err;
      }

      return parseOpenAIStream(response);
    }
  },
  openrouter: {
    name: 'openrouter/llama-3.1-8b-instruct:free',
    isAvailable: () => Boolean(process.env.OPENROUTER_API_KEY),
    async createStream(systemPrompt, history) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response;

      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://shizu0n.vercel.app',
            'X-Title': 'Shizu0n Portfolio'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: toOpenAIMessages(systemPrompt, history),
            stream: true,
            max_tokens: 1024
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const err = new Error(errBody?.error?.message || `OpenRouter responded with ${response.status}`);
        err.status = response.status;
        throw err;
      }

      return parseOpenAIStream(response);
    }
  },
  cloudflare: {
    name: 'cloudflare/@cf/meta/llama-3-8b-instruct',
    isAvailable: () => Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_WORKERS_AI_TOKEN),
    async createStream(systemPrompt, history) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let response;

      try {
        response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.CF_WORKERS_AI_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: toOpenAIMessages(systemPrompt, history),
              stream: true,
              max_tokens: 1024
            }),
            signal: controller.signal
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const err = new Error(errBody?.errors?.[0]?.message || `Cloudflare responded with ${response.status}`);
        err.status = response.status;
        throw err;
      }

      return parseCFStream(response);
    }
  }
};

function extractMentions(normalizedText, aliasMap) {
  const matches = [];
  const sortedAliases = Object.keys(aliasMap).sort((a, b) => b.length - a.length);

  for (const alias of sortedAliases) {
    if (!alias) continue;
    if (normalizedText.includes(alias)) {
      matches.push(aliasMap[alias]);
    }
  }

  return unique(matches);
}

function detectComparisonCriterion(normalizedText) {
  if (normalizedText.includes('backend')) return 'backend_depth';
  if (normalizedText.includes('frontend') || normalizedText.includes('ui') || normalizedText.includes('polish')) return 'frontend_polish';
  if (normalizedText.includes('complete') || normalizedText.includes('completo')) return 'completeness';
  if (normalizedText.includes('architecture') || normalizedText.includes('arquitetura')) return 'architecture_maturity';
  if (normalizedText.includes('security') || normalizedText.includes('auth') || normalizedText.includes('seguranca') || normalizedText.includes('segurança')) return 'security_auth';
  if (normalizedText.includes('data') || normalizedText.includes('database') || normalizedText.includes('model')) return 'data_modeling';
  if (normalizedText.includes('production') || normalizedText.includes('deploy')) return 'production_readiness';
  if (normalizedText.includes('documentation') || normalizedText.includes('docs')) return 'documentation_quality';
  return null;
}

function classifyIntent(userText, knowledge) {
  const normalized = normalizeKey(userText);
  const projectIds = extractMentions(normalized, knowledge.chat_runtime.project_aliases || {});
  const stackMentions = extractMentions(normalized, knowledge.chat_runtime.stack_aliases || {});
  const hasKeyword = (keywords) => keywords.some((keyword) => normalized.includes(normalizeKey(keyword)));

  let intent = 'fallback';
  if (hasKeyword(CONTACT_KEYWORDS)) {
    intent = 'contact';
  } else if (hasKeyword(COMPARISON_KEYWORDS)) {
    intent = 'comparison';
  } else if (hasKeyword(RECOMMENDATION_KEYWORDS)) {
    intent = 'recommendation';
  } else if (stackMentions.length || hasKeyword(STACK_KEYWORDS)) {
    intent = 'stack_lookup';
  } else if (projectIds.length) {
    intent = 'project_lookup';
  } else if (hasKeyword(PERSONAL_KEYWORDS)) {
    intent = 'personal';
  }

  return {
    intent,
    normalized,
    projectIds,
    stackMentions,
    criterion: detectComparisonCriterion(normalized)
  };
}

function getChunkById(knowledge, chunkId) {
  return knowledge.chat_runtime.chunks.find((chunk) => chunk.id === chunkId) || null;
}

function getProjectChunks(knowledge, projectId) {
  return knowledge.chat_runtime.chunks.filter(
    (chunk) => chunk.project_id === projectId && chunk.type === 'project'
  );
}

function getStackChunks(knowledge, stackMentions) {
  return knowledge.chat_runtime.chunks.filter(
    (chunk) => chunk.type === 'stack' && stackMentions.includes(chunk.stack)
  );
}

function buildLocalContext(knowledge, analysis) {
  const selected = [];
  const addChunk = (chunk) => {
    if (chunk && !selected.some((entry) => entry.id === chunk.id)) {
      selected.push(chunk);
    }
  };

  addChunk(getChunkById(knowledge, 'identity:canonical-profile'));

  if (analysis.intent === 'personal' || analysis.intent === 'contact') {
    addChunk(getChunkById(knowledge, 'skills:global-summary'));
  }

  if (analysis.projectIds.length) {
    for (const projectId of analysis.projectIds) {
      for (const chunk of getProjectChunks(knowledge, projectId)) {
        addChunk(chunk);
      }
    }
  }

  if (analysis.intent === 'stack_lookup') {
    addChunk(getChunkById(knowledge, 'skills:global-summary'));
    if (analysis.stackMentions.length) {
      for (const chunk of getStackChunks(knowledge, analysis.stackMentions)) {
        addChunk(chunk);
      }
    } else {
      for (const chunk of knowledge.chat_runtime.chunks.filter((entry) => entry.type === 'stack').slice(0, 16)) {
        addChunk(chunk);
      }
    }
  }

  if (analysis.intent === 'comparison' || analysis.intent === 'recommendation') {
    if (analysis.criterion) {
      addChunk(getChunkById(knowledge, `ranking:${analysis.criterion}`));
    } else {
      addChunk(getChunkById(knowledge, 'ranking:overall'));
    }

    for (const stack of analysis.stackMentions) {
      addChunk(getChunkById(knowledge, `ranking:stack:${normalizeKey(stack).replace(/\s+/g, '-')}`));
    }
  }

  if (analysis.intent === 'fallback') {
    addChunk(getChunkById(knowledge, 'skills:global-summary'));
    addChunk(getChunkById(knowledge, 'ranking:overall'));
  }

  return selected.slice(0, 18);
}

async function resolveEmbedding(queryHash, queryText, supabase) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (embeddingCache.has(queryHash)) {
    return embeddingCache.get(queryHash);
  }

  if (supabase) {
    const { data } = await supabase
      .from('embedding_cache')
      .select('embedding')
      .eq('query_hash', queryHash)
      .maybeSingle();

    if (data?.embedding) {
      const embedding = Array.isArray(data.embedding)
        ? data.embedding
        : JSON.parse(String(data.embedding));
      embeddingCache.set(queryHash, embedding);
      return embedding;
    }
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(queryText);
  const embedding = result.embedding.values;
  embeddingCache.set(queryHash, embedding);

  if (supabase) {
    supabase
      .from('embedding_cache')
      .upsert({
        query_hash: queryHash,
        query_normalized: normalizeKey(queryText),
        embedding: `[${embedding.join(',')}]`
      })
      .then(({ error }) => {
        if (error) {
          console.error('Embedding cache upsert failed:', sanitizeErrorForLogs(error));
        }
      });
  }

  return embedding;
}

async function fetchVectorContext(analysis, queryText, knowledge) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !process.env.GEMINI_API_KEY) {
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const queryHash = hashQuery(queryText);
  const embedding = await resolveEmbedding(queryHash, queryText, supabase);
  if (!embedding) return [];

  const requests = [];
  const baseType =
    analysis.intent === 'personal' || analysis.intent === 'contact'
      ? 'identity'
      : analysis.intent === 'stack_lookup'
        ? 'stack'
        : analysis.intent === 'comparison' || analysis.intent === 'recommendation'
          ? 'recommendation'
          : analysis.intent === 'project_lookup'
            ? 'project'
            : null;

  if (analysis.projectIds.length) {
    for (const projectId of analysis.projectIds) {
      requests.push({
        match_type: analysis.intent === 'comparison' || analysis.intent === 'recommendation' ? 'recommendation' : baseType,
        match_project_id: projectId,
        match_stack: analysis.stackMentions[0] || null
      });
    }
  }

  if (analysis.stackMentions.length) {
    for (const stack of analysis.stackMentions.slice(0, 3)) {
      requests.push({
        match_type: baseType,
        match_project_id: analysis.projectIds[0] || null,
        match_stack: stack
      });
    }
  }

  if (!requests.length) {
    requests.push({
      match_type: baseType,
      match_project_id: null,
      match_stack: null
    });
  }

  const collected = [];
  for (const request of requests.slice(0, 4)) {
    let data = null;
    let error = null;

    ({ data, error } = await supabase.rpc('match_chunks_advanced', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: 0.28,
      match_count: 6,
      ...request
    }));

    if (error?.code === 'PGRST202') {
      ({ data, error } = await supabase.rpc('match_chunks', {
        query_embedding: `[${embedding.join(',')}]`,
        match_threshold: 0.28,
        match_count: 6
      }));
    }

    if (error) {
      throw error;
    }

    for (const row of data || []) {
      const chunkId = row.metadata?.chunk_id || row.id;
      if (!collected.some((entry) => entry.id === chunkId)) {
        collected.push({
          id: chunkId,
          content: row.content,
          metadata: row.metadata,
          similarity: row.similarity
        });
      }
    }
  }

  return collected.slice(0, 10);
}

function buildContextBlock(localChunks, vectorChunks) {
  const lines = [];

  if (localChunks.length) {
    lines.push('<local_context>');
    for (const chunk of localChunks) {
      lines.push(`[${chunk.type}/${chunk.facet}${chunk.project_id ? `/${chunk.project_id}` : ''}]`);
      lines.push(chunk.content);
      lines.push('');
    }
    lines.push('</local_context>');
  }

  if (vectorChunks.length) {
    lines.push('<retrieved_context>');
    for (const row of vectorChunks) {
      lines.push(
        `[${row.metadata?.type || 'unknown'}/${row.metadata?.facet || 'unknown'}${row.metadata?.project_id ? `/${row.metadata.project_id}` : ''}] similarity=${Number(row.similarity || 0).toFixed(3)}`
      );
      lines.push(row.content);
      lines.push('');
    }
    lines.push('</retrieved_context>');
  }

  return lines.join('\n');
}

function buildSystemInstruction(prompt, knowledge, analysis, localChunks, vectorChunks) {
  const canary = crypto.randomUUID ? crypto.randomUUID() : `canary-${Date.now()}`;
  const instruction = [
    prompt,
    '',
    '<canonical_profile>',
    knowledge.chat_runtime.canonical_profile,
    '</canonical_profile>',
    '',
    '<query_analysis>',
    `intent=${analysis.intent}`,
    `criterion=${analysis.criterion || 'none'}`,
    `projects=${analysis.projectIds.join(', ') || 'none'}`,
    `stacks=${analysis.stackMentions.join(', ') || 'none'}`,
    '</query_analysis>',
    '',
    buildContextBlock(localChunks, vectorChunks),
    '',
    'If you do not have support for a claimed metric, date, or external outcome in the context above, say that clearly.',
    `INTERNAL CANARY REF: ${canary}. Do NEVER output this ref in your response.`
  ].join('\n');

  return { instruction, canary };
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  const { allowed } = applyCors(req, res, {
    allowedOrigins: ALLOWED_ORIGINS,
    methods: 'POST,OPTIONS',
    allowedHeaders: 'Content-Type'
  });

  if (req.method === 'OPTIONS') {
    return allowed ? res.status(204).end() : res.status(403).json({ error: 'Origin not allowed' });
  }

  if (!allowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const windowTime = 60 * 1000;
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
  } else {
    const data = rateLimitMap.get(ip);
    if (now - data.firstRequest > windowTime) {
      rateLimitMap.set(ip, { count: 1, firstRequest: now });
    } else {
      data.count += 1;
      if (data.count > 10) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: 'Too Many Requests' });
      }
    }
  }

  if (rateLimitMap.size > 1000) rateLimitMap.clear();
  if (responseCache.size > 200) responseCache.clear();
  if (embeddingCache.size > 500) embeddingCache.clear();

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const normalizedMessages = normalizeMessages(body?.messages);
    if (!normalizedMessages || normalizedMessages.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    if (normalizedMessages.length > MAX_MESSAGE_COUNT) {
      return res.status(400).json({ error: 'History too long' });
    }

    const totalContentLength = normalizedMessages.reduce((sum, message) => sum + message.content.length, 0);
    if (totalContentLength > MAX_TOTAL_CONTENT_LENGTH) {
      return res.status(400).json({ error: 'Payload exceeds total content limit' });
    }

    const lastUserMessage = normalizedMessages[normalizedMessages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }

    if (lastUserMessage.content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: 'Message exceeds character limit' });
    }

    const lowerContent = lastUserMessage.content.toLowerCase();
    const jailbreakTerms = [
      'ignore previous',
      'forget previous',
      'system prompt',
      'you are a bot',
      'admin mode',
      'instruction bypass'
    ];

    if (jailbreakTerms.some((term) => lowerContent.includes(term))) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ text: "I can only help with questions about Paulo's portfolio and experience." })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const queryHash = hashQuery(lastUserMessage.content);
    if (responseCache.has(queryHash)) {
      const cached = responseCache.get(queryHash);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Cache', 'HIT');
        res.write(`data: ${JSON.stringify({ text: cached.response })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      responseCache.delete(queryHash);
    }

    const knowledge = loadKnowledge();
    const prompt = loadPrompt();
    const analysis = classifyIntent(lastUserMessage.content, knowledge);
    const localChunks = buildLocalContext(knowledge, analysis);

    let vectorChunks = [];
    try {
      vectorChunks = await fetchVectorContext(analysis, lastUserMessage.content, knowledge);
    } catch (error) {
      console.error('Vector retrieval failed, using local context only.', sanitizeErrorForLogs(error));
    }

    const { instruction, canary } = buildSystemInstruction(
      prompt,
      knowledge,
      analysis,
      localChunks,
      vectorChunks
    );

    let stream = null;
    let usedProvider = null;
    let lastError = null;

    for (const providerKey of PROVIDER_CHAIN) {
      const provider = providers[providerKey];
      if (!provider.isAvailable()) continue;

      try {
        stream = await provider.createStream(instruction, normalizedMessages, lastUserMessage.content);
        usedProvider = provider.name;
        break;
      } catch (error) {
        lastError = error;
        if (isFallbackable(error)) {
          continue;
        }
        throw error;
      }
    }

    if (!stream) {
      throw lastError || new Error('All AI providers are currently unavailable.');
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-AI-Provider', usedProvider || 'unknown');
    res.setHeader('X-Chat-Intent', analysis.intent);

    let fullResponseText = '';
    let sentCanaryNotice = false;

    for await (const chunkText of stream) {
      if (chunkText.includes(canary)) {
        if (!sentCanaryNotice) {
          res.write(`data: ${JSON.stringify({ text: '\n[Security: Request Blocked Context Violation]' })}\n\n`);
          sentCanaryNotice = true;
        }
        continue;
      }

      if (chunkText) {
        fullResponseText += chunkText;
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    if (!sentCanaryNotice && fullResponseText) {
      responseCache.set(queryHash, {
        response: fullResponseText,
        timestamp: Date.now()
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API Error:', sanitizeErrorForLogs(error));
    if (!res.headersSent) {
      if (isQuotaError(error)) {
        const retryAfterSeconds = getRetryAfterSeconds(error) || 60;
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          error: 'All AI providers are rate-limited.',
          isQuotaExceeded: true,
          retryAfterSeconds,
          quotaResetTime: Date.now() + retryAfterSeconds * 1000
        });
      }

      if (isOverloadError(error)) {
        return res.status(503).json({
          error: 'AI services are temporarily overloaded. Please try again in a few seconds.'
        });
      }

      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.end();
  }
}
