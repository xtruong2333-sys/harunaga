import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ChannelsPage from '@/pages/ChannelsPage.vue';
import VideosPage from '@/pages/VideosPage.vue';
import VideoDetailPage from '@/pages/VideoDetailPage.vue';
import OverviewPage from '@/pages/OverviewPage.vue';
import ChannelDetailPage from '@/pages/ChannelDetailPage.vue';
import OpportunityVideosPage from '@/pages/OpportunityVideosPage.vue';
import AiContentAssistantPage from '@/pages/AiContentAssistantPage.vue';
import ProductionPage from '@/pages/ProductionPage.vue';

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
