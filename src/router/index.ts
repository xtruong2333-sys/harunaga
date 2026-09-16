import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ChannelsPage from '@/pages/ChannelsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/kenh-theo-doi',
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
    path: '/:pathMatch(.*)*',
    redirect: '/kenh-theo-doi',
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
