// ================================
// 页面视图：Dashboard 行程总览
// ================================
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTripStore } from '@/stores/trip'
import {
  IconCalendar,
  IconTicket,
  IconPackage,
  IconMapPin,
  IconChevronRight,
  IconAlert,
  IconPlus,
  IconCloud,
  IconUsers,
} from '@/components/icons'
import WeatherIcon from '@/components/common/WeatherIcon.vue'
import { getCitiesWeather } from '@/services/weather'
import { NZ_CITIES } from '@/utils/constants'
import type { WeatherData } from '@/types'
import { formatDateCN, isUpcoming, formatNZD, getOrderStatusColor } from '@/utils'

const router = useRouter()
const store = useTripStore()

const weatherLoading = ref(true)
const cityWeathers = ref<Record<string, WeatherData>>({})

// 临近订单（3天内的未核销订单）
const upcomingOrders = computed(() => {
  return store.orders
    .filter((o) => o.dateTime && isUpcoming(o.dateTime, 3) && o.status !== '已核销')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 5)
})

// 今日/最近的行程
const todayStr = new Date().toISOString().slice(0, 10)
const nearestDaySchedule = computed(() => {
  // 先找今天
  let day = store.daySchedules.find((d) => d.date === todayStr)
  if (!day) {
    // 没有今天就找未来最近有安排的一天
    day = store.daySchedules.find((d) => d.date >= todayStr && d.items.length > 0)
  }
  if (!day) {
    day = store.daySchedules[0]
  }
  return day
})

// 总览统计卡片（手账风：不同颜色变体 + emoji）
const statsCards = computed(() => [
  {
    label: '旅行天数',
    value: `${store.totalTripDays}`,
    sub: `${store.tripStartDate.slice(5)} ~ ${store.tripEndDate.slice(5)}`,
    icon: '📅',
    cardClass: 'trip-card--pink',
    tapeClass: 'washi-tape--pink',
    titleClass: 'title-sticker--pink',
    badgeClass: 'sticker-badge--pink',
    route: { name: 'Schedule' } as const,
  },
  {
    label: '行程条目',
    value: `${store.totalScheduleItems}`,
    sub: `${store.daySchedules.filter((d) => d.items.length > 0).length} 天有安排`,
    icon: '📍',
    cardClass: 'trip-card--mint',
    tapeClass: 'washi-tape--mint',
    titleClass: 'title-sticker--mint',
    badgeClass: 'sticker-badge--mint',
    route: { name: 'Schedule' } as const,
  },
  {
    label: '已订订单',
    value: `${store.paidOrderCount}`,
    sub: `待办 ${store.pendingOrderCount} · 合计 ${formatNZD(store.totalOrderAmount)}`,
    icon: '🎫',
    cardClass: 'trip-card--lemon',
    tapeClass: 'washi-tape--lemon',
    titleClass: 'title-sticker--lemon',
    badgeClass: 'sticker-badge--lemon',
    route: { name: 'Orders' } as const,
  },
  {
    label: '物资准备',
    value: `${store.packedInventoryCount}/${store.totalInventoryCount}`,
    sub:
      store.totalInventoryCount > 0
        ? `完成 ${Math.round((store.packedInventoryCount / store.totalInventoryCount) * 100)}%`
        : '暂无物资',
    icon: '🎒',
    cardClass: 'trip-card--grape',
    tapeClass: 'washi-tape--grape',
    titleClass: 'title-sticker--grape',
    badgeClass: 'sticker-badge--grape',
    route: { name: 'Notice', hash: '#inventory' } as const,
  },
])

onMounted(async () => {
  try {
    // 加载主要城市天气（只取4个有代表性的）
    const codes = ['AKL', 'ZQN', 'CHC', 'MTC']
    const data = await getCitiesWeather(codes)
    cityWeathers.value = data
  } catch (e) {
    console.warn('Dashboard天气加载失败', e)
  } finally {
    weatherLoading.value = false
  }
})

// 获取城市中文名
const cityName = (code: string) => NZ_CITIES.find((c) => c.code === code)?.name || code
</script>

<template>
  <div class="space-y-6 md:space-y-7" id="dashboard-view">
    <!-- ===== 页面标题 ===== -->
    <div class="page-header">
      <div>
        <h1 class="page-title">🎀 旅行总览手账</h1>
        <p class="page-subtitle font-hand">
          ~ 新西兰冒险日记 · 一起记录每一个美好瞬间 ~
        </p>
      </div>
      <div class="hidden md:block">
        <span class="sticker-badge sticker-badge--sky font-hand text-sm">
          🌤️ {{ formatDateCN(todayStr) }}
        </span>
      </div>
    </div>

    <!-- ===== 欢迎区：大号贴纸标题 + 旅行时间便签 ===== -->
    <div class="trip-card trip-card--pink p-5 md:p-7 pt-8 relative overflow-hidden">
      <div class="washi-tape washi-tape--pink" />
      <!-- 角落装饰 -->
      <span class="doodle-corner top-3 right-4 text-2xl">✈️</span>
      <span class="doodle-corner bottom-3 left-4 text-xl">🌸</span>

      <div class="relative">
        <!-- 大号贴纸标题 -->
        <div class="flex flex-wrap items-start gap-3 mb-5">
          <span class="title-sticker title-sticker--pink text-xl md:text-2xl">
            你好，{{ store.currentUser?.nickname }} ✨
          </span>
          <span class="sticker-badge sticker-badge--lemon font-sticker text-base mt-1">
            🗓️ Day {{ Math.min(store.totalTripDays, Math.max(1, Math.ceil((Date.now() - new Date(store.tripStartDate).getTime()) / 86400000) + 1)) }}
          </span>
        </div>

        <!-- 旅行时间便签 -->
        <div class="flex flex-wrap gap-4 items-start">
          <div class="sticky-note sticky-note--pink max-w-xs">
            <div class="text-xs text-ink-600 font-hand mb-1">📌 旅行时间</div>
            <div class="font-bold text-ink-800">
              {{ formatDateCN(store.tripStartDate) }}
            </div>
            <div class="text-sm text-ink-700">
              ➡️ {{ formatDateCN(store.tripEndDate) }}
            </div>
          </div>

          <!-- 倒计时贴纸 -->
          <div class="sticker-badge sticker-badge--sky py-2 px-4 text-sm font-sticker" style="transform: rotate(-2deg)">
            ⏳ 还有
            <span class="text-2xl font-extrabold mx-1 font-hand">
              {{ Math.max(0, Math.ceil((new Date(store.tripStartDate).getTime() - Date.now()) / 86400000)) }}
            </span>
            天启程！
          </div>
        </div>

        <!-- 准备进度条 -->
        <div class="mt-6 bg-white/60 rounded-2xl p-4 border-2 border-dashed border-strawberry-200">
          <div class="flex justify-between text-xs md:text-sm mb-2">
            <span class="font-bold text-ink-700 font-hand">💖 准备进度</span>
            <span class="font-hand text-ink-600">
              行程 {{ store.totalScheduleItems ? '✅' : '📝' }} ·
              订单 {{ store.pendingOrderCount === 0 ? '✅' : store.pendingOrderCount + '待订' }} ·
              物资 {{ store.packedInventoryCount === store.totalInventoryCount && store.totalInventoryCount ? '✅' : '打包中✨' }}
            </span>
          </div>
          <div class="h-4 bg-lemon-50 rounded-full overflow-hidden border-2 border-lemon-200">
            <div
              class="h-full rounded-full transition-all duration-500 relative"
              style="background: linear-gradient(90deg, #ff6f96 0%, #ffd518 33%, #70c86d 66%, #38bdf8 100%)"
              :style="{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((store.totalScheduleItems > 0 ? 30 : 0) +
                      (store.pendingOrderCount === 0 && store.orders.length > 0 ? 30 : store.orders.length > 0 ? 15 : 0) +
                      (store.totalInventoryCount > 0
                        ? (store.packedInventoryCount / store.totalInventoryCount) * 40
                        : store.orders.length === 0 && store.totalScheduleItems === 0
                          ? 0
                          : 20)) *
                      1
                  )
                )}%`,
              }"
            >
              <span class="absolute right-1 top-0 text-xs">🐑</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 4个统计卡片 ===== -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <button
        v-for="(card, idx) in statsCards"
        :key="card.label"
        :class="[card.cardClass, 'trip-card p-5 pt-7 text-left group transition-all hover:-translate-y-1 relative']"
        @click="router.push(card.route)"
        :style="{ transform: `rotate(${idx % 2 === 0 ? '-0.5' : '0.5'}deg)` }"
      >
        <div :class="['washi-tape', card.tapeClass]" />

        <!-- emoji 装饰 -->
        <div class="text-3xl md:text-4xl mb-3 animate-float" style="animation-delay: `${idx * 0.3}s`">
          {{ card.icon }}
        </div>

        <!-- 贴纸标签 -->
        <span :class="['sticker-badge', card.badgeClass, '!px-2 !py-0.5 !text-[10px] mb-2']">
          {{ card.label }}
        </span>

        <!-- 大数字 -->
        <div class="font-sticker text-3xl md:text-4xl font-extrabold text-ink-800 my-1" style="text-shadow: 2px 2px 0 rgba(255,202,217,0.4)">
          {{ card.value }}
        </div>

        <!-- 副标题 -->
        <div class="font-hand text-xs md:text-sm text-ink-500 mt-1">
          {{ card.sub }}
        </div>

        <!-- 箭头 -->
        <IconChevronRight
          :size="18"
          class="absolute right-3 top-8 text-ink-300 group-hover:text-ink-500 group-hover:translate-x-1 transition-all"
        />
      </button>
    </div>

    <div class="grid md:grid-cols-2 gap-5 md:gap-6">
      <!-- ===== 最近行程区：时间线形式的便签条目 ===== -->
      <div class="trip-card trip-card--mint p-5 md:p-6 pt-8 relative">
        <div class="washi-tape washi-tape--mint" />
        <span class="doodle-corner top-3 right-4 text-xl">🗺️</span>

        <div class="flex items-center justify-between mb-5">
          <span class="title-sticker title-sticker--mint text-base md:text-lg">
            📅 近期行程
          </span>
          <button
            class="btn-ghost !py-1 !px-3 text-xs font-hand"
            @click="router.push({ name: 'Schedule' })"
          >
            全部 <IconChevronRight :size="12" />
          </button>
        </div>

        <div v-if="nearestDaySchedule">
          <!-- 日期便签 -->
          <div class="sticky-note sticky-note--mint mb-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="sticker-badge sticker-badge--mint !px-2 !py-0.5 !text-[10px] font-sticker">
                  Day {{ store.tripDateList.indexOf(nearestDaySchedule.date) + 1 }}
                </span>
                <span class="ml-2 font-bold text-ink-800">{{ formatDateCN(nearestDaySchedule.date) }}</span>
              </div>
              <span class="sticker-badge sticker-badge--pink !px-2 !py-0.5 !text-[10px]">
                {{ nearestDaySchedule.items.length }} 条
              </span>
            </div>
          </div>

          <!-- 行程时间线 -->
          <div class="space-y-3">
            <div
              v-if="nearestDaySchedule.items.length === 0"
              class="sticky-note sticky-note--blue py-6 text-center mx-auto max-w-xs"
            >
              <div class="text-3xl mb-2">🗺️</div>
              <p class="font-hand text-ink-600">这一天还没有安排行程~</p>
              <button
                v-if="store.canEdit"
                class="btn-primary mt-3 !py-1.5 !px-4 text-xs"
                @click="router.push({ name: 'Schedule' })"
              >
                <IconPlus :size="12" class="inline" /> 添加第一条
              </button>
            </div>

            <template v-else>
              <div
                v-for="(item, idx) in nearestDaySchedule.items.slice(0, 4)"
                :key="item.id"
                class="relative pl-6"
              >
                <!-- 时间线圆点和线 -->
                <div class="absolute left-0 top-2 w-4 h-4 rounded-full bg-mint-200 border-2 border-primary-400" />
                <div
                  v-if="idx < nearestDaySchedule.items.slice(0, 4).length - 1"
                  class="absolute left-[7px] top-6 w-px h-full bg-primary-200"
                  style="height: calc(100% + 4px)"
                />
                <!-- 便签条目 -->
                <div
                  class="sticky-note sticky-note--mint p-3"
                  :style="{ transform: `rotate(${idx % 2 === 0 ? '-1' : '0.8'}deg)` }"
                >
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="sticker-badge sticker-badge--sky !px-2 !py-0.5 !text-[10px] font-sticker shrink-0">
                      ⏰ {{ item.timeStart || '--:--' }}
                    </span>
                    <span class="font-bold text-ink-800 text-sm truncate flex-1">
                      📍 {{ item.location || '未命名行程' }}
                    </span>
                  </div>
                  <div class="mt-1.5 text-xs font-hand text-ink-600 flex flex-wrap gap-2">
                    <span v-if="item.transport">🚗 {{ item.transport }}</span>
                    <span v-if="item.duration">⏱️ {{ item.duration }}分钟</span>
                  </div>
                </div>
              </div>
            </template>

            <div
              v-if="nearestDaySchedule.items.length > 4"
              class="text-center font-hand text-sm text-ink-400 pt-1"
            >
              还有 {{ nearestDaySchedule.items.length - 4 }} 条行程等你哦~ 💕
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 天气概览：天空蓝卡片 ===== -->
      <div class="trip-card trip-card--sky p-5 md:p-6 pt-8 relative">
        <div class="washi-tape washi-tape--sky" />
        <span class="doodle-corner top-3 right-4 text-xl">☁️</span>

        <div class="flex items-center justify-between mb-5">
          <span class="title-sticker title-sticker--sky text-base md:text-lg">
            🌤️ 新西兰天气速览
          </span>
          <button
            class="btn-ghost !py-1 !px-3 text-xs font-hand"
            @click="router.push({ name: 'Weather' })"
          >
            详情 <IconChevronRight :size="12" />
          </button>
        </div>

        <div v-if="weatherLoading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="skeleton h-20 rounded-2xl" />
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(code, i) in ['AKL', 'ZQN', 'CHC', 'MTC']"
            :key="code"
            class="sticky-note sticky-note--blue flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
            :style="{ transform: `rotate(${i % 2 === 0 ? '-0.8' : '0.6'}deg)` }"
            @click="router.push({ name: 'Weather' })"
          >
            <div class="shrink-0 text-4xl animate-float" style="animation-delay: `${i * 0.2}s`">
              <WeatherIcon
                v-if="cityWeathers[code]?.current"
                :type="cityWeathers[code].current.icon"
                :size="44"
              />
              <span v-else>🌈</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-ink-800">{{ cityName(code) }}</span>
                <span class="sticker-badge sticker-badge--sky !px-2 !py-0.5 !text-[9px]">
                  {{ NZ_CITIES.find((c) => c.code === code)?.region }}
                </span>
              </div>
              <div v-if="cityWeathers[code]?.current" class="mt-0.5 text-xs font-hand text-ink-600 truncate">
                {{ cityWeathers[code].current.description }}
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="font-sticker text-2xl font-extrabold text-ink-800">
                {{ cityWeathers[code]?.current?.temperature.toFixed(0) || '--' }}°
              </div>
              <div class="sticker-badge sticker-badge--sky !px-1.5 !py-0.5 !text-[9px] mt-0.5">
                💧 {{ cityWeathers[code]?.current?.rainProbability || 0 }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 临近订单区：柠檬色便签提示 ===== -->
    <div
      v-if="upcomingOrders.length > 0"
      class="trip-card trip-card--lemon p-5 md:p-6 pt-8 relative"
    >
      <div class="washi-tape washi-tape--lemon" />
      <span class="doodle-corner top-3 right-4 text-xl animate-sparkle">🚨</span>

      <div class="flex items-center gap-3 mb-5">
        <span class="title-sticker title-sticker--lemon text-base md:text-lg">
          ⚠️ 临近出行提醒
        </span>
        <span class="sticker-badge sticker-badge--pink !text-[11px] font-hand">
          3天内使用 · 请提前确认
        </span>
      </div>

      <div class="space-y-3">
        <div
          v-for="(order, i) in upcomingOrders"
          :key="order.id"
          class="sticky-note sticky-note--pink p-4 flex items-center gap-3"
          :style="{ transform: `rotate(${i % 2 === 0 ? '-1' : '0.5'}deg)`, border: '2px dashed #fb4277' }"
        >
          <div class="text-3xl shrink-0 animate-wiggle">
            {{ { 国际机票: '✈️', 境内机票: '🛫', 酒店: '🏨', 租车: '🚗', 景点门票: '🎫', 徒步预约: '🥾', 轮渡票: '⛴️' }[order.category] }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-ink-800 truncate">{{ order.title }}</span>
              <span
                class="sticker-badge sticker-badge--lemon !px-2 !py-0.5 !text-[10px]"
              >{{ order.status }}</span>
            </div>
            <div class="mt-1 font-hand text-xs text-ink-600">
              🕒 {{ new Date(order.dateTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
              <span v-if="order.orderNo" class="ml-2">#{{ order.orderNo }}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="font-sticker text-xl font-extrabold text-strawberry-600">
              {{ formatNZD(order.price || 0) }}
            </div>
            <span class="sticker-badge sticker-badge--pink !px-2 !py-0.5 !text-[9px] mt-0.5 inline-block">
              🚨 临近
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 同伴最近动态 ===== -->
    <div
      v-if="store.activityLogs.length > 0"
      class="trip-card trip-card--grape p-5 md:p-6 pt-8 relative"
    >
      <div class="washi-tape washi-tape--grape" />
      <span class="doodle-corner top-3 right-4 text-xl">💫</span>

      <div class="flex items-center justify-between mb-5">
        <span class="title-sticker title-sticker--grape text-base md:text-lg">
          📝 修改动态
        </span>
        <button
          class="btn-ghost !py-1 !px-3 text-xs font-hand"
          @click="router.push({ name: 'Chat' })"
        >
          去留言 <IconChevronRight :size="12" />
        </button>
      </div>

      <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
        <div
          v-for="(log, i) in store.activityLogs.slice(0, 10)"
          :key="log.id"
          class="flex items-start gap-3 p-3 rounded-2xl bg-grape-50/50 border-2 border-dashed border-grape-200"
          :style="{ transform: `rotate(${i % 2 === 0 ? '-0.3' : '0.3'}deg)` }"
        >
          <div
            class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5 shadow-sticker-sm"
            :style="{ background: log.operatorColor }"
          >
            {{ log.operator.slice(0, 1) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-hand text-ink-700 leading-relaxed">
              <span class="font-bold" :style="{ color: log.operatorColor }">{{ log.operator }}</span>
              <span class="text-ink-400 mx-1">
                {{ { create: '✨ 新增了', update: '✏️ 更新了', delete: '🗑️ 删除了' }[log.action] }}
              </span>
              <span class="text-ink-600">{{ log.description }}</span>
            </div>
            <div class="mt-1 text-[11px] font-hand text-ink-400">
              🕐 {{ new Date(log.timestamp).toLocaleString('zh-CN') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
