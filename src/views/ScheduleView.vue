// ================================
// 页面视图：每日行程规划（拖拽排序 + 增删改查）
// ================================
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useTripStore } from '@/stores/trip'
import type { ScheduleItem } from '@/types'
import ScheduleItemModal from '@/components/schedule/ScheduleItemModal.vue'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconClock,
  IconCar,
  IconUtensils,
  IconAlert,
  IconCalendar,
} from '@/components/icons'
import { formatDateCN, formatRelativeTime, getDifficultyColor } from '@/utils'
import Sortable from 'sortablejs'

const store = useTripStore()

// 当前展开的日期（默认第一个未来日期）
const todayStr = new Date().toISOString().slice(0, 10)
const expandedDate = ref<string>(
  store.tripDateList.find((d) => d >= todayStr) || store.tripDateList[0] || ''
)

// 选中的日期（左侧列表）
const selectedDate = ref<string>(expandedDate.value)

// 编辑弹窗状态
const showModal = ref(false)
const editingItem = ref<ScheduleItem | undefined>(undefined)
const editingDate = ref('')

// 列表滚动容器 ref
const dayListRef = ref<HTMLElement | null>(null)

// 切换展开/折叠
const toggleDate = (date: string) => {
  expandedDate.value = expandedDate.value === date ? '' : date
}

// 打开新增弹窗
const openAddModal = (date: string) => {
  if (!store.canEdit) return
  editingItem.value = undefined
  editingDate.value = date
  showModal.value = true
}

// 打开编辑弹窗
const openEditModal = (date: string, item: ScheduleItem) => {
  if (!store.canEdit) return
  editingItem.value = item
  editingDate.value = date
  showModal.value = true
}

// 删除
const handleDelete = (date: string, itemId: string) => {
  if (!store.canEdit) return
  if (!confirm('确定要删除这条行程吗？')) return
  store.deleteScheduleItem(date, itemId)
}

// 保存
const handleSave = (item: ScheduleItem) => {
  store.upsertScheduleItem(editingDate.value, item)
}

// ==================== 拖拽排序（SortableJS）====================
let sortableInstances: Sortable[] = []
const initSortable = async () => {
  await nextTick()
  // 清理旧实例
  sortableInstances.forEach((s) => s.destroy())
  sortableInstances = []
  // 仅给当前展开的列表绑定拖拽
  const listEl = document.querySelector<HTMLElement>(
    `[data-sort-list="${expandedDate.value}"]`
  )
  if (!listEl || !store.canEdit) return
  const sortable = Sortable.create(listEl, {
    animation: 200,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return
      const children = Array.from(listEl.children) as HTMLElement[]
      const ids = children.map((el) => el.dataset.itemId || '').filter(Boolean)
      store.reorderScheduleItems(expandedDate.value, ids)
    },
  })
  sortableInstances.push(sortable)
}

watch(
  () => [expandedDate.value, store.canEdit, store.schedules.get(expandedDate.value)?.length],
  () => initSortable(),
  { flush: 'post' }
)

onMounted(() => initSortable())

// 选中日期滚动到视图
const selectDate = (date: string) => {
  selectedDate.value = date
  expandedDate.value = date
  const el = document.getElementById(`day-${date}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 日期切换按钮
const prevDate = () => {
  const idx = store.tripDateList.indexOf(selectedDate.value)
  if (idx > 0) selectDate(store.tripDateList[idx - 1])
}
const nextDate = () => {
  const idx = store.tripDateList.indexOf(selectedDate.value)
  if (idx < store.tripDateList.length - 1) selectDate(store.tripDateList[idx + 1])
}

// 计算左侧日期列表的统计
const dateStats = computed(() =>
  store.tripDateList.map((d, idx) => ({
    date: d,
    dayNum: idx + 1,
    itemCount: (store.schedules.get(d) || []).length,
  }))
)

// 新西兰标签样式映射
const tagStyleMap: Record<string, string> = {
  '环岛': 'sticker-badge--lemon',
  '冰川': 'sticker-badge--sky',
  '徒步': 'sticker-badge--mint',
  '峡湾': 'sticker-badge--grape',
  '海边': 'sticker-badge--sky',
  '城市休闲': 'sticker-badge--pink',
}
const getTagStyle = (tag: string): string => tagStyleMap[tag] || 'sticker-badge--peach'
</script>

<template>
  <div class="flex flex-col md:flex-row gap-4 h-full" id="schedule-view">
    <!-- ===== 左侧日期导航（桌面端侧边栏，移动端横向滚动）===== -->
    <aside
      class="md:w-44 lg:w-52 shrink-0 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-200px)] -mx-4 md:mx-0 px-4 md:px-0 pb-2 md:pb-0"
    >
      <!-- 日期选择：粉色胶带卡片 -->
      <div class="trip-card trip-card--pink p-3 md:p-4 pt-6 relative mb-4 md:mb-5 min-w-max md:min-w-0">
        <div class="washi-tape washi-tape--pink !w-24 md:!w-28" />
        <div class="text-center mb-3">
          <div class="font-hand text-xs text-ink-500 mb-1">选择日期</div>
          <div class="font-bold text-ink-800 text-sm">共 {{ store.tripDateList.length }} 天</div>
        </div>
        <!-- 左右切换按钮 -->
        <div class="flex items-center justify-center gap-2 mb-3">
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-white border-2 border-strawberry-300 text-strawberry-500 font-bold shadow-sticker-sm hover:bg-strawberry-50 active:scale-95 transition-all"
            :disabled="store.tripDateList.indexOf(selectedDate) === 0"
            @click="prevDate"
          >
            <IconChevronLeft :size="14" />
          </button>
          <span class="sticker-badge sticker-badge--pink !text-[10px] font-sticker">
            Day {{ store.tripDateList.indexOf(selectedDate) + 1 || '-' }}
          </span>
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-white border-2 border-strawberry-300 text-strawberry-500 font-bold shadow-sticker-sm hover:bg-strawberry-50 active:scale-95 transition-all"
            :disabled="store.tripDateList.indexOf(selectedDate) >= store.tripDateList.length - 1"
            @click="nextDate"
          >
            <IconChevronRight :size="14" />
          </button>
        </div>
      </div>

      <div
        ref="dayListRef"
        class="flex md:flex-col gap-1.5 md:gap-2 min-w-max md:min-w-0"
      >
        <button
          v-for="(ds, idx) in dateStats"
          :key="ds.date"
          type="button"
          class="flex md:flex-row md:items-center md:justify-between md:w-full shrink-0 gap-2 md:gap-1 px-3 py-2.5 rounded-2xl transition-all text-left relative sticker-hover"
          :class="selectedDate === ds.date
            ? 'bg-gradient-to-br from-strawberry-300 to-strawberry-400 text-white shadow-sticker border-2 border-strawberry-400'
            : 'bg-white border-2 border-dashed border-ink-200/40 text-ink-600 hover:border-strawberry-200 hover:bg-strawberry-50/50'"
          :style="{ transform: `rotate(${idx % 2 === 0 ? '-0.4' : '0.4'}deg)` }"
          @click="selectDate(ds.date)"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-xl font-sticker"
              :class="selectedDate === ds.date ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-700'"
            >
              Day{{ ds.dayNum }}
            </span>
          </div>
          <div class="flex-1 md:flex-none">
            <div
              class="text-xs md:text-sm font-bold whitespace-nowrap"
            >{{ formatDateCN(ds.date).split(' ')[0] }}</div>
            <div class="text-[10px] opacity-70">{{ formatDateCN(ds.date).split(' ')[1] }}</div>
          </div>
          <div
            class="text-[10px] shrink-0 px-2 py-0.5 rounded-full font-bold"
            :class="ds.itemCount > 0
              ? selectedDate === ds.date
                ? 'bg-white/25 text-white'
                : 'bg-lemon-100 text-lemon-600 border border-lemon-300'
              : selectedDate === ds.date
                ? 'bg-white/15 text-white/70'
                : 'bg-gray-100 text-gray-400'"
          >
            {{ ds.itemCount }}项
          </div>
        </button>
      </div>
    </aside>

    <!-- ===== 右侧行程卡片列表 ===== -->
    <div class="flex-1 space-y-5 md:space-y-6">
      <!-- 页面标题 -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🗺️ 每日行程手账</h1>
          <p class="page-subtitle font-hand">
            ~ 共 {{ store.totalScheduleItems }} 条精彩行程 · 支持拖拽排序哦 ~
          </p>
        </div>
        <button
          v-if="store.canEdit"
          class="btn-primary !py-2 !px-4 text-sm"
          @click="openAddModal(expandedDate || store.tripDateList[0])"
        >
          <IconPlus :size="16" /> 新增行程
        </button>
      </div>

      <!-- 无日期警告 -->
      <div
        v-if="store.tripDateList.length === 0"
        class="trip-card trip-card--lemon p-8 text-center pt-10 relative"
      >
        <div class="washi-tape washi-tape--lemon" />
        <IconAlert class="mx-auto text-strawberry-500 mb-3" :size="40" />
        <div class="sticky-note sticky-note--pink mx-auto max-w-sm">
          <p class="font-bold text-ink-800">尚未设置旅行日期</p>
          <p class="font-hand text-sm text-ink-600 mt-1">请在右上角设置中调整起止日期~</p>
        </div>
      </div>

      <!-- ===== 每日卡片 ===== -->
      <div
        v-for="(day, idx) in store.daySchedules"
        :key="day.date"
        :id="`day-${day.date}`"
        :class="[
          idx % 5 === 0 ? 'trip-card--pink' :
          idx % 5 === 1 ? 'trip-card--mint' :
          idx % 5 === 2 ? 'trip-card--sky' :
          idx % 5 === 3 ? 'trip-card--lemon' :
          'trip-card--grape',
          'trip-card overflow-hidden scroll-mt-24 pt-8 relative'
        ]"
        :style="{ transform: `rotate(${idx % 2 === 0 ? '-0.2' : '0.2'}deg)` }"
      >
        <!-- 胶带装饰 -->
        <div
          :class="[
            'washi-tape',
            idx % 5 === 0 ? 'washi-tape--pink' :
            idx % 5 === 1 ? 'washi-tape--mint' :
            idx % 5 === 2 ? 'washi-tape--sky' :
            idx % 5 === 3 ? 'washi-tape--lemon' :
            'washi-tape--grape'
          ]"
        />
        <!-- 角落装饰 -->
        <span class="doodle-corner top-3 right-4 text-lg">
          {{ idx % 4 === 0 ? '🌿' : idx % 4 === 1 ? '🌸' : idx % 4 === 2 ? '✨' : '🦋' }}
        </span>

        <!-- 日期标题栏 -->
        <button
          type="button"
          class="w-full flex items-center justify-between p-4 md:p-5 hover:bg-white/50 transition-colors text-left"
          @click="toggleDate(day.date)"
        >
          <div class="flex items-center gap-3 md:gap-4 min-w-0">
            <!-- 日期贴纸 -->
            <div
              :class="[
                'w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sticker border-2',
                idx % 5 === 0 ? 'bg-gradient-to-br from-strawberry-300 to-strawberry-500 border-strawberry-400' :
                idx % 5 === 1 ? 'bg-gradient-to-br from-primary-300 to-primary-500 border-primary-400' :
                idx % 5 === 2 ? 'bg-gradient-to-br from-skyblue-300 to-skyblue-500 border-skyblue-400' :
                idx % 5 === 3 ? 'bg-gradient-to-br from-lemon-200 to-lemon-400 border-lemon-300' :
                'bg-gradient-to-br from-grape-300 to-grape-500 border-grape-400'
              ]"
            >
              <span class="text-[10px] md:text-xs text-white/90 font-sticker">Day{{ idx + 1 }}</span>
              <span class="text-base md:text-xl font-extrabold text-white leading-tight font-sticker">
                {{ day.date.slice(8, 10) }}
              </span>
            </div>
            <div class="min-w-0">
              <!-- 日期贴纸标题 -->
              <span
                :class="[
                  'title-sticker text-sm md:text-base mb-1.5 inline-block',
                  idx % 5 === 0 ? 'title-sticker--pink' :
                  idx % 5 === 1 ? 'title-sticker--mint' :
                  idx % 5 === 2 ? 'title-sticker--sky' :
                  idx % 5 === 3 ? 'title-sticker--lemon' :
                  'title-sticker--grape'
                ]"
              >
                {{ formatDateCN(day.date) }}
              </span>
              <div class="flex items-center gap-2 text-xs flex-wrap mt-2">
                <span class="sticker-badge sticker-badge--sky !px-2 !py-0.5 !text-[10px] font-sticker">
                  📋 {{ day.items.length }} 条行程
                </span>
                <!-- 难度徽章 -->
                <span
                  v-if="day.items.length > 0"
                  class="sticker-badge !px-2 !py-0.5 !text-[10px] font-sticker"
                  :class="
                    (day.items.reduce(
                      (acc, it) =>
                        Math.max(acc, ['轻松', '适中', '较难', '挑战'].indexOf(it.difficulty)),
                      0
                    ) > 1
                      ? {
                          '轻松': 'sticker-badge--mint',
                          '适中': 'sticker-badge--lemon',
                          '较难': 'sticker-badge--peach',
                          '挑战': 'sticker-badge--pink',
                        }[
                          ['轻松', '适中', '较难', '挑战'][
                            day.items.reduce(
                              (acc, it) =>
                                Math.max(
                                  acc,
                                  ['轻松', '适中', '较难', '挑战'].indexOf(it.difficulty)
                                ),
                              0
                            )
                          ]
                        ]
                      : {
                          '轻松': 'sticker-badge--mint',
                          '适中': 'sticker-badge--lemon',
                          '较难': 'sticker-badge--peach',
                          '挑战': 'sticker-badge--pink',
                        }[day.items[0]?.difficulty || '轻松']
                    ) || 'sticker-badge--mint'
                  "
                >
                  {{
                    ['轻松', '适中', '较难', '挑战'][
                      day.items.reduce(
                        (acc, it) =>
                          Math.max(
                            acc,
                            ['轻松', '适中', '较难', '挑战'].indexOf(it.difficulty)
                          ),
                        0
                      )
                    ] || '轻松'
                  }}
                </span>
                <span
                  v-if="store.noticeData.dailyNotes[day.date]"
                  class="sticker-badge sticker-badge--grape !px-2 !py-0.5 !text-[10px]"
                >📝 有备注</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0 ml-2">
            <button
              v-if="store.canEdit"
              type="button"
              class="btn-ghost !p-2 !px-2 text-strawberry-600 hover:bg-strawberry-50 border-strawberry-200"
              title="新增行程"
              @click.stop="openAddModal(day.date)"
            >
              <IconPlus :size="16" />
            </button>
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                expandedDate === day.date
                  ? 'bg-strawberry-100 text-strawberry-500'
                  : 'bg-ink-50 text-ink-400'
              ]"
            >
              <component
                :is="expandedDate === day.date ? IconChevronUp : IconChevronDown"
                :size="18"
              />
            </div>
          </div>
        </button>

        <!-- 折叠内容 -->
        <transition name="expand">
          <div v-show="expandedDate === day.date" class="border-t-2 border-dashed border-ink-100">
            <!-- 每日专属备注：便签纸风格 -->
            <div
              v-if="store.noticeData.dailyNotes[day.date] || store.canEdit"
              class="px-4 md:px-5 py-4"
            >
              <div class="sticky-note sticky-note--blue">
                <div class="font-hand text-sm text-ink-700 mb-2 font-bold">📝 当日专属备注</div>
                <textarea
                  v-if="store.canEdit"
                  :value="store.noticeData.dailyNotes[day.date] || ''"
                  rows="2"
                  class="textarea-base !bg-white/70 !py-2 text-xs !border-skyblue-200"
                  placeholder="添加这一天的特别提醒..."
                  @blur="(e) =>
                    store.updateDailyNote(day.date, (e.target as HTMLTextAreaElement).value)
                  "
                />
                <p
                  v-else
                  class="font-hand text-sm text-ink-600 whitespace-pre-line"
                >{{ store.noticeData.dailyNotes[day.date] || '（还没有备注哦~）' }}</p>
              </div>
            </div>

            <!-- 空状态 -->
            <div
              v-if="day.items.length === 0"
              class="p-8 md:p-10 text-center"
            >
              <div class="sticky-note sticky-note--mint mx-auto max-w-xs py-6">
                <div class="text-4xl mb-2">🗺️</div>
                <p class="font-hand text-ink-600">这一天还没有安排行程~</p>
                <button
                  v-if="store.canEdit"
                  class="btn-primary mt-4 !py-2 !px-4 text-sm"
                  @click="openAddModal(day.date)"
                >
                  <IconPlus :size="14" /> 安排第一条行程
                </button>
              </div>
            </div>

            <!-- ===== 行程列表（可拖拽）===== -->
            <div
              v-else
              :data-sort-list="day.date"
              class="py-3 px-3 md:px-5 space-y-3 md:space-y-4"
            >
              <div
                v-for="(item, itemIdx) in day.items"
                :key="item.id"
                :data-item-id="item.id"
                class="group relative trip-card trip-card--mint p-4 md:p-5 pt-6 hover:shadow-sticker-lg transition-all"
                :style="{ transform: `rotate(${itemIdx % 2 === 0 ? '-0.4' : '0.4'}deg)` }"
              >
                <!-- 小胶带 -->
                <div class="washi-tape washi-tape--mint !w-20 !h-5 md:!w-24" />
                <!-- 角落小表情 -->
                <span class="absolute top-3 left-4 text-sm opacity-60">
                  {{ itemIdx % 5 === 0 ? '🌱' : itemIdx % 5 === 1 ? '🍃' : itemIdx % 5 === 2 ? '🌿' : itemIdx % 5 === 3 ? '🍀' : '🌾' }}
                </span>

                <div class="flex gap-3 md:gap-4">
                  <!-- 拖拽手柄 + 时间贴纸 -->
                  <div class="flex flex-col items-center shrink-0">
                    <div
                      v-if="store.canEdit"
                      class="drag-handle p-1.5 -ml-1 rounded-xl bg-primary-50 text-primary-500 hover:text-primary-700 hover:bg-primary-100 cursor-grab active:cursor-grabbing transition-all border border-dashed border-primary-200"
                      title="拖拽排序"
                    >
                      <IconGripVertical :size="14" />
                    </div>
                    <!-- 时间段贴纸 -->
                    <div
                      class="mt-2 sticker-badge sticker-badge--sky !py-1.5 !px-3 !text-[11px] font-sticker whitespace-nowrap"
                      style="transform: rotate(-1.5deg)"
                    >
                      <IconClock :size="11" class="inline -mt-0.5 mr-0.5" />
                      {{ item.timeStart }}
                      <span class="mx-0.5 opacity-60">~</span>
                      {{ item.timeEnd }}
                    </div>
                    <div class="font-hand text-[10px] text-ink-400 mt-1.5">
                      {{ item.duration ? '⏱️ ' + item.duration + '分钟' : '' }}
                    </div>
                  </div>

                  <!-- 主内容 -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <h4 class="font-bold text-ink-800 text-sm md:text-base flex items-center gap-1.5">
                        <IconMapPin :size="14" class="text-primary-500 shrink-0" />
                        <span class="truncate">{{ item.location }}</span>
                      </h4>
                      <!-- 难度贴纸 -->
                      <span
                        class="sticker-badge !px-2 !py-0.5 !text-[10px] font-sticker shrink-0"
                        :class="[
                          item.difficulty === '轻松' ? 'sticker-badge--mint' :
                          item.difficulty === '适中' ? 'sticker-badge--lemon' :
                          item.difficulty === '较难' ? 'sticker-badge--peach' :
                          item.difficulty === '挑战' ? 'sticker-badge--pink' :
                          'sticker-badge--mint'
                        ]"
                      >{{ item.difficulty }}</span>
                    </div>

                    <!-- 新西兰专属标签贴纸 -->
                    <div v-if="item.tags.length > 0" class="mt-2.5 flex flex-wrap gap-1.5">
                      <span
                        v-for="tag in item.tags"
                        :key="tag"
                        :class="['sticker-badge !px-2 !py-0.5 !text-[10px] font-sticker', getTagStyle(tag)]"
                      >
                        #{{ tag }}
                      </span>
                    </div>

                    <!-- 交通餐饮 -->
                    <div
                      v-if="item.transport || item.dining"
                      class="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-hand text-ink-600"
                    >
                      <span v-if="item.transport" class="inline-flex items-center gap-1 sticker-badge sticker-badge--lemon !px-2 !py-0.5 !text-[10px]">
                        <IconCar :size="11" /> {{ item.transport }}
                      </span>
                      <span v-if="item.dining" class="inline-flex items-center gap-1 sticker-badge sticker-badge--peach !px-2 !py-0.5 !text-[10px]">
                        <IconUtensils :size="11" /> {{ item.dining }}
                      </span>
                    </div>

                    <!-- 备注：便签风 -->
                    <div
                      v-if="item.notes"
                      class="mt-3 p-3 rounded-xl bg-lemon-50/80 border-2 border-dashed border-lemon-200 text-xs font-hand text-ink-600 leading-relaxed whitespace-pre-line"
                    >
                      💡 {{ item.notes }}
                    </div>

                    <!-- 溯源信息 -->
                    <div class="mt-2.5 flex items-center gap-2 text-[10px] font-hand text-ink-400 flex-wrap">
                      <span>✍️ 创建：{{ item.createdBy || '-' }}</span>
                      <span>·</span>
                      <span>🔄 更新：{{ item.updatedBy || '-' }} · {{ formatRelativeTime(item.updatedAt || item.createdAt || 0) }}</span>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div
                    v-if="store.canEdit"
                    class="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-2xl shadow-sticker p-1 border border-strawberry-100"
                  >
                    <button
                      type="button"
                      class="p-1.5 rounded-xl text-skyblue-600 hover:bg-skyblue-50 transition-all"
                      title="编辑"
                      @click="openEditModal(day.date, item)"
                    >
                      <IconEdit :size="14" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 rounded-xl text-strawberry-500 hover:bg-strawberry-50 transition-all"
                      title="删除"
                      @click="handleDelete(day.date, item.id)"
                    >
                      <IconTrash :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- ===== 悬浮草莓粉大按钮 ===== -->
    <button
      v-if="store.canEdit && store.tripDateList.length > 0"
      type="button"
      class="fixed bottom-24 md:bottom-20 right-5 md:right-8 z-30 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-pop active:scale-90 transition-all animate-float"
      style="background: linear-gradient(180deg, #ff6f96 0%, #fb4277 100%); box-shadow: 0 4px 0 #c5144b, 0 10px 30px -5px rgba(251,66,119,0.5);"
      title="新增行程"
      @click="openAddModal(expandedDate || store.tripDateList[0])"
    >
      <IconPlus :size="28" class="md:hidden" />
      <IconPlus :size="32" class="hidden md:block" />
      <span class="absolute -top-1 -right-1 text-xl animate-sparkle">🍓</span>
    </button>

    <!-- 编辑弹窗 -->
    <ScheduleItemModal
      v-model:visible="showModal"
      :date="editingDate"
      :editing-item="editingItem"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 5000px;
}
</style>
