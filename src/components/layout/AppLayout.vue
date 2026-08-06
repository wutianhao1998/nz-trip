// ================================
// 布局组件：AppLayout - 可爱贴纸手账风 🎀
//   - 胶带顶栏 + 贴纸标题
//   - 糖果色 TabBar / Nav
//   - 签名页脚 "Design by wutianhao"
// ================================
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTripStore } from '@/stores/trip'
import {
  IconHome,
  IconCalendar,
  IconTicket,
  IconCloud,
  IconInfo,
  IconChat,
  IconDownload,
  IconSettings,
  IconEye,
  IconEdit,
  IconUsers,
} from '@/components/icons'
import type { RouteRecordRaw } from 'vue-router'
import { exportFullTripPDF } from '@/utils/exportPdf'

const route = useRoute()
const router = useRouter()
const store = useTripStore()

const showSettings = ref(false)
const exporting = ref(false)

// Tab 配置（从路由 meta 中取）
const tabs = computed(() => {
  const all = router.options.routes.filter(
    (r: RouteRecordRaw) => r.meta?.icon && !r.redirect
  ) as Array<RouteRecordRaw & { meta: { title: string; icon: string } }>
  return all.map((r) => ({
    name: String(r.name),
    title: r.meta.title,
    icon: r.meta.icon,
  }))
})

const currentTitle = computed(() => {
  return (route.meta?.title as string) || '新西兰旅行手账'
})

// 根据路由给标题配一个不同颜色的贴纸
const titleStickerColor = computed(() => {
  const colorMap: Record<string, string> = {
    home: 'title-sticker--pink',
    schedule: 'title-sticker--mint',
    orders: 'title-sticker--lemon',
    weather: 'title-sticker--sky',
    notice: 'title-sticker--grape',
    chat: 'title-sticker--pink',
  }
  return colorMap[String(route.name)] || 'title-sticker--pink'
})

const iconMap: Record<string, unknown> = {
  home: IconHome,
  calendar: IconCalendar,
  ticket: IconTicket,
  cloud: IconCloud,
  info: IconInfo,
  chat: IconChat,
}

const handleExport = async () => {
  exporting.value = true
  try {
    const notices = [
      { title: '🇳🇿 入境禁忌 & 海关申报', content: store.noticeData.globalNotices.entryCustoms },
      { title: '🚗 交通规则（靠左行驶）', content: store.noticeData.globalNotices.trafficRules },
      { title: '💳 支付 & 网络', content: store.noticeData.globalNotices.paymentNetwork },
      { title: '📞 紧急联系电话', content: store.noticeData.globalNotices.emergencyContact },
      { title: '⛺ 露营规范', content: store.noticeData.globalNotices.campingRules },
      { title: '🥾 徒步安全须知', content: store.noticeData.safetyTips.hiking },
      { title: '🧊 冰川活动须知', content: store.noticeData.safetyTips.glacier },
      { title: '🌊 潮汐注意事项', content: store.noticeData.safetyTips.tide },
      { title: '🦭 野生动物注意', content: store.noticeData.safetyTips.wildlife },
      { title: '🌡️ 南北岛温差防护', content: store.noticeData.safetyTips.temperature },
    ]
    await exportFullTripPDF(
      {
        tripName: '新西兰旅行手账',
        dateRange: `${store.tripStartDate} 至 ${store.tripEndDate}`,
        days: store.totalTripDays,
      },
      store.daySchedules as unknown as { date: string; items: unknown[] }[],
      store.orders,
      notices
    )
  } finally {
    exporting.value = false
    showSettings.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- ================= 顶部导航：胶带+贴纸风 ================= -->
    <header class="no-print sticky top-0 z-30 safe-top">
      <!-- 胶带装饰（横跨页面上方） -->
      <div class="relative h-5 md:h-7 pointer-events-none overflow-hidden">
        <div class="washi-tape !-top-0.5 !h-6 md:!h-8 washi-tape--lemon" style="width: 42%; left: 20%" />
        <div class="washi-tape !-top-1 !h-6 md:!h-8 washi-tape--mint" style="width: 30%; left: 62%; transform: translateX(-50%) rotate(1.5deg)" />
      </div>

      <div class="bg-white/80 backdrop-blur-md border-b-2 border-dashed border-strawberry-200 shadow-washi">
        <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <!-- 左：Logo + 贴纸标题 -->
          <div class="flex items-center gap-3 min-w-0">
            <!-- 新西兰国旗贴纸 -->
            <div class="relative shrink-0">
              <div class="w-11 h-11 md:w-12 md:h-12 rounded-[1.1rem] bg-gradient-to-br from-skyblue-300 via-skyblue-400 to-skyblue-600 flex items-center justify-center shadow-sticker-sm border-2 border-white">
                <span class="text-2xl">🐑</span>
              </div>
              <!-- 小爱心贴纸 -->
              <span class="absolute -top-1.5 -right-1.5 text-lg animate-float">💕</span>
            </div>
            <div class="min-w-0">
              <!-- 贴纸标题 -->
              <div class="flex items-center gap-2">
                <span :class="['title-sticker !px-3.5 !py-1 !text-lg md:!text-xl', titleStickerColor]">
                  {{ currentTitle }}
                </span>
                <span class="hidden md:inline text-xl animate-wiggle">✨</span>
              </div>
              <!-- 用户信息：便签风 -->
              <div class="flex items-center gap-2 mt-2">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                  :style="{ background: store.currentUser?.color }"
                />
                <span class="text-xs md:text-sm text-ink-600 font-bold truncate font-hand">
                  @{{ store.currentUser?.nickname }}
                </span>
                <span
                  class="sticker-badge !px-2 !py-0.5 !text-[10px] md:!text-xs"
                  :class="store.isEditorMode ? 'sticker-badge--mint' : 'sticker-badge--sky'"
                >
                  <IconEdit v-if="store.isEditorMode" :size="10" class="inline" />
                  <IconEye v-else :size="10" class="inline" />
                  {{ store.isEditorMode ? '编辑中' : '只读' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 右：操作按钮（贴纸按钮） -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              class="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-lemon-100 border-2 border-lemon-300 text-lemon-700 hover:bg-lemon-200 active:scale-95 transition-all shadow-sticker-sm flex items-center justify-center group"
              :disabled="exporting"
              title="导出旅行手账PDF"
              @click="handleExport"
            >
              <IconDownload :size="18" :class="exporting ? 'animate-bounce' : ''" />
              <!-- 悬停显示小贴纸 -->
              <span class="hidden md:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-white border border-lemon-300 text-lemon-700 px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                导出PDF 📒
              </span>
            </button>
            <button
              class="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-grape-100 border-2 border-grape-300 text-grape-700 hover:bg-grape-200 active:scale-95 transition-all shadow-sticker-sm flex items-center justify-center"
              :class="{ 'ring-2 ring-grape-400 ring-offset-2 ring-offset-cream-50': showSettings }"
              title="设置 & 概览"
              @click="showSettings = !showSettings"
            >
              <IconSettings :size="18" :class="{ 'animate-spin': showSettings }" style="animation-duration: 3s" />
            </button>
          </div>
        </div>
      </div>

      <!-- 设置下拉面板：便签本风格 -->
      <transition name="dropdown">
        <div v-if="showSettings" class="no-print border-t-2 border-dashed border-grape-200 bg-cream-50/95 backdrop-blur-sm">
          <div class="max-w-5xl mx-auto px-4 py-4 space-y-4">
            <!-- 权限切换 -->
            <div class="trip-card trip-card--grape !rounded-2xl p-3 md:p-4">
              <div class="flex items-center justify-between flex-wrap gap-3">
                <div class="flex items-center gap-2">
                  <div class="w-9 h-9 rounded-xl bg-grape-200 flex items-center justify-center">
                    <IconUsers :size="18" class="text-grape-700" />
                  </div>
                  <div>
                    <div class="font-bold text-ink-800 text-sm md:text-base">🎨 编辑权限</div>
                    <div class="text-xs text-ink-500 font-hand">切换同伴协作模式</div>
                  </div>
                </div>
                <div class="flex gap-1.5 bg-white p-1 rounded-2xl border-2 border-dashed border-grape-200 shadow-sm">
                  <button
                    class="px-3 py-1.5 text-xs md:text-sm font-bold rounded-xl transition-all"
                    :class="store.isEditorMode
                      ? 'bg-strawberry-100 text-strawberry-700 shadow-sticker-sm border border-strawberry-300'
                      : 'text-ink-500 hover:text-ink-700'"
                    @click="store.toggleEditorMode(true)"
                  >
                    <IconEdit :size="12" class="inline mr-1" />编辑模式 ✏️
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs md:text-sm font-bold rounded-xl transition-all"
                    :class="!store.isEditorMode
                      ? 'bg-skyblue-100 text-skyblue-700 shadow-sticker-sm border border-skyblue-300'
                      : 'text-ink-500 hover:text-ink-700'"
                    @click="store.toggleEditorMode(false)"
                  >
                    <IconEye :size="12" class="inline mr-1" />只读模式 👀
                  </button>
                </div>
              </div>
            </div>

            <!-- 小提示便签 -->
            <div class="sticky-note sticky-note--pink !rotate-0">
              <div class="text-xs md:text-sm font-bold text-strawberry-800">
                💡 小贴士：点击上方下载按钮 📒，可以一键导出完整「新西兰旅行手账 PDF」，
                包含行程、订单、注意事项，直接打印出来贴在手账本上超可爱哦～
              </div>
            </div>

            <!-- 日期配置 -->
            <div class="trip-card trip-card--sky !rounded-2xl p-3 md:p-4">
              <div class="font-bold text-ink-800 text-sm md:text-base mb-3 flex items-center gap-2">
                <span class="text-xl">📅</span> 旅行时间安排
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-ink-500 mb-1.5 font-hand">✨ 出发日</label>
                  <input
                    type="date"
                    class="input-base py-2.5 text-sm"
                    :value="store.tripStartDate"
                    :disabled="!store.canEdit"
                    @change="(e) => {
                      const start = (e.target as HTMLInputElement).value
                      if (start <= store.tripEndDate) store.updateTripDates(start, store.tripEndDate)
                    }"
                  />
                </div>
                <div>
                  <label class="block text-xs text-ink-500 mb-1.5 font-hand">🏠 返程日</label>
                  <input
                    type="date"
                    class="input-base py-2.5 text-sm"
                    :value="store.tripEndDate"
                    :disabled="!store.canEdit"
                    @change="(e) => {
                      const end = (e.target as HTMLInputElement).value
                      if (store.tripStartDate <= end) store.updateTripDates(store.tripStartDate, end)
                    }"
                  />
                </div>
              </div>
            </div>

            <!-- 数据概览：4个小卡片 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 pt-1">
              <div class="trip-card trip-card--mint !rounded-2xl p-3 text-center !rotate-0">
                <div class="text-2xl md:text-3xl font-extrabold text-primary-700 font-sticker">
                  {{ store.totalTripDays }}
                </div>
                <div class="text-[11px] md:text-xs text-ink-500 mt-1 font-hand">旅行天数 🗓️</div>
              </div>
              <div class="trip-card trip-card--sky !rounded-2xl p-3 text-center !rotate-0">
                <div class="text-2xl md:text-3xl font-extrabold text-skyblue-700 font-sticker">
                  {{ store.totalScheduleItems }}
                </div>
                <div class="text-[11px] md:text-xs text-ink-500 mt-1 font-hand">行程条目 🎯</div>
              </div>
              <div class="trip-card trip-card--lemon !rounded-2xl p-3 text-center !rotate-0">
                <div class="text-2xl md:text-3xl font-extrabold text-lemon-700 font-sticker">
                  {{ store.paidOrderCount }}/{{ store.orders.length }}
                </div>
                <div class="text-[11px] md:text-xs text-ink-500 mt-1 font-hand">订单进度 🎫</div>
              </div>
              <div class="trip-card trip-card--pink !rounded-2xl p-3 text-center !rotate-0">
                <div class="text-2xl md:text-3xl font-extrabold text-strawberry-700 font-sticker">
                  {{ store.packedInventoryCount }}/{{ store.totalInventoryCount }}
                </div>
                <div class="text-[11px] md:text-xs text-ink-500 mt-1 font-hand">行李清单 🎒</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </header>

    <!-- ================= 桌面端快捷 Nav：贴纸胶囊 ================= -->
    <nav class="no-print hidden md:flex max-w-5xl w-full mx-auto px-4 gap-2 pt-4 pb-2 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="group px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 border-2 border-dashed relative"
        :class="route.name === tab.name
          ? 'bg-strawberry-100 text-strawberry-700 border-strawberry-300 shadow-sticker-sm scale-105 -rotate-0.5'
          : 'bg-white text-ink-600 hover:bg-cream-100 border-ink-200/40 hover:border-strawberry-200'"
        @click="router.push({ name: tab.name })"
      >
        <component :is="iconMap[tab.icon] || IconHome" :size="16" />
        {{ tab.title }}
        <span v-if="route.name === tab.name" class="absolute -top-2 -right-1 text-xs animate-sparkle">✨</span>
      </button>
    </nav>

    <!-- ================= 主内容区 ================= -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-5 pb-32 md:pb-8">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <!-- ============ 签名页脚：Design by wutianhao ============ -->
      <footer class="signature-footer" aria-label="作者签名">
        <!-- 胶带装饰 -->
        <div class="relative inline-block">
          <div class="washi-tape !top-0 !h-6 !w-40 washi-tape--pink" style="transform: translateX(-50%) rotate(-3deg)" />
          <div class="signature-footer__tape">
            <span class="signature-footer__name">✿ design by wutianhao ✿</span>
            <span class="signature-footer__label">
              ~ NZ Trip Journal · made with 💕 for my friends ~
            </span>
          </div>
          <!-- 周围小贴纸 -->
          <span class="absolute -left-10 top-1/2 -translate-y-1/2 text-2xl animate-float" style="animation-delay: 0.4s">🌸</span>
          <span class="absolute -right-8 top-0 text-xl animate-wiggle">🌟</span>
          <span class="absolute -right-4 -bottom-2 text-lg animate-float" style="animation-delay: 0.8s">🍡</span>
          <span class="absolute -left-6 -bottom-3 text-xl animate-wiggle" style="animation-delay: 0.2s">🦋</span>
        </div>

        <!-- 额外小花边 -->
        <div class="mt-6 text-center text-ink-400 text-xs font-hand tracking-widest">
          ✦ ✧ ❀ ✿ ❁ ✾ ✽ ❋ ✦ ✧ ❀ ✿ ❁ ✾ ✽ ❋ ✦
        </div>
      </footer>
    </main>

    <!-- ================= 移动端底部 TabBar：糖果色 ================= -->
    <nav class="no-print md:hidden glass-nav fixed bottom-3 left-3 right-3 z-30 rounded-[1.5rem] border-2 border-white shadow-sticker-lg overflow-hidden"
         style="background: linear-gradient(180deg, rgba(255,253,247,0.98) 0%, rgba(255,245,247,0.98) 100%); backdrop-filter: blur(10px)">
      <div class="grid grid-cols-6 gap-0.5 px-1.5 py-2.5">
        <button
          v-for="(tab, idx) in tabs"
          :key="tab.name"
          class="relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all duration-300"
          :class="route.name === tab.name
            ? 'scale-110'
            : 'text-ink-500'"
          @click="router.push({ name: tab.name })"
        >
          <!-- 选中态：贴纸背景 -->
          <div
            v-if="route.name === tab.name"
            class="absolute inset-0 rounded-2xl"
            :class="[
              idx % 5 === 0 ? 'bg-strawberry-200/70' :
              idx % 5 === 1 ? 'bg-primary-200/70' :
              idx % 5 === 2 ? 'bg-lemon-200/80' :
              idx % 5 === 3 ? 'bg-skyblue-200/70' :
              idx % 5 === 4 ? 'bg-grape-200/70' :
              'bg-peach-200/70'
            ]"
            style="transform: rotate(-1deg)"
          />
          <component
            :is="iconMap[tab.icon] || IconHome"
            :size="20"
            :stroke-width="route.name === tab.name ? 2.6 : 2"
            :class="[
              'relative z-10',
              route.name === tab.name ? (
                idx % 5 === 0 ? 'text-strawberry-700' :
                idx % 5 === 1 ? 'text-primary-800' :
                idx % 5 === 2 ? 'text-lemon-700' :
                idx % 5 === 3 ? 'text-skyblue-700' :
                idx % 5 === 4 ? 'text-grape-700' :
                'text-peach-700'
              ) : ''
            ]"
          />
          <span
            class="text-[9px] md:text-[10px] font-bold relative z-10"
            :class="route.name === tab.name ? 'text-ink-800' : ''"
          >
            {{ tab.title }}
          </span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.25s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateX(12px) scale(0.98);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px) scale(0.98);
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.dropdown-enter-to,
.dropdown-leave-from {
  max-height: 700px;
  transform: translateY(0);
}
</style>
