import { describe, expect, it } from 'vitest';
import { extractProjectActions, getShowcaseProjects } from '../chatProjectCatalog';

describe('chatProjectCatalog.extractProjectActions', () => {
  it('returns all catalog projects when explicit list mode is enabled', () => {
    const result = extractProjectActions('any content', true);

    expect(result).toHaveLength(5);
    // Catalog is AI-first, followed by the portfolio itself and CampusCycle.
    expect(result.map((project) => project.id)).toEqual([
      'react-agent',
      'advanced-rag',
      'phi3-mini-sql',
      'shizu0n-cv',
      'campus-cycle',
    ]);
  });

  it('places CampusCycle after the portfolio with both public links', () => {
    const projects = getShowcaseProjects();
    const campusCycle = projects[4];

    expect(projects).toHaveLength(9);
    expect(campusCycle).toMatchObject({
      id: 'campus-cycle',
      name: 'CampusCycle',
      github: 'https://github.com/Shizu0n/CampusCycle',
      live: 'https://campus-cycles.vercel.app',
    });
  });

  it('returns only explicitly mentioned projects', () => {
    const content = 'Delivery System is great for operations and Referral System is great for auth.';
    const result = extractProjectActions(content, false);

    expect(result.map((project) => project.id)).toEqual(['delivery-system', 'referral-system']);
  });

  it('parses a natural CampusCycle reference without duplicating its card', () => {
    const content = 'O marketplace do campus funciona offline; esse marketplace do campus usa uma fila local.';
    const result = extractProjectActions(content, false);

    expect(result.map((project) => project.id)).toEqual(['campus-cycle']);
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
