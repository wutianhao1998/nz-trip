// ================================
// 页面视图：订票台账（7大分类 + 状态管理 + 临近提醒）
// ================================
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTripStore } from '@/stores/trip'
import OrderItemModal from '@/components/orders/OrderItemModal.vue'
import type { OrderItem, OrderCategory, OrderStatus } from '@/types'
import {
  ORDER_CATEGORIES,
  ORDER_STATUSES,
  ORDER_CATEGORY_ICONS,
  ORDER_CATEGORY_COLORS,
} from '@/utils/constants'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTicket,
  IconAlert,
  IconDownload,
  IconFile,
} from '@/components/icons'
import {
  formatNZD,
  getOrderStatusColor,
  formatRelativeTime,
  isUpcoming,
} from '@/utils'

const store = useTripStore()

// 筛选条件
const filterCategory = ref<OrderCategory | '全部'>('全部')
const filterStatus = ref<OrderStatus | '全部'>('全部')

// 弹窗
const showModal = ref(false)
const editingItem = ref<OrderItem | undefined>(undefined)

// 分类Tab颜色映射（8种不同颜色贴纸）
const categoryTabColors: Record<string, { active: string; badge: string }> = {
  '全部':       { active: 'bg-gradient-to-br from-ink-500 to-ink-700 text-white', badge: 'sticker-badge--grape' },
  '国际机票':   { active: 'bg-gradient-to-br from-strawberry-300 to-strawberry-500 text-white', badge: 'sticker-badge--pink' },
  '境内机票':   { active: 'bg-gradient-to-br from-skyblue-300 to-skyblue-500 text-white', badge: 'sticker-badge--sky' },
  '酒店':       { active: 'bg-gradient-to-br from-grape-300 to-grape-500 text-white', badge: 'sticker-badge--grape' },
  '租车':       { active: 'bg-gradient-to-br from-lemon-300 to-lemon-500 text-ink-800', badge: 'sticker-badge--lemon' },
  '景点门票':   { active: 'bg-gradient-to-br from-primary-300 to-primary-500 text-white', badge: 'sticker-badge--mint' },
  '徒步预约':   { active: 'bg-gradient-to-br from-peach-300 to-peach-500 text-white', badge: 'sticker-badge--peach' },
  '轮渡票':     { active: 'bg-gradient-to-br from-skyblue-400 to-primary-400 text-white', badge: 'sticker-badge--sky' },
}

// 状态贴纸颜色映射
const statusBadgeMap: Record<string, string> = {
  '未预订': 'sticker-badge--peach',
  '已预订': 'sticker-badge--lemon',
  '已付款': 'sticker-badge--mint',
  '已核销': 'sticker-badge--sky',
}

// 分类统计
const categoryStats = computed(() => {
  const map = new Map<OrderCategory | '全部', number>()
  map.set('全部', store.orders.length)
  ORDER_CATEGORIES.forEach((c) => map.set(c, 0))
  store.orders.forEach((o) => {
    map.set(o.category, (map.get(o.category) || 0) + 1)
  })
  return map
})

// 状态统计
const statusStats = computed(() => {
  const map = new Map<OrderStatus | '全部', number>()
  map.set('全部', store.orders.length)
  ORDER_STATUSES.forEach((s) => map.set(s, 0))
  store.orders.forEach((o) => map.set(o.status, (map.get(o.status) || 0) + 1))
  return map
})

// 筛选后订单
const filteredOrders = computed(() => {
  return store.orders
    .filter((o) => filterCategory.value === '全部' || o.category === filterCategory.value)
    .filter((o) => filterStatus.value === '全部' || o.status === filterStatus.value)
    .sort((a, b) => {
      // 按使用时间排序（有时间的在前，近的在前）
      if (a.dateTime && b.dateTime) return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      if (a.dateTime) return -1
      if (b.dateTime) return 1
      return (b.createdAt || 0) - (a.createdAt || 0)
    })
})

// 临近订单
const upcomingOrders = computed(() =>
  store.orders.filter(
    (o) => o.dateTime && isUpcoming(o.dateTime, 3) && o.status !== '已核销'
  )
)

// 总金额（筛选后）
const filteredTotal = computed(() =>
  filteredOrders.value.reduce((sum, o) => sum + (o.price || 0), 0)
)

const openAdd = () => {
  if (!store.canEdit) return
  editingItem.value = undefined
  showModal.value = true
}
const openEdit = (item: OrderItem) => {
  if (!store.canEdit) return
  editingItem.value = item
  showModal.value = true
}
const handleDelete = (item: OrderItem) => {
  if (!store.canEdit) return
  if (!confirm(`确定删除订单「${item.title}」吗？`)) return
  store.deleteOrderItem(item.id)
}
const handleSave = (item: OrderItem) => {
  store.upsertOrderItem(item)
}
const cycleStatus = (item: OrderItem) => {
  if (!store.canEdit) return
  const curIdx = ORDER_STATUSES.indexOf(item.status)
  const next = ORDER_STATUSES[(curIdx + 1) % ORDER_STATUSES.length]
  store.updateOrderStatus(item.id, next)
}

// 下载凭证
const downloadVoucher = (v: NonNullable<OrderItem['voucher']>) => {
  const a = document.createElement('a')
  a.href = v.dataUrl
  a.download = v.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <div class="space-y-5 md:space-y-6" id="orders-view">
    <!-- ===== 页面标题 ===== -->
    <div class="page-header">
      <div>
        <h1 class="page-title">🎫 订票台账手账</h1>
        <p class="page-subtitle font-hand">
          ~ 7大分类管理 · 状态一目了然 · 临近订单贴心提醒 ~
        </p>
      </div>
      <div class="hidden md:flex items-center gap-2">
        <span class="sticker-badge sticker-badge--lemon font-hand text-sm">
          📊 总计 {{ formatNZD(store.totalOrderAmount) }}
        </span>
      </div>
    </div>

    <!-- ===== 头部统计卡片 ===== -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <!-- 订单总数：薄荷 -->
      <div class="trip-card trip-card--mint p-4 pt-6 relative">
        <div class="washi-tape washi-tape--mint !w-20 !h-5" />
        <span class="doodle-corner top-3 right-3 text-lg">📋</span>
        <span class="sticker-badge sticker-badge--mint !px-2 !py-0.5 !text-[10px] font-sticker">订单总数</span>
        <div class="font-sticker text-3xl font-extrabold text-ink-800 mt-2" style="text-shadow: 2px 2px 0 rgba(159,220,156,0.4)">
          {{ store.orders.length }}
        </div>
        <div class="font-hand text-[11px] text-ink-500 mt-1">合计 {{ formatNZD(store.totalOrderAmount) }}</div>
      </div>
      <!-- 待预订：蜜桃 -->
      <div class="trip-card trip-card--pink p-4 pt-6 relative">
        <div class="washi-tape washi-tape--pink !w-20 !h-5" />
        <span class="doodle-corner top-3 right-3 text-lg">⏳</span>
        <span class="sticker-badge sticker-badge--pink !px-2 !py-0.5 !text-[10px] font-sticker">待预订</span>
        <div class="font-sticker text-3xl font-extrabold text-strawberry-600 mt-2" style="text-shadow: 2px 2px 0 rgba(255,202,217,0.5)">
          {{ statusStats.get('未预订') || 0 }}
        </div>
        <div class="font-hand text-[11px] text-ink-500 mt-1">需要确认下单</div>
      </div>
      <!-- 已付款：柠檬 -->
      <div class="trip-card trip-card--lemon p-4 pt-6 relative">
        <div class="washi-tape washi-tape--lemon !w-20 !h-5" />
        <span class="doodle-corner top-3 right-3 text-lg">✅</span>
        <span class="sticker-badge sticker-badge--lemon !px-2 !py-0.5 !text-[10px] font-sticker">已付款</span>
        <div class="font-sticker text-3xl font-extrabold text-ink-800 mt-2" style="text-shadow: 2px 2px 0 rgba(255,228,74,0.5)">
          {{ (statusStats.get('已付款') || 0) + (statusStats.get('已预订') || 0) }}
        </div>
        <div class="font-hand text-[11px] text-ink-500 mt-1">等待出行使用</div>
      </div>
      <!-- 3天内出行：葡萄 -->
      <div class="trip-card trip-card--grape p-4 pt-6 relative">
        <div class="washi-tape washi-tape--grape !w-20 !h-5" />
        <span class="doodle-corner top-3 right-3 text-lg animate-sparkle">🚨</span>
        <span class="sticker-badge sticker-badge--grape !px-2 !py-0.5 !text-[10px] font-sticker">3天内出行</span>
        <div
          class="font-sticker text-3xl font-extrabold mt-2"
          :class="upcomingOrders.length > 0 ? 'text-strawberry-600 animate-wiggle' : 'text-ink-400'"
          style="text-shadow: 2px 2px 0 rgba(216,180,254,0.4)"
        >
          {{ upcomingOrders.length }}
        </div>
        <div class="font-hand text-[11px] text-ink-500 mt-1">
          {{ upcomingOrders.length > 0 ? '⚠️ 请提前确认哦~' : '暂无临近订单' }}
        </div>
      </div>
    </div>

    <!-- ===== 临近订单高亮提醒 ===== -->
    <div
      v-if="upcomingOrders.length > 0"
      class="trip-card trip-card--pink p-5 pt-8 relative"
      style="animation: pulse-border 1.5s ease-in-out infinite; border-color: #fb4277 !important;"
    >
      <div class="washi-tape washi-tape--pink" />
      <span class="doodle-corner top-3 right-4 text-2xl animate-sparkle">🚨</span>

      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <span class="title-sticker title-sticker--pink text-base md:text-lg">
          🚨 临近出行订单提醒（3天内）
        </span>
        <span class="sticker-badge sticker-badge--lemon !text-[11px] font-hand animate-wiggle">
          记得确认哦~
        </span>
      </div>

      <div class="flex flex-wrap gap-2 md:gap-3">
        <div
          v-for="o in upcomingOrders"
          :key="o.id"
          class="sticky-note sticky-note--pink px-4 py-3 flex items-center gap-2 cursor-pointer hover:scale-[1.03] transition-transform"
          style="border: 2px dashed #fb4277; animation: pulse-border 2s ease-in-out infinite;"
          @click="openEdit(o)"
        >
          <span class="text-2xl shrink-0 animate-wiggle">
            {{ ORDER_CATEGORY_ICONS[o.category] }}
          </span>
          <div class="min-w-0">
            <div class="font-bold text-ink-800 text-sm truncate max-w-[140px] md:max-w-[180px]">
              🚨 {{ o.title }}
            </div>
            <div class="font-hand text-[11px] text-strawberry-700 mt-0.5 whitespace-nowrap">
              {{ o.dateTime ? new Date(o.dateTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 操作 + 筛选区 ===== -->
    <div class="trip-card trip-card--sky p-4 md:p-5 pt-7 space-y-4 relative">
      <div class="washi-tape washi-tape--sky" />

      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-2">
          <span class="title-sticker title-sticker--sky text-base md:text-lg">
            🎫 订票台账
          </span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="sticker-badge sticker-badge--mint !text-[11px] font-hand">
            📋 {{ filteredOrders.length }} 条
          </span>
          <span class="sticker-badge sticker-badge--lemon !text-[11px] font-hand">
            💰 {{ formatNZD(filteredTotal) }}
          </span>
          <button
            v-if="store.canEdit"
            class="btn-primary !py-2 !px-4 text-sm"
            @click="openAdd"
          >
            <IconPlus :size="14" /> 新增订单
          </button>
        </div>
      </div>

      <!-- 分类筛选：7种不同颜色的贴纸胶囊 -->
      <div>
        <div class="font-hand text-[11px] text-ink-500 mb-2 flex items-center gap-1">
          <span>📂</span> 按分类筛选
        </div>
        <div class="flex flex-wrap gap-1.5 md:gap-2">
          <button
            v-for="(cat, catIdx) in (['全部', ...ORDER_CATEGORIES] as const)"
            :key="cat"
            type="button"
            class="relative px-3 md:px-4 py-1.5 md:py-2 rounded-2xl font-bold text-[11px] md:text-xs transition-all sticker-hover border-2"
            :class="filterCategory === cat
              ? `${categoryTabColors[cat].active} shadow-sticker border-transparent`
              : 'bg-white text-ink-600 border-dashed border-ink-200/50 hover:border-strawberry-200 hover:bg-strawberry-50/50'"
            :style="{ transform: `rotate(${catIdx % 3 === 0 ? '-0.8' : catIdx % 3 === 1 ? '0.6' : '-0.3'}deg)` }"
            @click="filterCategory = cat"
          >
            <span v-if="cat !== '全部'" class="mr-0.5">{{ ORDER_CATEGORY_ICONS[cat as OrderCategory] }}</span>
            {{ cat }}
            <span
              class="ml-1 text-[9px] md:text-[10px] opacity-80 font-sticker"
            >({{ categoryStats.get(cat) || 0 }})</span>
          </button>
        </div>
      </div>

      <!-- 状态筛选 -->
      <div>
        <div class="font-hand text-[11px] text-ink-500 mb-2 flex items-center gap-1">
          <span>🏷️</span> 按状态筛选
        </div>
        <div class="flex flex-wrap gap-1.5 md:gap-2">
          <button
            v-for="(st, stIdx) in (['全部', ...ORDER_STATUSES] as const)"
            :key="st"
            type="button"
            class="sticker-badge transition-all cursor-pointer"
            :class="filterStatus === st
              ? st === '全部'
                ? '!bg-ink-700 !text-white !border-ink-600 shadow-sticker'
                : `${statusBadgeMap[st]} shadow-sticker scale-105`
              : '!bg-white !text-ink-500 !border-ink-200 hover:!border-strawberry-200 hover:!bg-strawberry-50'"
            :style="{ transform: `rotate(${stIdx % 2 === 0 ? '-0.5' : '0.5'}deg)` }"
            @click="filterStatus = st"
          >
            {{
              st === '未预订' ? '⏳ ' :
              st === '已预订' ? '📝 ' :
              st === '已付款' ? '💳 ' :
              st === '已核销' ? '✅ ' : ''
            }}{{ st }}
            <span class="ml-1 !text-[9px] opacity-75">({{ statusStats.get(st) || 0 }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 空状态 ===== -->
    <div
      v-if="filteredOrders.length === 0"
      class="trip-card trip-card--lemon p-8 md:p-10 text-center pt-10 relative"
    >
      <div class="washi-tape washi-tape--lemon" />
      <div class="sticky-note sticky-note--mint mx-auto max-w-sm py-6">
        <div class="text-5xl mb-2 opacity-80">🎫</div>
        <p class="font-hand text-ink-700 text-sm">
          {{ store.orders.length === 0 ? '还没有任何订单记录哦~' : '当前筛选条件下没有订单呢' }}
        </p>
        <button
          v-if="store.canEdit && store.orders.length === 0"
          class="btn-primary mt-4 !py-2 !px-5 text-sm"
          @click="openAdd"
        >
          <IconPlus :size="14" /> 添加第一张订单
        </button>
      </div>
    </div>

    <!-- ===== 订单列表 ===== -->
    <div v-else class="space-y-3 md:space-y-4">
      <div
        v-for="(order, oIdx) in filteredOrders"
        :key="order.id"
        class="trip-card trip-card--lemon p-4 md:p-5 pt-8 group relative overflow-hidden"
        :class="{
          'ring-4 ring-strawberry-300 ring-opacity-70': order.dateTime && isUpcoming(order.dateTime, 3)
        }"
        :style="{
          transform: `rotate(${oIdx % 2 === 0 ? '-0.3' : '0.3'}deg)`,
          animation: order.dateTime && isUpcoming(order.dateTime, 3) ? 'pulse-border 1.5s ease-in-out infinite' : 'none'
        }"
      >
        <!-- 柠檬黄胶带 -->
        <div class="washi-tape washi-tape--lemon" />

        <!-- 临近徽章 -->
        <span
          v-if="order.dateTime && isUpcoming(order.dateTime, 3)"
          class="absolute top-3 left-4 sticker-badge sticker-badge--pink !px-2 !py-0.5 !text-[10px] animate-wiggle z-10"
        >
          🚨 临近
        </span>

        <div class="flex gap-3 md:gap-4">
          <!-- 左侧图标贴纸 -->
          <div
            class="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sticker border-2 border-white"
            :class="[
              order.category === '国际机票' ? 'bg-gradient-to-br from-strawberry-200 to-strawberry-400' :
              order.category === '境内机票' ? 'bg-gradient-to-br from-skyblue-200 to-skyblue-400' :
              order.category === '酒店' ? 'bg-gradient-to-br from-grape-200 to-grape-400' :
              order.category === '租车' ? 'bg-gradient-to-br from-lemon-200 to-lemon-400' :
              order.category === '景点门票' ? 'bg-gradient-to-br from-primary-200 to-primary-400' :
              order.category === '徒步预约' ? 'bg-gradient-to-br from-peach-200 to-peach-400' :
              'bg-gradient-to-br from-skyblue-200 to-primary-300'
            ]"
          >
            {{ ORDER_CATEGORY_ICONS[order.category] }}
          </div>

          <!-- 主内容 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- 标题 -->
                  <h3 class="font-bold text-ink-800 text-sm md:text-base truncate flex-1">
                    {{ order.title }}
                  </h3>
                  <!-- 状态贴纸徽章（不同颜色）-->
                  <span
                    class="sticker-badge !px-2.5 !py-0.5 !text-[10px] font-sticker cursor-pointer shrink-0 hover:scale-110 transition-transform"
                    :class="statusBadgeMap[order.status] || 'sticker-badge--grape'"
                    :title="store.canEdit ? '点击切换状态' : ''"
                    @click="cycleStatus(order)"
                  >
                    {{
                      order.status === '未预订' ? '⏳' :
                      order.status === '已预订' ? '📝' :
                      order.status === '已付款' ? '💳' : '✅'
                    }} {{ order.status }}
                  </span>
                </div>

                <!-- 详情信息 -->
                <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-hand text-ink-600">
                  <span v-if="order.dateTime" class="inline-flex items-center gap-1">
                    🕒 {{ new Date(order.dateTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                  <span v-if="order.orderNo" class="inline-flex items-center gap-1">
                    📋 #{{ order.orderNo }}
                  </span>
                  <span v-if="order.contact" class="inline-flex items-center gap-1">
                    📞 {{ order.contact }}
                  </span>
                </div>
              </div>

              <!-- 价格贴纸（大数字）-->
              <div class="text-right shrink-0">
                <div class="sticker-badge sticker-badge--lemon !px-3 !py-1">
                  <span class="font-sticker text-lg md:text-xl font-extrabold text-ink-800">
                    {{ formatNZD(order.price || 0) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 备注：便签风 -->
            <div
              v-if="order.notes"
              class="mt-3 p-3 rounded-xl bg-grape-50/70 border-2 border-dashed border-grape-200 text-xs font-hand text-ink-600 whitespace-pre-line leading-relaxed"
            >
              📝 {{ order.notes }}
            </div>

            <!-- 凭证 -->
            <div v-if="order.voucher" class="mt-2.5">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 sticker-badge sticker-badge--sky !py-1 !px-2.5 !text-[11px]"
                @click="downloadVoucher(order.voucher!)"
              >
                <IconFile :size="11" />
                <span class="truncate max-w-[150px] font-hand">{{ order.voucher.name }}</span>
                <IconDownload :size="10" />
              </button>
            </div>

            <!-- 溯源 -->
            <div class="mt-2.5 text-[10px] font-hand text-ink-400 flex items-center gap-2 flex-wrap">
              <span>✍️ 创建：{{ order.createdBy || '-' }}</span>
              <span>·</span>
              <span>🔄 更新：{{ order.updatedBy || '-' }} · {{ formatRelativeTime(order.updatedAt || order.createdAt || 0) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div
            v-if="store.canEdit"
            class="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-2xl shadow-sticker p-1 border border-lemon-200"
          >
            <button
              type="button"
              class="p-1.5 rounded-xl text-skyblue-600 hover:bg-skyblue-50 transition-all"
              title="编辑"
              @click="openEdit(order)"
            >
              <IconEdit :size="14" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-xl text-strawberry-500 hover:bg-strawberry-50 transition-all"
              title="删除"
              @click="handleDelete(order)"
            >
              <IconTrash :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <OrderItemModal
      v-model:visible="showModal"
      :editing-item="editingItem"
      @save="handleSave"
    />
  </div>
</template>

<style>
@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(251, 66, 119, 0.4), 3px 5px 0 rgba(63, 59, 50, 0.12);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(251, 66, 119, 0), 3px 5px 0 rgba(63, 59, 50, 0.12);
  }
}
</style>
