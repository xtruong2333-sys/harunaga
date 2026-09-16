import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Bắt Bài Đối Thủ — Kiểm tra tuân thủ ngôn ngữ giao diện (Section 48)', () => {
  const forbiddenEnglishTerms = [
    'Radar',
    'Dashboard',
    'Channel Manager',
    'Watchlist',
    'Pipeline',
    'Inspector',
    'Data Health',
    'Bulk Add',
    'Active',
    'Paused',
    'Archived',
    'Last Scan',
    'Scan Limit',
    'Alert Threshold',
  ];

  function getAllVueFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllVueFiles(fullPath));
      } else if (file.endsWith('.vue')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  it('Các component Vue không chứa từ ngữ tiếng Anh bị cấm trên giao diện', () => {
    const vueFiles = getAllVueFiles(path.resolve(__dirname, '../src'));
    expect(vueFiles.length).toBeGreaterThan(0);

    const violations: { file: string; term: string; line: number }[] = [];

    vueFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Chỉ kiểm tra phần <template> hiển thị ra người dùng
      let inTemplate = false;

      lines.forEach((line, index) => {
        if (line.includes('<template')) inTemplate = true;
        if (line.includes('</template>')) inTemplate = false;

        if (inTemplate) {
          // Bỏ qua comments HTML
          if (line.trim().startsWith('<!--')) return;

          forbiddenEnglishTerms.forEach(term => {
            // Regex tìm từ độc lập trong text render (không phải prop hay code nội bộ)
            // Tìm text nằm giữa tags > và < hoặc text rõ ràng
            const regex = new RegExp(`>\\s*[^<]*\\b${term}\\b[^<]*<`, 'i');
            if (regex.test(line)) {
              // Ngoại trừ các thuộc tính hoặc biến nội bộ
              violations.push({
                file: path.basename(filePath),
                term,
                line: index + 1,
              });
            }
          });
        }
      });
    });

    if (violations.length > 0) {
      console.error('Phát hiện vi phạm ngôn ngữ UI:', violations);
    }
    expect(violations).toEqual([]);
  });
});
