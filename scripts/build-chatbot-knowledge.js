import fs from 'fs/promises';
import path from 'path';
import process from 'process';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const CHATBOT_DIR = path.join(DATA_DIR, 'chatbot');
const OUTPUT_PATH = path.join(DATA_DIR, 'portfolio-knowledge.json');
const CV_PATH = path.join(ROOT, 'cv.md');

const REPO_ORDER = ['AcademicSystem', 'DeliverySystem', 'GymManagement', 'ReferralSystem', 'Shizu0n-CV'];
const STACK_SPOTLIGHTS = ['java', 'react', 'nestjs', 'spring-boot', 'typescript', 'mysql'];

const STACK_ALIAS_OVERRIDES = {
  ts: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  node: 'Node.js',
  nodejs: 'Node.js',
  react: 'React',
  'react 18': 'React 18',
  'react 19': 'React 19',
  vite: 'Vite',
  nest: 'NestJS',
  nestjs: 'NestJS',
  spring: 'Spring Boot',
  'spring boot': 'Spring Boot',
  springboot: 'Spring Boot',
  swing: 'Java Swing',
  mysql: 'MySQL',
  sqlite: 'SQLite',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  pgvector: 'pgvector',
  jwt: 'JWT',
  typeorm: 'TypeORM',
  'framer motion': 'Framer Motion 12',
  framer: 'Framer Motion 12',
  tailwind: 'Tailwind CSS 4',
  supabase: 'Supabase',
  vercel: 'Vercel Functions'
};

const STACK_RANKING_RULES = {
  java: { backend_depth: 0.45, architecture_maturity: 0.35, data_modeling: 0.2 },
  react: { frontend_polish: 0.45, completeness: 0.35, production_readiness: 0.2 },
  nestjs: { backend_depth: 0.45, security_auth: 0.3, architecture_maturity: 0.25 },
  'spring-boot': { backend_depth: 0.45, functional_scope: 0.3, data_modeling: 0.25 },
  typescript: { architecture_maturity: 0.35, frontend_polish: 0.35, backend_depth: 0.3 },
  mysql: { data_modeling: 0.45, functional_scope: 0.3, backend_depth: 0.25 }
};

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#+./\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function fetchGitHubJson(url) {
  const headers = {
    'User-Agent': 'Shizu0n-CV-knowledge-builder',
    Accept: 'application/vnd.github+json'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

function decodeReadme(content = '') {
  return Buffer.from(content, 'base64').toString('utf8');
}

function getReadmeHeadings(readme) {
  return unique(
    readme
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('#'))
      .map((line) => line.replace(/^#+\s*/, ''))
  );
}

function computeTreeMetrics(tree) {
  const paths = Array.isArray(tree?.tree) ? tree.tree.map((entry) => entry.path) : [];
  const topLevelCounts = {};
  for (const repoPath of paths) {
    const key = repoPath.split('/')[0];
    topLevelCounts[key] = (topLevelCounts[key] || 0) + 1;
  }

  return {
    total_items: paths.length,
    source_like_items: paths.filter((item) => /(^|\/)(src|app|frontend|backend|server|client|api|database)(\/|$)/i.test(item)).length,
    test_like_items: paths.filter((item) => /(^|\/)(test|tests|__tests__|spec)(\/|$)/i.test(item)).length,
    docs_like_items: paths.filter((item) => /(^|\/)(docs|diagrams|README)/i.test(item)).length,
    env_example_count: paths.filter((item) => /\.env(\.example)?$/i.test(item)).length,
    top_level_areas: Object.entries(topLevelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }))
  };
}

function computeLanguageBreakdown(languages) {
  const entries = Object.entries(languages || {});
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  if (!total) return [];

  return entries
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: Number(((Number(bytes) / total) * 100).toFixed(2))
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

function getProjectStackCategories(project, stackName) {
  const categories = [];
  if (project.frontend_stack.includes(stackName)) categories.push('frontend');
  if (project.backend_stack.includes(stackName)) categories.push('backend');
  if (project.database_stack.includes(stackName)) categories.push('database');
  if (project.tooling_stack.includes(stackName)) categories.push('tooling');
  return categories;
}

function buildStackInventory(projects) {
  const stackMap = new Map();

  for (const project of projects) {
    for (const stackName of project.all_stacks) {
      if (!stackMap.has(stackName)) {
        stackMap.set(stackName, {
          name: stackName,
          categories: [],
          projects: [],
          evidence_sources: []
        });
      }

      const entry = stackMap.get(stackName);
      const categories = getProjectStackCategories(project, stackName);
      entry.categories = unique([...entry.categories, ...categories]);
      entry.projects.push({
        project_id: project.id,
        project_name: project.display_name,
        roles: categories,
        why_it_matters_en: project.summary_en,
        why_it_matters_pt: project.summary_pt
      });
      entry.evidence_sources = unique([
        ...entry.evidence_sources,
        ...project.evidence_sources.map((source) => `${source.kind}:${source.locator}`)
      ]);
    }
  }

  return [...stackMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function buildDeclaredSkills(profile, stackInventory) {
  const stackNames = new Set(stackInventory.map((stack) => stack.name));
  const allDeclared = unique(
    Object.values(profile.declared_skills).flatMap((items) => items)
  );

  return {
    ...profile.declared_skills,
    additional_declared_skills: allDeclared.filter((item) => !stackNames.has(item))
  };
}

function computeWeightedScore(scoreCard, weights) {
  return Number(
    Object.entries(weights)
      .reduce((sum, [criterion, weight]) => {
        const criterionScore = scoreCard.scores[criterion]?.score ?? 0;
        return sum + criterionScore * weight;
      }, 0)
      .toFixed(3)
  );
}

function buildRankings(scoreCards, weights) {
  const scored = scoreCards.map((card) => ({
    project_id: card.project_id,
    overall_score: computeWeightedScore(card, weights),
    summary_pt: card.summary_pt,
    summary_en: card.summary_en
  }));

  const overall = [...scored].sort((a, b) => b.overall_score - a.overall_score);

  const byCriterion = {};
  for (const criterion of Object.keys(weights)) {
    byCriterion[criterion] = scoreCards
      .map((card) => ({
        project_id: card.project_id,
        score: card.scores[criterion].score,
        reason_pt: card.scores[criterion].reason_pt,
        reason_en: card.scores[criterion].reason_en
      }))
      .sort((a, b) => b.score - a.score);
  }

  return { overall, by_criterion: byCriterion };
}

function buildStackRankings(projects, scoreCardsById) {
  const result = {};

  for (const [stackKey, weights] of Object.entries(STACK_RANKING_RULES)) {
    const ranked = projects
      .filter((project) => project.recommendation_tags.includes(stackKey))
      .map((project) => {
        const scoreCard = scoreCardsById.get(project.id);
        const score = Number(
          Object.entries(weights)
            .reduce((sum, [criterion, weight]) => sum + scoreCard.scores[criterion].score * weight, 0)
            .toFixed(3)
        );

        return {
          project_id: project.id,
          project_name: project.display_name,
          score,
          summary_pt: scoreCard.summary_pt,
          summary_en: scoreCard.summary_en
        };
      })
      .sort((a, b) => b.score - a.score);

    result[stackKey] = ranked;
  }

  return result;
}

function buildProjectRecord(project, repoSnapshot) {
  const lastActivityDays = Math.floor(
    (Date.now() - new Date(repoSnapshot.meta.pushed_at).getTime()) / (24 * 60 * 60 * 1000)
  );

  return {
    ...project,
    github: {
      full_name: repoSnapshot.meta.full_name,
      html_url: repoSnapshot.meta.html_url,
      homepage: repoSnapshot.meta.homepage,
      default_branch: repoSnapshot.meta.default_branch,
      description: repoSnapshot.meta.description,
      primary_language: repoSnapshot.meta.language,
      stars: repoSnapshot.meta.stargazers_count,
      forks: repoSnapshot.meta.forks_count,
      watchers: repoSnapshot.meta.watchers_count,
      open_issues: repoSnapshot.meta.open_issues_count,
      size_kb: repoSnapshot.meta.size,
      created_at: repoSnapshot.meta.created_at,
      pushed_at: repoSnapshot.meta.pushed_at,
      topics: repoSnapshot.meta.topics || [],
      language_breakdown: computeLanguageBreakdown(repoSnapshot.languages),
      readme_headings: getReadmeHeadings(repoSnapshot.readme),
      tree_metrics: repoSnapshot.treeMetrics,
      last_activity_days: lastActivityDays
    },
    metrics_engineering: {
      ...project.metrics_engineering,
      languages: computeLanguageBreakdown(repoSnapshot.languages),
      dates: {
        created_at: repoSnapshot.meta.created_at,
        pushed_at: repoSnapshot.meta.pushed_at,
        last_activity_days: lastActivityDays
      },
      size: {
        repository_kb: repoSnapshot.meta.size,
        total_items: repoSnapshot.treeMetrics.total_items
      },
      repo_tree: repoSnapshot.treeMetrics
    },
    metrics_functional: {
      ...project.metrics_functional,
      user_roles_count: project.target_users.roles.length,
      key_features_count: project.key_features.length,
      domain_areas_count: project.metrics_functional.domain_areas.length,
      primary_flows_count: project.metrics_functional.primary_flows.length
    }
  };
}

function buildCanonicalProfile(profile) {
  return [
    `Name: ${profile.personal.name}`,
    `Title: ${profile.personal.title}`,
    `Headline EN: ${profile.personal.headline.en}`,
    `Headline PT: ${profile.personal.headline.pt}`,
    `Location: ${profile.personal.location}`,
    `Email: ${profile.personal.email}`,
    `Phone: ${profile.personal.phone}`,
    `GitHub: ${profile.personal.github}`,
    `LinkedIn: ${profile.personal.linkedin}`,
    `Portfolio: ${profile.personal.portfolio}`,
    `Bio EN: ${profile.bios.en}`,
    `Bio PT: ${profile.bios.pt}`,
    `Education: ${profile.education[0].degree.en} at ${profile.education[0].institution} (${profile.education[0].period.en})`,
    `Spoken languages: ${profile.languages_spoken.map((entry) => `${entry.name} (${entry.level.en})`).join(', ')}`
  ].join('\n');
}

function buildGlobalSkillsSummary(profile, declaredSkills) {
  return [
    `Declared languages: ${declaredSkills.languages.join(', ')}`,
    `Declared frontend skills: ${declaredSkills.frontend.join(', ')}`,
    `Declared backend skills: ${declaredSkills.backend.join(', ')}`,
    `Declared databases: ${declaredSkills.databases.join(', ')}`,
    `Declared tools: ${declaredSkills.tools.join(', ')}`,
    `Declared methodologies: ${declaredSkills.methodologies.join(', ')}`,
    `Additional declared skills without scoped project evidence: ${declaredSkills.additional_declared_skills.join(', ') || 'none'}`,
    `Working bio EN: ${profile.bios.en}`,
    `Working bio PT: ${profile.bios.pt}`
  ].join('\n');
}

function buildProjectChunks(project, scoreCard) {
  const scoreSummary = Object.entries(scoreCard.scores)
    .map(([criterion, details]) => `${criterion}: ${details.score}/5`)
    .join(', ');

  return [
    {
      id: `project:${project.id}:overview`,
      type: 'project',
      project_id: project.id,
      facet: 'overview',
      language: 'bilingual',
      stack: null,
      tags: project.recommendation_tags,
      stacks: project.all_stacks,
      content: [
        `Project: ${project.display_name}`,
        `Status: ${project.status}`,
        `Summary EN: ${project.summary_en}`,
        `Summary PT: ${project.summary_pt}`,
        `What it solves EN: ${project.what_it_solves.en}`,
        `What it solves PT: ${project.what_it_solves.pt}`,
        `Target users: ${project.target_users.roles.join(', ')}`,
        `GitHub: ${project.github.html_url}`
      ].join('\n')
    },
    {
      id: `project:${project.id}:problem-solution`,
      type: 'project',
      project_id: project.id,
      facet: 'problem-solution',
      language: 'bilingual',
      stack: null,
      tags: project.recommendation_tags,
      stacks: project.all_stacks,
      content: [
        `Project: ${project.display_name}`,
        `Why built EN: ${project.why_built.en}`,
        `Why built PT: ${project.why_built.pt}`,
        `Problem EN: ${project.problem.en}`,
        `Problem PT: ${project.problem.pt}`,
        `Solution EN: ${project.solution.en}`,
        `Solution PT: ${project.solution.pt}`
      ].join('\n')
    },
    {
      id: `project:${project.id}:architecture-features`,
      type: 'project',
      project_id: project.id,
      facet: 'architecture-features',
      language: 'bilingual',
      stack: null,
      tags: project.recommendation_tags,
      stacks: project.all_stacks,
      content: [
        `Project: ${project.display_name}`,
        `Architecture style: ${project.architecture.style}`,
        `Architecture EN: ${project.architecture.en}`,
        `Architecture PT: ${project.architecture.pt}`,
        `Patterns: ${project.architecture.patterns.join(', ')}`,
        `Key features: ${project.key_features.join(', ')}`,
        `Data entities: ${project.data_model.entities.join(', ')}`,
        `Integrations: ${project.integrations.components.join(', ')}`
      ].join('\n')
    },
    {
      id: `project:${project.id}:stack-usage`,
      type: 'project',
      project_id: project.id,
      facet: 'stack-usage',
      language: 'bilingual',
      stack: null,
      tags: project.recommendation_tags,
      stacks: project.all_stacks,
      content: [
        `Project: ${project.display_name}`,
        `Frontend stack: ${project.frontend_stack.join(', ')}`,
        `Backend stack: ${project.backend_stack.join(', ')}`,
        `Database stack: ${project.database_stack.join(', ')}`,
        `Tooling stack: ${project.tooling_stack.join(', ')}`,
        `All stacks: ${project.all_stacks.join(', ')}`
      ].join('\n')
    },
    {
      id: `project:${project.id}:metrics-recommendation`,
      type: 'recommendation',
      project_id: project.id,
      facet: 'metrics-recommendation',
      language: 'bilingual',
      stack: null,
      tags: project.recommendation_tags,
      stacks: project.all_stacks,
      content: [
        `Project: ${project.display_name}`,
        `Engineering metrics: ${JSON.stringify(project.metrics_engineering)}`,
        `Functional metrics: ${JSON.stringify(project.metrics_functional)}`,
        `Strengths: ${project.strengths.join(', ')}`,
        `Tradeoffs: ${project.tradeoffs.join(', ')}`,
        `Score summary: ${scoreSummary}`,
        `Recommendation summary EN: ${scoreCard.summary_en}`,
        `Recommendation summary PT: ${scoreCard.summary_pt}`
      ].join('\n')
    }
  ];
}

function buildStackChunks(stackInventory) {
  return stackInventory.map((stack) => ({
    id: `stack:${normalizeKey(stack.name).replace(/\s+/g, '-')}`,
    type: 'stack',
    project_id: null,
    facet: 'inventory',
    language: 'bilingual',
    stack: stack.name,
    tags: stack.categories,
    stacks: [stack.name],
    content: [
      `Stack: ${stack.name}`,
      `Categories: ${stack.categories.join(', ') || 'uncategorized'}`,
      ...stack.projects.map(
        (project) => `Project: ${project.project_name} | roles: ${project.roles.join(', ') || 'general'} | reason EN: ${project.why_it_matters_en} | reason PT: ${project.why_it_matters_pt}`
      )
    ].join('\n')
  }));
}

function buildRankingChunks(rankings) {
  const chunks = [
    {
      id: 'ranking:overall',
      type: 'recommendation',
      project_id: null,
      facet: 'overall-ranking',
      language: 'bilingual',
      stack: null,
      tags: ['comparison', 'recommendation', 'overall'],
      stacks: [],
      content: [
        'Overall ranking of projects by deterministic weighted score:',
        ...rankings.overall.map((entry, index) => `${index + 1}. ${entry.project_id} => ${entry.overall_score}`)
      ].join('\n')
    }
  ];

  for (const [criterion, ranking] of Object.entries(rankings.by_criterion)) {
    chunks.push({
      id: `ranking:${criterion}`,
      type: 'recommendation',
      project_id: null,
      facet: 'criterion-ranking',
      language: 'bilingual',
      stack: null,
      tags: ['comparison', 'recommendation', criterion],
      stacks: [],
      content: [
        `Criterion ranking: ${criterion}`,
        ...ranking.map((entry, index) => `${index + 1}. ${entry.project_id} => ${entry.score}/5 | EN: ${entry.reason_en} | PT: ${entry.reason_pt}`)
      ].join('\n')
    });
  }

  return chunks;
}

function buildSpotlightStackChunks(stackRankings) {
  return STACK_SPOTLIGHTS.filter((stackKey) => stackRankings[stackKey]?.length).map((stackKey) => ({
    id: `ranking:stack:${stackKey}`,
    type: 'recommendation',
    project_id: null,
    facet: 'stack-ranking',
    language: 'bilingual',
    stack: stackKey,
    tags: ['comparison', 'recommendation', stackKey],
    stacks: [stackKey],
    content: [
      `Stack recommendation ranking for ${stackKey}:`,
      ...stackRankings[stackKey].map((entry, index) => `${index + 1}. ${entry.project_name} => ${entry.score} | EN: ${entry.summary_en} | PT: ${entry.summary_pt}`)
    ].join('\n')
  }));
}

function buildAliasMaps(projects, profile, stackInventory) {
  const projectAliases = {};
  for (const project of projects) {
    for (const alias of unique([project.display_name, project.repo, ...project.aliases])) {
      projectAliases[normalizeKey(alias)] = project.id;
    }
  }

  const stackAliases = {};
  const declaredSkills = unique(Object.values(profile.declared_skills).flatMap((entries) => entries));
  for (const stackName of unique([...declaredSkills, ...stackInventory.map((entry) => entry.name)])) {
    stackAliases[normalizeKey(stackName)] = stackName;
  }
  for (const [alias, canonical] of Object.entries(STACK_ALIAS_OVERRIDES)) {
    stackAliases[normalizeKey(alias)] = canonical;
  }

  return { project_aliases: projectAliases, stack_aliases: stackAliases };
}

async function fetchRepoSnapshot(repo) {
  const base = `https://api.github.com/repos/Shizu0n/${repo}`;
  const meta = await fetchGitHubJson(base);
  const [languages, readmeResponse, tree] = await Promise.all([
    fetchGitHubJson(`${base}/languages`),
    fetchGitHubJson(`${base}/readme`),
    fetchGitHubJson(`${base}/git/trees/${meta.default_branch}?recursive=1`)
  ]);

  const readme = decodeReadme(readmeResponse.content);

  return {
    meta,
    languages,
    readme,
    treeMetrics: computeTreeMetrics(tree)
  };
}

async function main() {
  const [profile, manualProjects, recommendations, cvRaw] = await Promise.all([
    readJson(path.join(CHATBOT_DIR, 'profile.json')),
    readJson(path.join(CHATBOT_DIR, 'projects.manual.json')),
    readJson(path.join(CHATBOT_DIR, 'recommendations.json')),
    fs.readFile(CV_PATH, 'utf8')
  ]);

  const repoSnapshots = new Map();
  for (const repo of REPO_ORDER) {
    repoSnapshots.set(repo, await fetchRepoSnapshot(repo));
  }

  const projects = manualProjects.map((project) => buildProjectRecord(project, repoSnapshots.get(project.repo)));
  const scoreCardsById = new Map(recommendations.project_scorecards.map((card) => [card.project_id, card]));
  const stackInventory = buildStackInventory(projects);
  const declaredSkills = buildDeclaredSkills(profile, stackInventory);
  const rankings = buildRankings(recommendations.project_scorecards, recommendations.criteria_weights);
  const stackRankings = buildStackRankings(projects, scoreCardsById);
  const aliasMaps = buildAliasMaps(projects, profile, stackInventory);
  const canonicalProfile = buildCanonicalProfile(profile);
  const globalSkillsSummary = buildGlobalSkillsSummary(profile, declaredSkills);

  const runtimeChunks = [
    {
      id: 'identity:canonical-profile',
      type: 'identity',
      project_id: null,
      facet: 'profile',
      language: 'bilingual',
      stack: null,
      tags: ['personal', 'profile'],
      stacks: [],
      content: canonicalProfile
    },
    {
      id: 'skills:global-summary',
      type: 'skills',
      project_id: null,
      facet: 'global-summary',
      language: 'bilingual',
      stack: null,
      tags: ['skills', 'inventory'],
      stacks: [],
      content: globalSkillsSummary
    },
    ...buildStackChunks(stackInventory),
    ...projects.flatMap((project) => buildProjectChunks(project, scoreCardsById.get(project.id))),
    ...buildRankingChunks(rankings),
    ...buildSpotlightStackChunks(stackRankings)
  ];

  const artifact = {
    generated_at: new Date().toISOString(),
    sources: {
      cv: 'cv.md',
      profile: 'data/chatbot/profile.json',
      manual_projects: 'data/chatbot/projects.manual.json',
      recommendations: 'data/chatbot/recommendations.json',
      github_owner: 'Shizu0n',
      repos_in_scope: REPO_ORDER
    },
    profile,
    education: profile.education,
    declared_skills: declaredSkills,
    cv_excerpt: cvRaw,
    projects,
    stack_inventory: stackInventory,
    recommendation_scorecards: recommendations.project_scorecards,
    rankings: {
      ...rankings,
      by_stack: stackRankings
    },
    chat_runtime: {
      canonical_profile: canonicalProfile,
      global_skills_summary: globalSkillsSummary,
      ...aliasMaps,
      chunks: runtimeChunks
    }
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(`Built chatbot knowledge artifact at ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
