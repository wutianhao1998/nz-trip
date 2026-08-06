// ================================
// Vue Router 路由配置
// ================================
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useTripStore } from '@/stores/trip'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    // 首页作为昵称入口，requiresAuth 设为 false，由 NicknameModal 组件自行弹出
    meta: { title: '行程总览', icon: 'home', requiresAuth: false },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/ScheduleView.vue'),
    meta: { title: '每日行程', icon: 'calendar', requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/OrdersView.vue'),
    meta: { title: '订票台账', icon: 'ticket', requiresAuth: true },
  },
  {
    path: '/weather',
    name: 'Weather',
    component: () => import('@/views/WeatherView.vue'),
    meta: { title: '天气预报', icon: 'cloud', requiresAuth: true },
  },
  {
    path: '/notice',
    name: 'Notice',
    component: () => import('@/views/NoticeView.vue'),
    meta: { title: '出行须知', icon: 'info', requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue'),
    meta: { title: '同伴留言', icon: 'chat', requiresAuth: true },
  },
  // 404 重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  // 使用 hash 模式，适配 Vercel 等静态托管无需额外配置
  history: createWebHashHistory(),
  routes,
  // 滚动行为：切换路由回顶部
  scrollBehavior() {
    return { top: 0 }
  },
})

// 路由守卫：需要设置昵称后才能访问功能页
router.beforeEach((to) => {
  const tripStore = useTripStore()
  if (to.meta.requiresAuth && !tripStore.currentUser) {
    return { path: '/' }
  }
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} · 新西兰旅行规划`
  }
  return true
})

export default router
