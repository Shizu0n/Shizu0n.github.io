import fs from 'fs/promises';
import path from 'path';
import process from 'process';

const ROOT = process.cwd();
const KNOWLEDGE_PATH = path.join(ROOT, 'data', 'portfolio-knowledge.json');
const EVALS_PATH = path.join(ROOT, 'data', 'chatbot', 'evals.json');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const knowledge = JSON.parse(await fs.readFile(KNOWLEDGE_PATH, 'utf8'));
  const evals = JSON.parse(await fs.readFile(EVALS_PATH, 'utf8'));

  assert(Array.isArray(knowledge.projects) && knowledge.projects.length === 5, 'Expected 5 scoped projects.');
  assert(Array.isArray(knowledge.stack_inventory) && knowledge.stack_inventory.length > 0, 'Stack inventory is empty.');
  assert(Array.isArray(knowledge.chat_runtime?.chunks) && knowledge.chat_runtime.chunks.length > 0, 'Runtime chunks are missing.');
  assert(typeof knowledge.chat_runtime?.canonical_profile === 'string', 'Canonical profile is missing.');

  for (const project of knowledge.projects) {
    assert(project.problem?.en && project.problem?.pt, `Missing problem text for ${project.id}.`);
    assert(project.solution?.en && project.solution?.pt, `Missing solution text for ${project.id}.`);
    assert(Array.isArray(project.all_stacks) && project.all_stacks.length > 0, `Missing stacks for ${project.id}.`);
    assert(project.metrics_engineering, `Missing engineering metrics for ${project.id}.`);
    assert(project.metrics_functional, `Missing functional metrics for ${project.id}.`);
    assert(Array.isArray(project.evidence_sources) && project.evidence_sources.length > 0, `Missing evidence sources for ${project.id}.`);
  }

  for (const stack of knowledge.stack_inventory) {
    assert(Array.isArray(stack.projects) && stack.projects.length > 0, `Stack ${stack.name} is not linked to any project.`);
  }

  const requiredCriteria = [
    'completeness',
    'backend_depth',
    'frontend_polish',
    'architecture_maturity',
    'security_auth',
    'data_modeling',
    'functional_scope',
    'documentation_quality',
    'production_readiness'
  ];

  for (const card of knowledge.recommendation_scorecards) {
    for (const criterion of requiredCriteria) {
      assert(card.scores?.[criterion]?.score >= 1 && card.scores?.[criterion]?.score <= 5, `Invalid score for ${card.project_id}:${criterion}.`);
    }
  }

  assert(Array.isArray(evals) && evals.length >= 12, 'Expected at least 12 eval cases.');
  for (const entry of evals) {
    assert(typeof entry.question === 'string' && entry.question.trim().length > 0, `Eval ${entry.id} is missing a question.`);
    assert(Array.isArray(entry.must_include) && entry.must_include.length > 0, `Eval ${entry.id} is missing must_include.`);
  }

  console.log('Chatbot knowledge artifact validated successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
