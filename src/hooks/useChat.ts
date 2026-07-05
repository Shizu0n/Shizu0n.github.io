import { useState, useCallback, useEffect } from 'react';

const LOCALHOST_API_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i;

const REMOTE_CHAT_API_URL = 'https://shizu0n.vercel.app/api/chat';

const pushUnique = (list: string[], value: string) => {
  if (!list.includes(value)) {
    list.push(value);
  }
};

const resolveChatApiUrls = (): string[] => {
  const configuredBase = import.meta.env.VITE_CHAT_API_URL?.trim();
  const currentHost = window.location.hostname;
  const isLocalPage = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const urls: string[] = [];

  if (configuredBase) {
    const normalizedBase = configuredBase.replace(/\/+$/, '');
    const configuredChatUrl = `${normalizedBase}/api/chat`;

    if (isLocalPage) {
      // In localhost environments, prefer local API (vercel dev) and fallback to configured remote.
      pushUnique(urls, '/api/chat');
      pushUnique(urls, configuredChatUrl);
      return urls;
    }

    // Avoid broken production calls caused by localhost values baked into build env.
    if (LOCALHOST_API_REGEX.test(normalizedBase) && !isLocalPage) {
      pushUnique(urls, REMOTE_CHAT_API_URL);
      return urls;
    }

    pushUnique(urls, configuredChatUrl);
    return urls;
  }

  if (isLocalPage) {
    // Try local first (works in vercel dev). If local route is not available, fallback to deployed API.
    pushUnique(urls, '/api/chat');
    pushUnique(urls, REMOTE_CHAT_API_URL);
    return urls;
  }

  pushUnique(urls, '/api/chat');
  return urls;
};

const extractApiErrorMessage = async (response: Response): Promise<{ error: string, quotaInfo?: QuotaInfo }> => {
  try {
    const payload = await response.json();
    if (payload?.isQuotaExceeded) {
       return {
         error: typeof payload.error === 'string' ? payload.error : 'Rate limited',
         quotaInfo: {
            isQuotaExceeded: true,
            retryAfterSeconds: payload.retryAfterSeconds || 60,
            resetTimestamp: payload.quotaResetTime || null
         }
       };
    }
    if (payload?.error && typeof payload.error === 'string') {
      return { error: payload.error };
    }
  } catch {
    // Ignore JSON parse issues and fallback to generic message.
  }

  return { error: 'Failed to send message.' };
};

const buildRequestMessages = (messages: ChatMessage[], userMessage: ChatMessage) => {
  return [...messages, userMessage]
    .filter(message => !message.failed && message.content.trim().length > 0)
    .map(message => ({
      role: message.role,
      content: message.content
    }));
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  failed?: boolean;
  intent?: string | null;
  suggestions?: string[];
}

export interface QuotaInfo {
  isQuotaExceeded: boolean;
  retryAfterSeconds: number;
  resetTimestamp: number | null;
}

export type ChatErrorCode = 'network' | 'rate_limited' | 'overloaded' | 'generic';

const classifyErrorCode = (err: any): ChatErrorCode => {
  if (err?.code) return err.code as ChatErrorCode;
  const message = typeof err?.message === 'string' ? err.message : '';
  if (message === 'Failed to fetch') return 'network';
  if (/overload|temporar|internal server error|try again/i.test(message)) return 'overloaded';
  return 'generic';
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ChatErrorCode | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo>({
    isQuotaExceeded: false,
    retryAfterSeconds: 0,
    resetTimestamp: null
  });

  useEffect(() => {
    sessionStorage.setItem('chat_history', JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const getLocalCache = (text: string) => {
    try {
      const cacheBytes = sessionStorage.getItem(`chat_cache_${text.trim().toLowerCase()}`);
      if (cacheBytes) return JSON.parse(cacheBytes);
    } catch (e) {
      // ignore
    }
    return null;
  };
  
  const setLocalCache = (text: string, response: string) => {
    try {
      sessionStorage.setItem(`chat_cache_${text.trim().toLowerCase()}`, JSON.stringify(response));
    } catch (e) {
      // ignore
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem('chat_history');
    setError(null);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      failed: false
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setLastFailedText(null);

    const assistantMessageId = crypto.randomUUID();
    let currentAssistantText = '';

    setMessages(prev => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        intent: null
      }
    ]);

    // Client-side cache check
    const cachedResponse = getLocalCache(text);
    if (cachedResponse) {
      setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMessageId ? { ...m, content: cachedResponse } : m
        ));
        setIsLoading(false);
      }, 400); // Small natural delay
      return;
    }

    try {
      const apiUrls = resolveChatApiUrls();
      let lastError: Error | null = null;

      for (let index = 0; index < apiUrls.length; index += 1) {
        const apiUrl = apiUrls[index];
        const hasFallback = index < apiUrls.length - 1;

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: buildRequestMessages(messages, userMessage)
            })
          });

          if (!response.ok) {
            if (response.status === 429) {
              const apiErrorData = await extractApiErrorMessage(response);
              const retryAfter = response.headers.get('retry-after');
              const retryHint = retryAfter ? ` Retry in ${retryAfter}s.` : '';
              const customErr = new Error(`${apiErrorData.error}${retryHint}`.trim());
              (customErr as any).code = 'rate_limited';
              // Any 429 drives the countdown UI, even when the payload lacks quota metadata.
              const retryAfterSeconds = apiErrorData.quotaInfo?.retryAfterSeconds
                || Number(retryAfter)
                || 30;
              (customErr as any).quotaInfo = {
                isQuotaExceeded: true,
                retryAfterSeconds,
                resetTimestamp: apiErrorData.quotaInfo?.resetTimestamp
                  || Date.now() + retryAfterSeconds * 1000
              };
              throw customErr;
            }

            const apiErrorData = await extractApiErrorMessage(response);
            const apiErrorMessage = apiErrorData.error;

            // Local API can be unavailable in plain Vite dev or unstable in remote environments.
            if ((response.status >= 500 || response.status === 404) && hasFallback) {
              lastError = new Error(apiErrorMessage);
              continue;
            }

            throw new Error(apiErrorMessage);
          }

          const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
          const responseIntent = response.headers.get('x-chat-intent');

          if (responseIntent) {
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId ? { ...m, intent: responseIntent } : m
            ));
          }

          if (!contentType.includes('text/event-stream')) {
            if (hasFallback) {
              lastError = new Error('Invalid chat response format.');
              continue;
            }

            throw new Error('Invalid chat response format.');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          if (!reader) throw new Error('No stream available.');

          let done = false;
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunkString = decoder.decode(value, { stream: true });
              const lines = chunkString.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6);
                  if (dataStr === '[DONE]') {
                    done = true;
                    break;
                  }
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.text) {
                      currentAssistantText += parsed.text;
                      setMessages(prev => prev.map(m =>
                        m.id === assistantMessageId ? { ...m, content: currentAssistantText } : m
                      ));
                    }
                    if (Array.isArray(parsed.suggestions)) {
                      const suggestions = parsed.suggestions.filter((s: unknown): s is string => typeof s === 'string')
                      setMessages(prev => prev.map(m =>
                        m.id === assistantMessageId ? { ...m, suggestions } : m
                      ));
                    }
                  } catch {
                    // Ignore incomplete chunks
                  }
                }
              }
            }
          }
          
          if (currentAssistantText.trim()) {
            setLocalCache(text, currentAssistantText);
          }

          return;
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error('Failed to send message.');

          if (hasFallback && (lastError.message === 'Failed to fetch' || lastError.message === 'Invalid chat response format.')) {
            continue;
          }

          throw lastError;
        }
      }

      if (lastError) {
        throw lastError;
      }

      throw new Error('Failed to send message.');
    } catch (err: any) {
      setMessages(prev => prev
        .filter(message => message.id !== assistantMessageId)
        .map(message => (
          message.id === userMessage.id
            ? { ...message, failed: true }
            : message
        ))
      );

      if (err?.quotaInfo) {
        setQuotaInfo(err.quotaInfo);
      }

      setErrorCode(classifyErrorCode(err));
      setLastFailedText(text);

      if (err?.message === 'Failed to fetch') {
        setError('Network error: unable to reach chat API. Check VITE_CHAT_API_URL and backend deployment.');
      } else if (err?.message === 'Internal Server Error') {
        setError('Chat API temporary failure. Try again in a few seconds.');
      } else {
        setError(err.message || 'An error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const retry = useCallback(() => {
    if (!lastFailedText) return;
    const text = lastFailedText;
    // Drop the failed bubble so the retried question isn't shown twice.
    setMessages(prev => prev.filter(message => !(message.failed && message.content === text)));
    void sendMessage(text);
  }, [lastFailedText, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    errorCode,
    canRetry: lastFailedText !== null,
    retry,
    quotaInfo,
    sendMessage,
    clearChat
  };
}
