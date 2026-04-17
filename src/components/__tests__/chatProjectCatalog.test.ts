import { describe, expect, it } from 'vitest';
import { extractProjectActions } from '../chatProjectCatalog';

describe('chatProjectCatalog.extractProjectActions', () => {
  it('returns all catalog projects when explicit list mode is enabled', () => {
    const result = extractProjectActions('any content', true);

    expect(result).toHaveLength(5);
    expect(result.map((project) => project.id)).toEqual([
      'academic-system',
      'delivery-system',
      'gym-management',
      'referral-system',
      'shizu0n-cv',
    ]);
  });

  it('returns only explicitly mentioned projects', () => {
    const content = 'Delivery System is great for operations and Referral System is great for auth.';
    const result = extractProjectActions(content, false);

    expect(result.map((project) => project.id)).toEqual(['delivery-system', 'referral-system']);
  });

  it('does not return cards when only stack names are present', () => {
    const content = 'I have experience with React, TypeScript, Java, and MySQL.';
    const result = extractProjectActions(content, false);

    expect(result).toEqual([]);
  });

  it('does not produce false positives for unrelated text', () => {
    const content = 'How can I contact you for internship opportunities?';
    const result = extractProjectActions(content, false);

    expect(result).toEqual([]);
  });
});
