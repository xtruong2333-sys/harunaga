import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Report clarity hotfix', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '../src/styles/readability-hotfix.css'),
    'utf-8'
  );

  it('scopes the clarity changes to the report page', () => {
    expect(css).toContain('Report Clarity Hotfix');
    expect(css).toContain('[data-theme="light"] .report-page');
  });

  it('removes light-mode glass blur from report surfaces', () => {
    const block = css.split('Report Clarity Hotfix')[1] || '';
    expect(block).toContain('backdrop-filter: none !important');
    expect(block).toContain('-webkit-backdrop-filter: none !important');
    expect(block).toContain('background: #FFFFFF !important');
  });

  it('uses stronger report text colors', () => {
    expect(css).toContain('color: #102033 !important');
    expect(css).toContain('color: #41546A !important');
    expect(css).toContain('color: #66768A !important');
  });

  it('strengthens report card and table boundaries', () => {
    expect(css).toContain('border-color: #C9D8E6 !important');
    expect(css).toContain('background: #E6EEF6 !important');
    expect(css).toContain('border-bottom-color: #BFCFDE !important');
  });

  it('does not introduce page-level opacity or visual filters', () => {
    const block = css.split('Report Clarity Hotfix')[1] || '';
    expect(block).not.toMatch(/\.report-page\s*\{[^}]*opacity\s*:/s);
    expect(block).not.toMatch(/filter:\s*(?:opacity|blur|brightness|contrast)/);
  });
});
