import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Tag and micro contrast hotfix', () => {
  const root = path.resolve(__dirname, '..');
  const css = fs.readFileSync(path.join(root, 'src/styles/tag-micro-contrast-hotfix.css'), 'utf-8');
  const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf-8');

  it('loads after the global clarity layer', () => {
    const clarity = main.indexOf("@/styles/global-clarity-hotfix.css");
    const micro = main.indexOf("@/styles/tag-micro-contrast-hotfix.css");
    expect(clarity).toBeGreaterThanOrEqual(0);
    expect(micro).toBeGreaterThan(clarity);
  });

  it('defines stronger semantic chip tokens', () => {
    for (const token of [
      '--chip-blue-bg: #DCE9FF',
      '--chip-green-bg: #D8F2E4',
      '--chip-amber-bg: #FFEAB0',
      '--chip-red-bg: #F9DCDC',
      '--chip-slate-bg: #E4EBF2',
    ]) {
      expect(css).toContain(token);
    }
  });

  it('covers common badge and status families', () => {
    for (const selector of [
      '.badge-accent',
      '.badge-active',
      '.badge-warning',
      '.badge-danger',
      '.badge-archived',
      '.trigger-tag',
      '.status-pill',
      '.fresh-pill',
      '.priority-badge',
      '.ch-count-badge',
      '.ops-card-badge',
    ]) {
      expect(css).toContain(selector);
    }
  });

  it('strengthens micro metadata and small value labels', () => {
    for (const selector of [
      '.compact-meta',
      '.timeline-time',
      '.metric-sub',
      '.summary-sub',
      '.item-hint',
      '.metric-label',
      '.fact-label',
      '.rail-label',
      '.timestamp-bar',
    ]) {
      expect(css).toContain(selector);
    }
  });

  it('keeps this fix visual-only', () => {
    expect(css).not.toMatch(/\bzoom\s*:/);
    expect(css).not.toMatch(/transform:\s*scale\(/);
    expect(css).not.toMatch(/opacity:\s*0\.[0-4]/);
  });
});
