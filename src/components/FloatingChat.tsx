import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useChat, type ChatMessage } from '../hooks/useChat';
import { useTranslation } from '../contexts/TranslationContext';
import ChatMessageContent from './ChatMessageContent';
import { buildProjectCardVisibilityMap } from './chatProjectCardPolicy';

type Language = 'en' | 'pt';
type ChatSuggestionTopic = 'projects' | 'stacks' | 'experience' | 'hiring' | 'contact';

const normalizeSuggestionText = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const includesAnyKeyword = (content: string, keywords: string[]) => {
  return keywords.some((keyword) => content.includes(keyword));
};

const inferSuggestionTopic = (messages: ChatMessage[]): ChatSuggestionTopic => {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && message.content.trim());
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content.trim());

  const contextText = normalizeSuggestionText(
    `${lastUserMessage?.content ?? ''} ${lastAssistantMessage?.content ?? ''}`,
  );

  if (!contextText) {
    return 'projects';
  }

  if (
    includesAnyKeyword(contextText, [
      'contato',
      'contact',
      'email',
      'linkedin',
      'falar',
      'reach',
      'talk',
      'mensagem',
    ])
  ) {
    return 'contact';
  }

  if (
    includesAnyKeyword(contextText, [
      'contratar',
      'hire',
      'hiring',
      'recruiter',
      'recrutador',
      'vaga',
      'job',
    ])
  ) {
    return 'hiring';
  }

  if (
    includesAnyKeyword(contextText, [
      'stack',
      'stacks',
      'tecnolog',
      'backend',
      'frontend',
      'react',
      'nestjs',
      'java',
      'typescript',
      'framework',
    ])
  ) {
    return 'stacks';
  }

  if (
    includesAnyKeyword(contextText, ['experien', 'trajetoria', 'carreira', 'background', 'career'])
  ) {
    return 'experience';
  }

  if (
    includesAnyKeyword(contextText, [
      'projeto',
      'project',
      'projects',
      'referral',
      'delivery',
      'academic',
      'gym',
      'portfolio',
    ])
  ) {
    return 'projects';
  }

  const topicCycle: ChatSuggestionTopic[] = ['projects', 'stacks', 'experience', 'hiring', 'contact'];
  return topicCycle[messages.length % topicCycle.length];
};

const getContextualSuggestionPool = (language: Language, topic: ChatSuggestionTopic) => {
  const pools = {
    pt: {
      projects: [
        'Quais sao seus 3 projetos mais fortes hoje?',
        'Qual projeto mostra melhor sua arquitetura?',
        'Qual projeto devo ver primeiro em 5 minutos?',
        'Pode comparar Referral System e Delivery System?',
        'Que projeto destaca mais seu lado de produto?',
        'Qual projeto tem melhor equilibrio entre frontend e backend?',
      ],
      stacks: [
        'Quais stacks voce domina com mais confianca?',
        'Em quais projetos cada stack aparece?',
        'Qual stack voce usa para backend hoje?',
        'Qual stack melhor representa seu frontend?',
        'Como voce decide entre Java e TypeScript?',
        'Qual tecnologia voce quer aprofundar agora?',
      ],
      experience: [
        'Resume sua experiencia em 30 segundos.',
        'Que tipo de problema voce resolve melhor?',
        'Como e seu processo de desenvolvimento?',
        'Quais resultados praticos voce ja entregou?',
        'Como voce trabalha com prioridade e prazo?',
        'Qual foi seu desafio tecnico mais marcante?',
      ],
      hiring: [
        'Por que uma empresa deveria te contratar agora?',
        'Que valor voce gera nas primeiras semanas?',
        'Quais sao seus diferenciais tecnicos?',
        'Como voce colabora com time e produto?',
        'Quais evidencias do seu nivel aparecem nos projetos?',
        'Que perfil de vaga combina mais com voce?',
      ],
      contact: [
        'Qual o melhor canal para falar com voce?',
        'Voce esta disponivel para estagio ou freelance?',
        'Prefere contato por email ou LinkedIn?',
        'Como enviar uma proposta objetiva para voce?',
        'Qual disponibilidade voce tem hoje?',
        'Pode compartilhar seus links de contato principais?',
      ],
    },
    en: {
      projects: [
        'What are your top 3 strongest projects today?',
        'Which project best shows your architecture skills?',
        'If I have 5 minutes, which project should I open first?',
        'Can you compare Referral System and Delivery System?',
        'Which project highlights your product thinking the most?',
        'Which project has the best frontend/backend balance?',
      ],
      stacks: [
        'Which stacks are you most confident with?',
        'Where does each stack appear across your projects?',
        'Which stack do you currently prefer for backend?',
        'Which stack best represents your frontend work?',
        'How do you decide between Java and TypeScript?',
        'Which technology are you focusing on next?',
      ],
      experience: [
        'Can you summarize your experience in 30 seconds?',
        'What type of problems do you solve best?',
        'What does your development process look like?',
        'What practical outcomes have you delivered so far?',
        'How do you handle priorities and deadlines?',
        'What was your most challenging technical problem?',
      ],
      hiring: [
        'Why should a company hire you right now?',
        'What value do you deliver in the first weeks?',
        'What are your strongest technical differentiators?',
        'How do you collaborate with product and engineering teams?',
        'What evidence of your level appears in your projects?',
        'What role profile fits you best today?',
      ],
      contact: [
        'What is the best channel to reach you?',
        'Are you currently available for internships or freelance work?',
        'Do you prefer contact by email or LinkedIn?',
        'How should I send you a clear project proposal?',
        'What is your current availability?',
        'Can you share your main contact links?',
      ],
    },
  } as const;

  return pools[language][topic];
};

const getContextualSuggestions = (messages: ChatMessage[], language: Language) => {
  const topic = inferSuggestionTopic(messages);
  const pool = getContextualSuggestionPool(language, topic);

  if (!pool.length) {
    return [];
  }

  const seed = messages.reduce((acc, message) => acc + message.content.length, 0) + messages.length;
  const startIndex = seed % pool.length;
  const rotated = [...pool.slice(startIndex), ...pool.slice(0, startIndex)];

  return rotated.slice(0, 4);
};

export default function FloatingChat() {
  const { t, language } = useTranslation()
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isContextPopoverOpen, setIsContextPopoverOpen] = useState(false);
  
  const { messages, isLoading, error, quotaInfo, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextFlyoutRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const userLabel = language === 'pt' ? 'Você' : 'You';
  const hasStartedConversation = messages.length > 0;
  const quickActions = [
    {
      id: 'experience',
      label: t('chat.quick.experience.label'),
      prompt: t('chat.quick.experience.prompt'),
    },
    {
      id: 'topProjects',
      label: t('chat.quick.topProjects.label'),
      prompt: t('chat.quick.topProjects.prompt'),
    },
    {
      id: 'whyHire',
      label: t('chat.quick.whyHire.label'),
      prompt: t('chat.quick.whyHire.prompt'),
    },
    {
      id: 'contact',
      label: t('chat.quick.contact.label'),
      prompt: t('chat.quick.contact.prompt'),
    },
  ] as const;
  const contextualSuggestions = useMemo(() => {
    if (!hasStartedConversation) {
      return [];
    }

    return getContextualSuggestions(messages, language as Language);
  }, [hasStartedConversation, language, messages]);
  const projectCardVisibilityByMessageId = useMemo(
    () => buildProjectCardVisibilityMap(messages),
    [messages],
  );

  const renderQuickActionIcon = (actionId: string) => {
    if (actionId === 'experience') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    }

    if (actionId === 'topProjects') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-5 4 4 7-7" />
          <path d="M14 5h7v7" />
        </svg>
      );
    }

    if (actionId === 'whyHire') {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    }

    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 8l9 6 9-6" />
      </svg>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      const timer1 = setTimeout(() => setLoadingStep(1), 1000);
      const timer2 = setTimeout(() => setLoadingStep(2), 2500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); }
    }
  }, [isLoading]);

  const getLoadingText = () => {
     if (language === 'pt') {
        if (loadingStep === 0) return 'Paulo está lendo sua pergunta...';
        if (loadingStep === 1) return 'Paulo está juntando as ideias...';
        return 'Paulo está finalizando a resposta...';
     } else {
        if (loadingStep === 0) return 'Paulo is reading your question...';
        if (loadingStep === 1) return 'Paulo is putting the ideas together...';
        return 'Paulo is finishing the reply...';
     }
  }

  useEffect(() => {
    if (quotaInfo?.isQuotaExceeded && quotaInfo.resetTimestamp) {
      const updateTimer = () => {
         const remaining = Math.max(0, Math.ceil((quotaInfo.resetTimestamp! - Date.now()) / 1000));
         setCountdown(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(0);
    }
  }, [quotaInfo]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus input when opened
      textareaRef.current?.focus();
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) {
      setIsContextPopoverOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isContextPopoverOpen) {
      return;
    }

    const handleOutsidePointer = (event: MouseEvent | TouchEvent) => {
      if (!contextFlyoutRef.current?.contains(event.target as Node)) {
        setIsContextPopoverOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsContextPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointer);
    document.addEventListener('touchstart', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
      document.removeEventListener('touchstart', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isContextPopoverOpen]);

  useEffect(() => {
    if (!hasStartedConversation || contextualSuggestions.length === 0) {
      setIsContextPopoverOpen(false);
    }
  }, [hasStartedConversation, contextualSuggestions.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (isLoading || countdown > 0) {
      return;
    }

    sendMessage(prompt);
    setIsContextPopoverOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chat-toggle-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            aria-label={t('chat.askMe')}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Chat Bubble with tail pointing to robot */}
              <path d="M29 4 H 21 c -1.1 0 -2 .9 -2 2 v 5 l -3 3 l 3 -1 v 1 c 0 1.1 .9 2 2 2 h 8 c 1.1 0 2 -.9 2 -2 V 6 c 0 -1.1 -.9 -2 -2 -2 Z" />
              <path d="M 22 9 h 5" />
              <path d="M 22 12 h 3" />
              
              {/* Antenna */}
              <circle cx="10" cy="7" r="1.5" />
              <path d="M10 8.5v3.5" />
              
              {/* Robot Head */}
              <rect x="4" y="12" width="12" height="11" rx="2" />
              
              {/* Ears */}
              <path d="M4 14 H2v7h2 M16 14 h2v7h-2" />
              
              {/* Face */}
              <circle cx="7.5" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="12.5" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
              <path d="M7.5 19.5 c 1.2 1.2 3.8 1.2 5 0" />
              
              {/* Neck / Base */}
              <path d="M10 23v3 M6 26h8" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`chat-panel ${isExpanded ? 'chat-panel--expanded' : ''}`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
          >
            <div 
              className="chat-header"
              onPointerDown={(e) => {
                if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button')) {
                  return;
                }

                dragControls.start(e);
              }}
              style={{ cursor: 'grab', touchAction: 'none' }}
            >
              <div className="chat-header-info">
                <span className="chat-title">Paulo Shizuo</span>
                <span className="chat-subtitle">{t('chat.subtitle')}</span>
              </div>
              <div className="chat-header-actions">
                <button 
                  className="chat-expand-btn" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label="Expand chat"
                >
                  {isExpanded ? '↙' : '↗'}
                </button>
                <button 
                  className="chat-close-btn" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  &times;
                </button>
              </div>
            </div>

            {!hasStartedConversation && (
              <div className="chat-prelude">
                <div className="chat-prelude-card">
                  <p>{t('chat.prelude.intro')}</p>
                </div>
                <div className="chat-quick-actions">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      className="chat-quick-action"
                      onClick={() => handleQuickAction(action.prompt)}
                      disabled={isLoading || countdown > 0}
                      type="button"
                    >
                      <span className="chat-quick-action-icon" aria-hidden="true">
                        {renderQuickActionIcon(action.id)}
                      </span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-messages" data-lenis-prevent="true">

              {messages.map((msg, index) => {
                const isPendingAssistantMessage =
                  isLoading &&
                  msg.role === 'assistant' &&
                  !msg.content.trim() &&
                  index === messages.length - 1;
                const cardState = projectCardVisibilityByMessageId.get(msg.id);

                if (msg.role === 'assistant' && !msg.content.trim() && !isPendingAssistantMessage) {
                  return null;
                }

                return (
                  <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
                    <span className="chat-message-role">
                      {msg.role === 'user' ? userLabel : 'Paulo'}
                    </span>
                    <div className="chat-message-content">
                      {isPendingAssistantMessage ? (
                        <div className="chat-loading-state" aria-live="polite">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                            className="chat-loading-spinner"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          </motion.div>
                          <span>{getLoadingText()}</span>
                        </div>
                      ) : (
                        <ChatMessageContent
                          content={msg.content}
                          role={msg.role}
                          language={language}
                          projectActions={cardState?.show ? cardState.projectActions : []}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              
              {error && (
                <div className="chat-error">
                  {countdown > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <p>{t('chat.quotaExceeded', { seconds: countdown })}</p>
                    </div>
                  ) : (
                    <p>{error}</p>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-shell">
              {hasStartedConversation && contextualSuggestions.length > 0 && (
                <div
                  className={`chat-context-flyout ${isContextPopoverOpen ? 'chat-context-flyout--open' : ''}`}
                  ref={contextFlyoutRef}
                >
                  <button
                    className="chat-context-trigger"
                    type="button"
                    onClick={() => setIsContextPopoverOpen((current) => !current)}
                    aria-expanded={isContextPopoverOpen}
                    aria-controls="chat-context-popover"
                    aria-label={language === 'pt' ? 'Mostrar sugestões rápidas' : 'Show quick suggestions'}
                  >
                    <span className="chat-context-trigger-dot" aria-hidden="true" />
                    <span>{language === 'pt' ? 'Sugestões' : 'Quick prompts'}</span>
                  </button>
                  <div
                    id="chat-context-popover"
                    className="chat-context-popover"
                    role="dialog"
                    aria-label={language === 'pt' ? 'Sugestões rápidas' : 'Quick suggestions'}
                  >
                    <div className="chat-context-popover-header">
                      <span>{language === 'pt' ? 'Passe o mouse ou clique e escolha' : 'Hover or click and pick one'}</span>
                    </div>
                    <div className="chat-context-popover-body">
                      {contextualSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          className="chat-context-chip"
                          onClick={() => handleQuickAction(suggestion)}
                          disabled={isLoading || countdown > 0}
                          type="button"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <form className="chat-input-area" onSubmit={handleSubmit}>
                <textarea
                  ref={textareaRef}
                  className="chat-textarea"
                  placeholder={t('chat.placeholder')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={countdown > 0}
                />
                <button 
                  type="submit" 
                  className="chat-send-btn"
                  disabled={!inputValue.trim() || isLoading || countdown > 0}
                  aria-label="Send message"
                >
                  &rarr;
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
