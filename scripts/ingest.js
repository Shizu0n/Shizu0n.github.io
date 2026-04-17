import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY in .env');
  process.exit(1);
}

const knowledgePath = path.resolve(process.cwd(), 'data', 'portfolio-knowledge.json');
if (!fs.existsSync(knowledgePath)) {
  console.error('Missing data/portfolio-knowledge.json. Run npm run knowledge:build first.');
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
const chunks = artifact?.chat_runtime?.chunks;

if (!Array.isArray(chunks) || chunks.length === 0) {
  console.error('No runtime chunks found in data/portfolio-knowledge.json');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function main() {
  console.log(`Starting RAG ingestion for ${chunks.length} chunks...`);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  console.log('Cleaning up previous chunks...');
  const { error: deleteError } = await supabase.from('chunks').delete().neq('id', -1);
  if (deleteError) {
    throw deleteError;
  }

  for (const chunk of chunks) {
    console.log(`Embedding ${chunk.id} (${chunk.type}/${chunk.facet})...`);
    const result = await model.embedContent(chunk.content);
    const embedding = result.embedding.values;

    const metadata = {
      chunk_id: chunk.id,
      type: chunk.type,
      project_id: chunk.project_id,
      facet: chunk.facet,
      language: chunk.language,
      stack: chunk.stack,
      stacks: chunk.stacks || [],
      tags: chunk.tags || []
    };

    const { error } = await supabase.from('chunks').insert({
      content: chunk.content,
      metadata,
      embedding
    });

    if (error) {
      throw error;
    }
  }

  console.log('RAG database updated successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
