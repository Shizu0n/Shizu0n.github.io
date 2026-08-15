export type Language = 'en' | 'pt'

export interface ChatProjectAction {
  id: string
  name: string
  aliases: string[]
  summary: { en: string; pt: string }
  github: string
  live?: string
  stacks: string[]
}

const MAX_PROJECT_CARDS = 5

// Catalog order is AI-first by design: the three applied-AI builds lead, then the
// portfolio itself, then the full-stack application systems. getAllProjectActions and
// getShowcaseProjects both read this order, so the chat "list" cards and the visible grid
// stay AI-first. projectsPresentation is keyed by id and its variants are assigned to keep
// each consecutive grid pair filling a 12-column row.
const CHAT_PROJECT_ACTIONS: ChatProjectAction[] = [
  {
    id: 'react-agent',
    name: 'ReAct Agent',
    aliases: ['react agent', 'reactagent', 're-act agent', 'react-agent', 'agente react', 'langgraph agent', 'tool agent'],
    summary: {
      en: 'Observable ReAct agent on $0 free-tier spend — LangGraph backend streaming its full reasoning/action trace over SSE, with cross-conversation memory, cited document RAG, persisted replayable traces, MCP tool discovery, and a 100% eval baseline on 22 labeled cases.',
      pt: 'Agente ReAct observável com US$ 0 de gasto — backend LangGraph transmitindo o traço completo de raciocínio/ação via SSE, com memória entre conversas, RAG de documentos com citações, traces persistidos com replay, descoberta de ferramentas MCP e baseline de 100% em 22 casos avaliados.',
    },
    github: 'https://github.com/Shizu0n/ReAct-Agent',
    live: 'https://react-agent-ml.vercel.app',
    stacks: ['Python', 'LangGraph', 'FastAPI', 'Server-Sent Events', 'Supabase', 'pgvector', 'Model Context Protocol', 'React', 'Vite', 'TypeScript', 'Tavily', 'LLM Agents'],
  },
  {
    id: 'advanced-rag',
    name: 'Advanced RAG',
    aliases: ['advanced rag', 'advancedrag', 'advanced-rag', 'rag system', 'ragas', 'hybrid retrieval'],
    summary: {
      en: 'End-to-end, offline-capable RAG: ChromaDB indexing, hybrid retrieval (BM25 + dense + reciprocal-rank fusion + reranking), LLM synthesis with extractive fallback, and offline + RAGAS evaluation in a Streamlit app.',
      pt: 'RAG completo e capaz de operar offline: indexação ChromaDB, retrieval híbrido (BM25 + denso + fusão por reciprocal-rank + reranking), síntese por LLM com fallback extrativo e avaliação offline + RAGAS em app Streamlit.',
    },
    github: 'https://github.com/Shizu0n/Advanced-RAG',
    live: 'https://advanced-ragas.streamlit.app',
    stacks: ['Python', 'Streamlit', 'ChromaDB', 'BM25', 'Hybrid Retrieval', 'Reciprocal Rank Fusion', 'Cross-Encoder Reranking', 'RAGAS', 'Retrieval-Augmented Generation', 'LLM Evaluation'],
  },
  {
    id: 'phi3-mini-sql',
    name: 'Phi-3 Mini SQL Generator',
    aliases: ['phi-3 mini sql generator', 'phi3 mini sql', 'phi-3 mini sql', 'phi3-mini-sql-generator', 'phi3 mini', 'phi-3 mini', 'phi3', 'phi-3', 'sql generator', 'qlora', 'text-to-sql', 'text to sql'],
    summary: {
      en: 'QLoRA fine-tune of Phi-3 Mini (3.8B) for natural-language-to-SQL — trained 4-bit on a single T4, lifting exact-match accuracy from 2% to 73.5%, published to the Hugging Face Hub with a public Spaces demo.',
      pt: 'Fine-tuning QLoRA do Phi-3 Mini (3.8B) para linguagem natural em SQL — treinado em 4-bit numa única T4, elevando o exact-match de 2% para 73,5%, publicado no Hugging Face Hub com demo pública no Spaces.',
    },
    github: 'https://github.com/Shizu0n/phi3-mini-sql-generator',
    live: 'https://huggingface.co/spaces/Shizu0n/phi3-mini-sql-generator-demo',
    stacks: ['Python', 'PyTorch', 'Transformers', 'PEFT', 'QLoRA', 'LoRA', 'bitsandbytes', 'Phi-3 Mini', 'Hugging Face', 'Text-to-SQL'],
  },
  {
    id: 'shizu0n-cv',
    name: 'Shizu0n CV',
    aliases: ['shizu0n cv', 'portfolio site', 'shizu0n-cv', 'this portfolio'],
    summary: {
      en: 'Authorial portfolio in React and TypeScript focused on editorial motion, GitHub stats, contact flows, and an AI chatbot using RAG over Paulo\'s own technical history.',
      pt: 'Portfólio autoral em React e TypeScript com motion editorial, GitHub stats, contato e chatbot com IA usando RAG sobre a própria trajetória técnica.',
    },
    github: 'https://github.com/Shizu0n/Shizu0n-CV',
    live: 'https://shizu0n.vercel.app',
    stacks: ['React 19', 'TypeScript', 'Vite 7', 'Framer Motion 12', 'Lenis', 'Tailwind CSS 4', 'JavaScript', 'Vercel Functions', 'Server-Sent Events', 'Gemini API', 'Groq', 'Supabase', 'PostgreSQL', 'pgvector', 'GitHub API', 'EmailJS', 'ESLint', 'Prettier', 'Playwright'],
  },
  {
    id: 'campus-cycle',
    name: 'CampusCycle',
    aliases: ['campuscycle', 'campus cycle', 'campus-cycle', 'campus cycles', 'campus cycles marketplace', 'marketplace universitário', 'marketplace universitario', 'marketplace do campus'],
    summary: {
      en: 'Installable university circular-economy marketplace with a React PWA, Express and Prisma API, JWT authentication, and an IndexedDB offline write queue that safely publishes listings after reconnection.',
      pt: 'Marketplace universitário instalável de economia circular, com PWA em React, API Express e Prisma, autenticação JWT e fila offline no IndexedDB que publica anúncios com segurança após a reconexão.',
    },
    github: 'https://github.com/Shizu0n/CampusCycle',
    live: 'https://campus-cycles.vercel.app',
    stacks: ['React 19', 'TypeScript', 'Vite 6', 'PWA', 'Workbox', 'IndexedDB', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Neon', 'JWT', 'Vitest', 'Vercel', 'Render'],
  },
  {
    id: 'referral-system',
    name: 'Referral System',
    aliases: ['referral system', 'referralsystem', 'sistema de indicação', 'sistema de indicacao'],
    summary: {
      en: 'Full-stack referral system with React, TypeScript, NestJS, SQLite, and JWT authentication, built to demonstrate user flows, authentication, and recursive relational modeling.',
      pt: 'Sistema full stack de indicação com React, TypeScript, NestJS, SQLite e autenticação JWT, construído para demonstrar fluxo de usuários, autenticação e modelagem relacional recursiva.',
    },
    github: 'https://github.com/Shizu0n/ReferralSystem',
    stacks: ['NestJS', 'TypeScript', 'React 18', 'Vite', 'React Router DOM', 'SQLite', 'TypeORM', 'JWT', 'bcrypt', 'Context API', 'CSS', 'class-validator'],
  },
  {
    id: 'delivery-system',
    name: 'Delivery System',
    aliases: ['delivery system', 'deliverysystem', 'sistema de delivery', 'delivery app'],
    summary: {
      en: 'Full-stack delivery system with multiple user roles, JWT authentication, operational CRUD flows, and a broader domain covering orders, menus, deliveries, and reviews.',
      pt: 'Sistema full stack de delivery com múltiplos papéis, autenticação JWT, CRUD operacional e domínio amplo de pedidos, cardápio, entregas e avaliações.',
    },
    github: 'https://github.com/Shizu0n/DeliverySystem',
    stacks: ['React', 'JavaScript', 'Node.js', 'MySQL', 'JWT', 'bcrypt.js', 'Helmet', 'CORS', 'Context API', 'REST API'],
  },
  {
    id: 'academic-system',
    name: 'Academic System',
    aliases: ['academic system', 'academicsystem', 'sistema academico', 'sistema acadêmico', 'unifor system'],
    summary: {
      en: 'Java academic management system for enrollment and library operations, with explicit business rules, MySQL persistence, and integration with external microservices.',
      pt: 'Sistema acadêmico em Java para matrícula e biblioteca, com regras de negócio explícitas, persistência em MySQL e integração com microsserviços externos.',
    },
    github: 'https://github.com/Shizu0n/AcademicSystem',
    stacks: ['Java', 'Java 21', 'MySQL 8.0', 'JDBC', 'Gson', 'dotenv-java', 'REST APIs', 'Layered Architecture'],
  },
  {
    id: 'gym-management',
    name: 'Gym Management System',
    aliases: ['gym management', 'gym management system', 'gymmanagement', 'sistema de academia'],
    summary: {
      en: 'Gym management system focused on administering students, plans, payments, workouts, physical assessments, and attendance.',
      pt: 'Sistema de gestão de academia com foco em administração de alunos, planos, pagamentos, treinos, avaliações físicas e frequência.',
    },
    github: 'https://github.com/Shizu0n/GymManagement',
    stacks: ['Java', 'Spring Boot', 'Java Swing', 'MySQL', 'Gradle'],
  },
]

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function scoreProjectMentions(content: string, project: ChatProjectAction) {
  const normalizedContent = normalizeText(content)
  const aliasMatches = new Set<string>()
  let firstIndex = Number.POSITIVE_INFINITY
  let lastIndex = -1

  for (const alias of project.aliases) {
    const normalizedAlias = normalizeText(alias).trim()
    if (!normalizedAlias || aliasMatches.has(normalizedAlias)) {
      continue
    }

    const pattern = new RegExp(escapeRegExp(normalizedAlias), 'g')
    let match: RegExpExecArray | null
    let hasMatch = false

    while ((match = pattern.exec(normalizedContent)) !== null) {
      hasMatch = true
      firstIndex = Math.min(firstIndex, match.index)
      lastIndex = Math.max(lastIndex, match.index)
    }

    if (hasMatch) {
      aliasMatches.add(normalizedAlias)
    }
  }

  return {
    aliasScore: aliasMatches.size,
    firstIndex: Number.isFinite(firstIndex) ? firstIndex : -1,
    lastIndex,
  }
}

export function getAllProjectActions(limit = MAX_PROJECT_CARDS) {
  return CHAT_PROJECT_ACTIONS.slice(0, Math.max(0, limit))
}

// Full project list for the visible portfolio showcase grid (not capped at the chat
// card limit). The grid groups these by category via projectsPresentation.
export function getShowcaseProjects() {
  return CHAT_PROJECT_ACTIONS.slice()
}

export function getProjectActionsByIds(projectIds: string[]) {
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return []
  }

  const uniqueIds = [...new Set(projectIds)]
  return uniqueIds
    .map((id) => CHAT_PROJECT_ACTIONS.find((project) => project.id === id))
    .filter((project): project is ChatProjectAction => Boolean(project))
    .slice(0, MAX_PROJECT_CARDS)
}

export function extractProjectActions(content: string, isListRequest = false) {
  if (isListRequest) {
    return getAllProjectActions()
  }

  if (!content.trim()) {
    return []
  }

  const scoredProjects = CHAT_PROJECT_ACTIONS
    .map((project, index) => ({
      project,
      index,
      ...scoreProjectMentions(content, project),
    }))
    .filter((entry) => entry.aliasScore > 0)
    .sort(
      (a, b) =>
        a.firstIndex - b.firstIndex ||
        b.aliasScore - a.aliasScore ||
        b.lastIndex - a.lastIndex ||
        a.index - b.index,
    )
    .map((entry) => entry.project)

  return scoredProjects.slice(0, MAX_PROJECT_CARDS)
}
