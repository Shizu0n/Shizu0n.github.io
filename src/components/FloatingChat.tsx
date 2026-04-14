import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useChat } from '../hooks/useChat';
import { useTranslation } from '../contexts/TranslationContext';

const SUGGESTED_PROMPTS = [
  "What do you build?",
  "Top projects",
  "Tech stack",
  "Contact info",
];

export default function FloatingChat() {
  const { t, language } = useTranslation()
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const { messages, isLoading, error, quotaInfo, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

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
        if (loadingStep === 0) return "Consultando base vetorial...";
        if (loadingStep === 1) return "Recuperando contexto neural...";
        return "Conectando ao modelo...";
     } else {
        if (loadingStep === 0) return "Querying vector base...";
        if (loadingStep === 1) return "Retrieving neural context...";
        return "Connecting to model...";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
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
              onPointerDown={(e) => dragControls.start(e)}
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

            <div className="chat-messages" data-lenis-prevent="true">
              {messages.length === 0 && (
                <div className="chat-empty-state">
                  <span className="chat-empty-icon">⌘</span>
                  <p>{t('chat.emptyMsg')}</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
                  <span className="chat-message-role">
                    {msg.role === 'user' ? 'You' : 'Paulo'}
                  </span>
                  <p className="chat-message-content">{msg.content}</p>
                </div>
              ))}

              {isLoading && (
                <div className="chat-message chat-message--assistant">
                  <span className="chat-message-role">Paulo</span>
                  <div className="chat-typing-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                     >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                     </motion.div>
                     <span style={{ fontSize: '0.85rem', color: '#888' }}>{getLoadingText()}</span>
                  </div>
                </div>
              )}
              
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

            {messages.length === 0 && (
              <div className="chat-suggestions">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    className="chat-suggestion-chip"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
