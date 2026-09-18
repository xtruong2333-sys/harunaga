import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Readability typography hotfix', () => {
  const root = path.resolve(__dirname, '..');
  const css = fs.readFileSync(path.join(root, 'src/styles/readability-hotfix.css'), 'utf-8');
  const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf-8');

  it('loads readability CSS after the existing global style layers', () => {
    const mainIndex = main.indexOf("@/styles/main.css");
    const waveIndex = main.indexOf("@/styles/wave22.css");
    const readabilityIndex = main.indexOf("@/styles/readability-hotfix.css");

    expect(mainIndex).toBeGreaterThanOrEqual(0);
    expect(waveIndex).toBeGreaterThan(mainIndex);
    expect(readabilityIndex).toBeGreaterThan(waveIndex);
  });

  it('raises the global body typography without scaling the layout', () => {
    expect(css).toContain('--readability-body: 15px');
    expect(css).toMatch(/body\s*\{[\s\S]*font-size:\s*var\(--readability-body\)\s*!important/);
    expect(css).not.toMatch(/\bzoom\s*:/);
    expect(css).not.toMatch(/transform:\s*scale\(/);
  });

  it('keeps micro labels and sidebar hints above the old 9–10px range', () => {
    expect(css).toContain('--readability-micro: 11.5px');
    expect(css).toMatch(/\.nav-group-title[\s\S]*font-size:\s*11\.5px\s*!important/);
    expect(css).toMatch(/\.item-hint[\s\S]*font-size:\s*11\.5px\s*!important/);
    expect(css).toMatch(/\.kpi-label[\s\S]*font-size:\s*11\.5px\s*!important/);
    expect(css).toMatch(/\.kpi-sub[\s\S]*font-size:\s*12px\s*!important/);
  });

  it('covers cross-page microcopy found in the audit', () => {
    for (const selector of [
      '.wireframe-note',
      '.field-label',
      '.threshold-sub',
      '.priority-badge',
      '.stage-label',
      '.source-tag',
      '.video-id',
      '.badge-threshold',
      '.header-eyebrow',
    ]) {
      expect(css).toContain(selector);
    }
  });

  it('makes tables readable at desktop density', () => {
    expect(css).toMatch(/table\s*\{[\s\S]*font-size:\s*13\.5px\s*!important/);
    expect(css).toMatch(/table th\s*\{[\s\S]*font-size:\s*11\.75px\s*!important/);
    expect(css).toMatch(/table td\s*\{[\s\S]*font-size:\s*13\.5px\s*!important/);
    expect(css).toMatch(/padding-top:\s*11px\s*!important/);
  });

  it('improves light and dark secondary text contrast', () => {
    expect(css).toContain('--text-secondary: #3F4F63');
    expect(css).toContain('--text-muted: #56657A');
    expect(css).toContain('--text-secondary: #A8B5C5');
    expect(css).toContain('--text-muted: #7F90A6');
  });
});
