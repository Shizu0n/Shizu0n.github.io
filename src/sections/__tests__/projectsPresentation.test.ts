import { describe, expect, it } from 'vitest';
import { getShowcaseProjects } from '../../components/chatProjectCatalog';
import { PROJECT_PRESENTATION } from '../projectsPresentation';

const SPAN: Record<string, number> = { feature: 7, tall: 5, standard: 5, wide: 7, full: 12 };

describe('project grid ↔ catalog reconciliation', () => {
  it('has presentation chrome for exactly the canonical showcase projects', () => {
    const catalogIds = getShowcaseProjects()
      .map((project) => project.id)
      .sort();
    const presentationIds = Object.keys(PROJECT_PRESENTATION).sort();

    expect(presentationIds).toEqual(catalogIds);
  });

  it('includes the application systems and the AI / ML group', () => {
    const ids = getShowcaseProjects().map((p) => p.id);
    expect(ids).toContain('gym-management'); // app project that was previously missing from the grid
    expect(ids[4]).toBe('campus-cycle');
    expect(ids).toEqual(expect.arrayContaining(['react-agent', 'advanced-rag', 'phi3-mini-sql']));
  });

  it('lays the unified grid out so every 12-column row is filled', () => {
    const variants = getShowcaseProjects().map((project) => SPAN[PROJECT_PRESENTATION[project.id].variant]);
    const total = variants.reduce((sum, span) => sum + span, 0);

    expect(total).toBe(60); // 9 tiles across five 12-column rows

    let rowSpan = 0;
    for (const span of variants) {
      rowSpan += span;
      expect(rowSpan).toBeLessThanOrEqual(12);
      if (rowSpan === 12) {
        rowSpan = 0;
      }
    }
    expect(rowSpan).toBe(0);
  });
});
