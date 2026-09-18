import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Card contrast hotfix', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '../src/styles/readability-hotfix.css'),
    'utf-8'
  );

  it('separates light page background from white card surfaces', () => {
    expect(css).toContain('--bg-page: #EEF4F9');
    expect(css).toContain('--border: #D2DEE9');
    expect(css).toContain('--border-strong: #B8CADB');
    expect(css).toContain('linear-gradient(180deg, #FFFFFF 0%, #FBFDFF 100%)');
  });

  it('gives nested telemetry and summary cards a visible secondary surface', () => {
    for (const selector of [
      '.telemetry-box',
      '.telemetry-card',
      '.summary-card',
      '.summary-metric-card',
    ]) {
      expect(css).toContain(selector);
    }
    expect(css).toContain('background-color: #F3F7FB !important');
  });

  it('strengthens table headers and row boundaries', () => {
    expect(css).toContain('background-color: #EAF1F8 !important');
    expect(css).toContain('border-bottom-color: #C8D6E4 !important');
    expect(css).toContain('border-bottom-color: #DDE6EF !important');
  });

  it('uses stronger semantic chip backgrounds without hiding text', () => {
    expect(css).toContain('#DDF7EA');
    expect(css).toContain('#FFF0C7');
    expect(css).toContain('#FDE5E5');
    expect(css).toContain('#E2ECFF');
  });

  it('does not apply global opacity or filters that reduce readability', () => {
    const contrastBlock = css.split('Card / Surface Contrast Hotfix')[1] || '';
    expect(contrastBlock).not.toMatch(/\bopacity\s*:/);
    expect(contrastBlock).not.toMatch(/filter:\s*(?:brightness|contrast|opacity)/);
  });
});
