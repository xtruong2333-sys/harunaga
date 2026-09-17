import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
const ChannelsPage = () => import('@/pages/ChannelsPage.vue');
const VideosPage = () => import('@/pages/VideosPage.vue');
const VideoDetailPage = () => import('@/pages/VideoDetailPage.vue');
const OverviewPage = () => import('@/pages/OverviewPage.vue');
const ChannelDetailPage = () => import('@/pages/ChannelDetailPage.vue');
const OpportunityVideosPage = () => import('@/pages/OpportunityVideosPage.vue');
const AiContentAssistantPage = () => import('@/pages/AiContentAssistantPage.vue');
const ProductionPage = () => import('@/pages/ProductionPage.vue');
const DataHealthPage = () => import('@/pages/DataHealthPage.vue');
const ChannelComparisonPage = () => import('@/pages/ChannelComparisonPage.vue');
const AlertHistoryPage = () => import('@/pages/AlertHistoryPage.vue');
const NewVideosPage = () => import('@/pages/NewVideosPage.vue');
const PublishingSchedulePage = () => import('@/pages/PublishingSchedulePage.vue');
const ReportPage = () => import('@/pages/ReportPage.vue');

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tong-quan',
  },
  {
    path: '/tong-quan',
    name: 'Overview',
    component: OverviewPage,
    meta: {
      title: 'Tổng Quan — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/bao-cao',
    name: 'Report',
    component: ReportPage,
    meta: {
      title: 'Báo Cáo — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/video-moi-dang',
    name: 'NewVideos',
    component: NewVideosPage,
    meta: {
      title: 'Video Mới Đăng — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/video-tiem-nang',
    name: 'OpportunityVideos',
    component: OpportunityVideosPage,
    meta: {
      title: 'Video Tiềm Năng — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/videos',
    name: 'Videos',
    component: VideosPage,
    meta: {
      title: 'Video Đang Tăng — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/videos/:id',
    name: 'VideoDetail',
    component: VideoDetailPage,
    meta: {
      title: 'Chi Tiết Video — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/kenh-theo-doi',
    name: 'KenhTheoDoi',
    component: ChannelsPage,
    meta: {
      title: 'Kênh Theo Dõi — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/kenh-theo-doi/:id',
    name: 'ChannelDetail',
    component: ChannelDetailPage,
    meta: {
      title: 'Phân Tích Kênh — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/so-sanh-kenh',
    name: 'ChannelComparison',
    component: ChannelComparisonPage,
    meta: {
      title: 'So Sánh Kênh — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/lich-dang-doi-thu',
    name: 'PublishingSchedule',
    component: PublishingSchedulePage,
    meta: {
      title: 'Lịch Đăng Của Đối Thủ — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/lich-su-canh-bao',
    name: 'AlertHistory',
    component: AlertHistoryPage,
    meta: {
      title: 'Lịch Sử Cảnh Báo — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/tro-ly-noi-dung',
    name: 'AiContentAssistant',
    component: AiContentAssistantPage,
    meta: {
      title: 'Trợ Lý Nội Dung AI — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/tien-do-san-xuat',
    name: 'Production',
    component: ProductionPage,
    meta: {
      title: 'Tiến Độ Sản Xuất — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/tinh-trang-du-lieu',
    name: 'DataHealth',
    component: DataHealthPage,
    meta: {
      title: 'Tình Trạng Dữ Liệu — Bắt Bài Đối Thủ',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tong-quan',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
  next();
});

export default router;
