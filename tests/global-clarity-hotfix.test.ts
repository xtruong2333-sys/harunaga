import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Global clarity hotfix', () => {
  const root = path.resolve(__dirname, '..');
  const css = fs.readFileSync(path.join(root, 'src/styles/global-clarity-hotfix.css'), 'utf-8');
  const main = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf-8');

  it('loads after readability/report hotfix styles', () => {
    const readability = main.indexOf("@/styles/readability-hotfix.css");
    const clarity = main.indexOf("@/styles/global-clarity-hotfix.css");
    expect(readability).toBeGreaterThanOrEqual(0);
    expect(clarity).toBeGreaterThan(readability);
  });

  it('strengthens global light-mode tokens', () => {
    expect(css).toContain('--bg-page: #EAF1F7');
    expect(css).toContain('--text-primary: #102033');
    expect(css).toContain('--text-secondary: #34495F');
    expect(css).toContain('--text-muted: #596B7F');
    expect(css).toContain('--border: #C7D6E4');
  });

  it('removes glass blur from common light-mode cards', () => {
    expect(css).toContain('backdrop-filter: none !important');
    expect(css).toContain('-webkit-backdrop-filter: none !important');
    expect(css).toContain('background: #FFFFFF !important');
  });

  it('covers the pale pages found by the audit', () => {
    for (const selector of [
      '.data-health-observatory',
      '.alert-history-page',
      '.channel-comparison-page',
      '.publishing-schedule-page',
      '.video-investigation-workspace',
      '.growth-videos-workspace',
      '.opportunity-intelligence-workspace',
      '.recent-videos-workspace',
    ]) {
      expect(css).toContain(selector);
    }
  });

  it('makes tables and secondary controls visibly separated', () => {
    expect(css).toContain('background: #E5EDF5 !important');
    expect(css).toContain('border-bottom-color: #B9CADA !important');
    expect(css).toContain('background: #F8FBFD !important');
    expect(css).toContain('border-color: #BFCFDD !important');
  });

  it('keeps the fix visual-only without layout scaling or page opacity hacks', () => {
    expect(css).not.toMatch(/\bzoom\s*:/);
    expect(css).not.toMatch(/transform:\s*scale\(/);
    expect(css).not.toMatch(/\.report-page\s*\{[^}]*opacity\s*:/s);
    expect(css).not.toMatch(/\.data-health-observatory\s*\{[^}]*opacity\s*:/s);
  });
});
