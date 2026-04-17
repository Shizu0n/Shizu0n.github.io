import type { ChatMessage } from '../hooks/useChat';
import {
  extractProjectActions,
  getAllProjectActions,
  getProjectActionsByIds,
  type ChatProjectAction,
} from './chatProjectCatalog';

export interface ProjectCardState {
  show: boolean;
  projectActions: ChatProjectAction[];
}

const PROJECT_CARD_INTENTS = new Set(['project_lookup', 'comparison', 'recommendation', 'stack_lookup']);
const NON_PROJECT_CARD_INTENTS = new Set(['contact', 'personal']);

const normalizeSuggestionText = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const wasExplicitListRequest = (userMessage: string): boolean => {
  const normalized = normalizeSuggestionText(userMessage);
  const listPatterns = [
    /\blist(ar)?\b.*\b(todos?|todas?|all)\b.*\b(projetos?|projects?)\b/i,
    /\bliste\b.*\b(todos?|todas?)\b.*\bprojetos?\b/i,
    /\blista\b.*\bprojetos?\b/i,
    /\b(show|mostre)\b.*\b(all|todos?)\b.*\b(projects?|projetos?)\b/i,
    /\btodos?\s+os\s+projetos?\b/i,
    /\ball\s+of\s+your\s+projects\b/i,
    /\bwhat\s+are\s+your\s+projects\b/i,
    /\bquais\s+sao\s+(os\s+)?seus\s+projetos\b/i,
  ];
  return listPatterns.some((pattern) => pattern.test(normalized));
};

const wasProjectMentionRequest = (userMessage: string, detectedAliases?: string[]): boolean => {
  const normalized = normalizeSuggestionText(userMessage);
  const projectKeywords = /\b(projetos?|projects?|portfolio)\b/i;
  const topicKeywords = /\b(sobre|about|me\s+fale|tell\s+me|explique|explain|quais|which|que\s+e|what|especifico|details|detail)\b/i;
  const hasProjectWord = projectKeywords.test(normalized);
  const hasTopicWord = topicKeywords.test(normalized);
  const hasProjectAlias = !!(detectedAliases && detectedAliases.length > 0);
  return (hasProjectWord && hasTopicWord) || hasProjectAlias;
};

const wasStackLookupRequest = (userMessage: string): boolean => {
  const normalized = normalizeSuggestionText(userMessage);
  return /\b(stack|stacks|tecnolog|tecnologia|tecnologias|framework|frameworks|backend|frontend|react|nestjs|spring|java|typescript|node|mysql|sqlite|postgres|pgvector)\b/i.test(normalized);
};

const wasNonProjectTopic = (userMessage: string): boolean => {
  const normalized = normalizeSuggestionText(userMessage);
  const nonProjectPatterns = [
    /\bwhy\b.*\bhire\b/i, /\bpor\s+que\b.*\bcontratar\b/i,
    /\bhow\b.*\bcontact\b/i, /\bcomo\b.*\bcontato\b/i,
    /\bhow\b.*\breach\b/i, /\bcomo\b.*\bfalar\b/i,
    /experiencia$/i, /experience$/i,
    /trajetoria$/i, /career$/i,
  ];

  if (nonProjectPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const offTopicKeywords = [
    'contratar', 'hire', 'hiring', 'vaga', 'job', 'recruiter', 'recrutador',
    'contato', 'contact', 'email', 'linkedin', 'mensagem',
    'experien', 'trajetoria', 'carreira', 'background',
    'skills', 'habilidades',
  ];

  const hasProjectWord = /\b(projetos?|projects?|portfolio)\b/i.test(normalized);
  return !hasProjectWord && offTopicKeywords.some((keyword) => normalized.includes(keyword));
};

export const buildProjectCardVisibilityMap = (messages: ChatMessage[]) => {
  const visibilityByMessageId = new Map<string, ProjectCardState>();

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== 'assistant') {
      continue;
    }

    const trimmedContent = message.content.trim();
    if (!trimmedContent) {
      visibilityByMessageId.set(message.id, { show: false, projectActions: [] });
      continue;
    }

    const prevUserMsg = [...messages.slice(0, index)]
      .reverse()
      .find((entry) => entry.role === 'user') ?? null;
    const prevContent = prevUserMsg?.content ?? '';

    const isList = wasExplicitListRequest(prevContent);
    const isStackQuestion = wasStackLookupRequest(prevContent);

    const userMentionedProjects = extractProjectActions(prevContent, false).map((project) => project.id);
    const assistantMentionedProjects = extractProjectActions(trimmedContent, false).map((project) => project.id);
    const isProjectQuestion = wasProjectMentionRequest(prevContent, userMentionedProjects);
    const isOffTopic = wasNonProjectTopic(prevContent);
    const intentAllowsCards = message.intent ? PROJECT_CARD_INTENTS.has(message.intent) : false;
    const intentBlocksCards = message.intent ? NON_PROJECT_CARD_INTENTS.has(message.intent) : false;

    const hasProjectContext = isList || isProjectQuestion || isStackQuestion || intentAllowsCards;
    let selectedProjectActions: ChatProjectAction[] = [];

    if (isList) {
      selectedProjectActions = getAllProjectActions();
    } else if (userMentionedProjects.length > 0) {
      selectedProjectActions = getProjectActionsByIds(userMentionedProjects);
    } else {
      selectedProjectActions = getProjectActionsByIds(assistantMentionedProjects);
    }

    const shouldShow = hasProjectContext && !isOffTopic && !intentBlocksCards && selectedProjectActions.length > 0;
    visibilityByMessageId.set(message.id, {
      show: shouldShow,
      projectActions: shouldShow ? selectedProjectActions : [],
    });
  }

  return visibilityByMessageId;
};
