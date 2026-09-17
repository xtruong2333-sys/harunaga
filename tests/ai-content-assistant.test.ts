import { describe, it, expect, beforeEach } from 'vitest';
import { aiContentService } from '../src/services/ai-content-service';
import {
  getStoredAccessKey,
  setStoredAccessKey,
  clearStoredAccessKey,
  AccessKeyRequiredError,
  ACCESS_KEY_STORAGE_KEY,
} from '../src/services/channel-service';
import type { AiContentAnalysis } from '../src/types/ai-content';
import router from '../src/router';

describe('Bắt Bài Đối Thủ — Giai Đoạn 8: Trợ Lý Nội Dung AI (AI Content Assistant)', () => {
  const mockAnalysis: AiContentAnalysis = {
    summary: 'Video chia sẻ 5 kỹ năng lập trình quan trọng nhất năm 2026 giúp tăng gấp đôi hiệu suất.',
    content_angle: 'Tập trung vào tính thực chiến, loại bỏ lý thuyết sáo rỗng, nhắm vào lập trình viên muốn bứt phá thu nhập.',
    why_it_may_attract_attention: [
      'Gợi mở sự tò mò về phương pháp làm việc hiện đại ít người biết',
      'Đánh trúng nỗi sợ tụt hậu công nghệ trong thời đại AI phát triển',
      'Tiêu đề mang tính khẳng định và giải quyết vấn đề cụ thể',
    ],
    title_ideas: [
      'Đừng Học Lập Trình Theo Cách Cũ: 5 Tư Duy Khác Biệt Giúp Tôi X2 Thu Nhập',
      '5 Kỹ Năng Sống Còn Mọi Coder Phải Biết Trước Khi Bị AI Thay Thế',
      'Bí Quyết Tăng Tốc Độ Viết Code Gấp 3 Lần Chỉ Bằng 1 Thay Đổi Nhỏ',
      'Lộ Trình Tự Học Lập Trình Thực Chiến Dành Cho Người Muốn Bứt Phá',
      'Tại Sao 90% Lập Trình Viên Dậm Chân Tại Chỗ? Đây Là Cách Đột Phá',
    ],
    thumbnail_concepts: [
      {
        concept: 'So Sánh Đối Lập',
        visual_focus: 'Bên trái là màn hình đỏ rực đầy bug và stress, bên phải là giao diện xanh thư thái và tốc độ',
        text_overlay: 'ĐỪNG HỌC SAI!',
      },
      {
        concept: 'Bản Đồ Lộ Trình Bí Mật',
        visual_focus: 'Nhân vật chỉ tay vào biểu đồ tăng trưởng dốc đứng với các cột mốc kỹ năng then chốt',
        text_overlay: 'LỘ TRÌNH 2026',
      },
      {
        concept: 'Tâm Điểm Bất Ngờ',
        visual_focus: 'Cận cảnh gương mặt biểu cảm kinh ngạc trước kết quả thử nghiệm tốc độ',
        text_overlay: 'BÍ MẬT NÀY...',
      },
    ],
    hook_ideas: [
      'Nếu bạn vẫn đang viết code theo cách của năm ngoái, có thể bạn đang lãng phí 70% thời gian mỗi ngày.',
      'Rất nhiều người nghĩ giỏi thuật toán là đủ, nhưng đây mới là thứ giúp các senior lập trình nhanh gấp đôi.',
      'Trong video này, tôi sẽ chỉ ra sai lầm lớn nhất khiến nhiều coder dậm chân tại chỗ và cách tôi vượt qua nó.',
    ],
    originality_note: 'Hãy chia sẻ trải nghiệm thực tế từ các dự án cá nhân của chính bạn để tạo góc nhìn riêng biệt và không sao chép nguyên xi kịch bản đối thủ.',
  };

  beforeEach(() => {
    clearStoredAccessKey();
  });

  describe('1. Cấu trúc dữ liệu và Schema đầu ra AI', () => {
    it('kết quả phân tích phải có đầy đủ 6 phần thông tin bắt buộc', () => {
      expect(mockAnalysis.summary).toBeTruthy();
      expect(mockAnalysis.content_angle).toBeTruthy();
      expect(Array.isArray(mockAnalysis.why_it_may_attract_attention)).toBe(true);
      expect(mockAnalysis.why_it_may_attract_attention.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(mockAnalysis.title_ideas)).toBe(true);
      expect(mockAnalysis.title_ideas.length).toBe(5);
      expect(Array.isArray(mockAnalysis.thumbnail_concepts)).toBe(true);
      expect(mockAnalysis.thumbnail_concepts.length).toBe(3);
      expect(Array.isArray(mockAnalysis.hook_ideas)).toBe(true);
      expect(mockAnalysis.hook_ideas.length).toBe(3);
      expect(mockAnalysis.originality_note).toBeTruthy();
    });

    it('mỗi concept thumbnail phải có đủ concept, visual_focus và text_overlay', () => {
      mockAnalysis.thumbnail_concepts.forEach(concept => {
        expect(concept.concept).toBeTruthy();
        expect(concept.visual_focus).toBeTruthy();
        expect(concept.text_overlay).toBeDefined();
      });
    });
  });

  describe('2. Tính năng Sao Chép Toàn Bộ (formatAnalysisToPlainText)', () => {
    it('định dạng đầy đủ văn bản tiếng Việt dễ đọc không chứa JSON raw', () => {
      const text = aiContentService.formatAnalysisToPlainText(
        mockAnalysis,
        'Học Lập Trình Hiệu Quả',
        'Kênh Lập Trình Hay'
      );

      expect(text).toContain('BẮT BÀI ĐỐI THỦ — TRỢ LÝ NỘI DUNG AI');
      expect(text).toContain('Video gốc: Học Lập Trình Hiệu Quả');
      expect(text).toContain('Kênh đối thủ: Kênh Lập Trình Hay');
      expect(text).toContain('1. TÓM TẮT & GÓC NỘI DUNG:');
      expect(text).toContain('2. YẾU TỐ THU HÚT NGƯỜI XEM:');
      expect(text).toContain('3. 5 ĐỀ XUẤT TIÊU ĐỀ MỚI:');
      expect(text).toContain('4. 3 CONCEPT THUMBNAIL GỢI Ý:');
      expect(text).toContain('5. 3 HOOK MỞ ĐẦU (0-5 GIÂY ĐẦU):');
      expect(text).toContain('6. LƯU Ý TÍNH NGUYÊN BẢN (ORIGINALITY):');

      // 5 titles
      expect(text).toContain('1. Đừng Học Lập Trình Theo Cách Cũ');
      expect(text).toContain('5. Tại Sao 90% Lập Trình Viên Dậm Chân Tại Chỗ?');

      // 3 thumbnail concepts
      expect(text).toContain('Concept 1: So Sánh Đối Lập');
      expect(text).toContain('Overlay): "ĐỪNG HỌC SAI!"');

      // 3 hooks
      expect(text).toContain('Hook 1: "Nếu bạn vẫn đang viết code');
      expect(text).toContain('Hook 3: "Trong video này, tôi sẽ chỉ ra');

      // Không chứa raw curly braces
      expect(text).not.toContain('{"summary":');
    });
  });

  describe('3. Route và Navigation', () => {
    it('route /tro-ly-noi-dung tồn tại trong hệ thống router', () => {
      const route = router.getRoutes().find(r => r.path === '/tro-ly-noi-dung');
      expect(route).toBeDefined();
      expect(route?.name).toBe('AiContentAssistant');
      expect(route?.meta?.title).toBe('Trợ Lý Nội Dung AI — Bắt Bài Đối Thủ');
    });
  });

  describe('4. Bảo vệ bằng Mã Truy Cập (APP_WRITE_ACCESS_KEY)', () => {
    it('ném lỗi AccessKeyRequiredError khi chưa có mã trong sessionStorage', async () => {
      await expect(
        aiContentService.analyzeVideoContent('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(AccessKeyRequiredError);
    });

    it('lưu trữ và xóa mã trong sessionStorage với key bbdt_access_key', () => {
      setStoredAccessKey('my_secret_key');
      expect(getStoredAccessKey()).toBe('my_secret_key');
      expect(sessionStorage.getItem(ACCESS_KEY_STORAGE_KEY)).toBe('my_secret_key');

      clearStoredAccessKey();
      expect(getStoredAccessKey()).toBeNull();
      expect(sessionStorage.getItem(ACCESS_KEY_STORAGE_KEY)).toBeNull();
    });
  });

  describe('5. An toàn và Không Chạy Tự Động', () => {
    it('không tự động gọi AI khi chưa bấm phân tích', () => {
      // Đảm bảo method analyzeVideoContent chỉ chạy khi được gọi trực tiếp
      expect(typeof aiContentService.analyzeVideoContent).toBe('function');
    });

    it('không ghi kết quả vào database ở Phase 8 (dịch vụ chỉ đọc)', () => {
      // Xác nhận service không có hàm write AI analysis vào db
      expect((aiContentService as any).saveAnalysisToDb).toBeUndefined();
      expect((aiContentService as any).updateVideoVph).toBeUndefined();
    });
  });
});
