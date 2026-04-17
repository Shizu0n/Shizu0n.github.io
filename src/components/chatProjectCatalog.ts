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

const CHAT_PROJECT_ACTIONS: ChatProjectAction[] = [
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
    id: 'shizu0n-cv',
    name: 'Shizu0n CV',
    aliases: ['shizu0n cv', 'portfolio site', 'shizu0n-cv', 'this portfolio'],
    summary: {
      en: 'Authorial portfolio in React and TypeScript focused on editorial motion, GitHub stats, contact flows, and an AI chatbot using RAG over Paulo\'s own technical history.',
      pt: 'Portfólio autoral em React e TypeScript com motion editorial, GitHub stats, contato e chatbot com IA usando RAG sobre a própria trajetória técnica.',
    },
    github: 'https://github.com/Shizu0n/Shizu0n-CV',
    live: 'https://shizu0n.vercel.app',
    stacks: ['React 19', 'TypeScript', 'Vite 7', 'Framer Motion 12', 'Lenis', 'Tailwind CSS 4', 'JavaScript', 'Vercel Functions', 'Server-Sent Events', 'Gemini API', 'Groq', 'OpenRouter', 'Cloudflare Workers AI', 'Supabase', 'PostgreSQL', 'pgvector', 'GitHub API', 'EmailJS', 'ESLint', 'Prettier', 'Playwright'],
  },
]

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
