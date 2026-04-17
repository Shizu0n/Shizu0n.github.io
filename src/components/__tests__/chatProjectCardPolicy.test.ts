import { describe, expect, it } from 'vitest';
import { buildProjectCardVisibilityMap } from '../chatProjectCardPolicy';
import type { ChatMessage } from '../../hooks/useChat';

const createMessage = (
  id: string,
  role: 'user' | 'assistant',
  content: string,
  intent?: string,
): ChatMessage => ({
  id,
  role,
  content,
  timestamp: 1,
  intent: intent ?? null,
});

describe('chatProjectCardPolicy.buildProjectCardVisibilityMap', () => {
  it('shows all project cards for explicit list requests', () => {
    const messages: ChatMessage[] = [
      createMessage('u1', 'user', 'List all your projects.'),
      createMessage('a1', 'assistant', 'Sure, here is a complete overview.'),
    ];

    const map = buildProjectCardVisibilityMap(messages);
    const state = map.get('a1');

    expect(state?.show).toBe(true);
    expect(state?.projectActions).toHaveLength(5);
  });

  it('shows only the project explicitly asked by the user', () => {
    const messages: ChatMessage[] = [
      createMessage('u1', 'user', 'Tell me about Delivery System.'),
      createMessage('a1', 'assistant', 'Delivery System and Referral System are both strong projects.'),
    ];

    const map = buildProjectCardVisibilityMap(messages);
    const state = map.get('a1');

    expect(state?.show).toBe(true);
    expect(state?.projectActions.map((project) => project.id)).toEqual(['delivery-system']);
  });

  it('hides cards for off-topic hiring prompts', () => {
    const messages: ChatMessage[] = [
      createMessage('u1', 'user', 'Why should a company hire you?'),
      createMessage('a1', 'assistant', 'I built Delivery System and Referral System.', 'fallback'),
    ];

    const map = buildProjectCardVisibilityMap(messages);
    const state = map.get('a1');

    expect(state?.show).toBe(false);
    expect(state?.projectActions).toEqual([]);
  });

  it('shows cards for stack lookup only when assistant explicitly names projects', () => {
    const messages: ChatMessage[] = [
      createMessage('u1', 'user', 'In which projects does React appear?'),
      createMessage('a1', 'assistant', 'React appears in Delivery System and Referral System.', 'stack_lookup'),
    ];

    const map = buildProjectCardVisibilityMap(messages);
    const state = map.get('a1');

    expect(state?.show).toBe(true);
    expect(state?.projectActions.map((project) => project.id)).toEqual(['delivery-system', 'referral-system']);
  });

  it('hides cards when stack lookup answer has no explicit project name', () => {
    const messages: ChatMessage[] = [
      createMessage('u1', 'user', 'In which projects does React appear?'),
      createMessage('a1', 'assistant', 'React appears in several full stack systems.', 'stack_lookup'),
    ];

    const map = buildProjectCardVisibilityMap(messages);
    const state = map.get('a1');

    expect(state?.show).toBe(false);
    expect(state?.projectActions).toEqual([]);
  });

  it('blocks cards when backend intent is contact', () => {
    const messages: ChatMessage[] = [
      createMessage('u1', 'user', 'How can I contact you?'),
      createMessage('a1', 'assistant', 'You can check Delivery System on GitHub and send me an email.', 'contact'),
    ];

    const map = buildProjectCardVisibilityMap(messages);
    const state = map.get('a1');

    expect(state?.show).toBe(false);
    expect(state?.projectActions).toEqual([]);
  });
});
