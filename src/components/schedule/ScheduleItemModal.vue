// ================================
// 通用弹窗组件：行程编辑弹窗（新增/修改单条行程）
// ================================
<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import {
  IconX,
  IconClock,
  IconMapPin,
  IconCar,
  IconUtensils,
  IconTag,
  IconCheck,
} from '@/components/icons'
import type { ScheduleItem, NZTag, TransportType, DifficultyLevel } from '@/types'
import { NZ_TAGS, TRANSPORT_TYPES, DIFFICULTY_LEVELS } from '@/utils/constants'
import { generateId, getDifficultyColor } from '@/utils'

interface Props {
  visible: boolean
  date: string
  editingItem?: ScheduleItem
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'save', item: ScheduleItem): void
}>()

// 表单字段
const timeStart = ref('09:00')
const timeEnd = ref('10:00')
const location = ref('')
const transport = ref<TransportType>('自驾')
const dining = ref('')
const duration = ref(60)
const notes = ref('')
const difficulty = ref<DifficultyLevel>('轻松')
const tags = ref<NZTag[]>([])

// 打开弹窗时：编辑模式回填数据，新增模式清空
watch(
  () => [props.visible, props.editingItem] as const,
  ([v, item]) => {
    if (!v) return
    if (item) {
      const it = item as ScheduleItem
      timeStart.value = it.timeStart || '09:00'
      timeEnd.value = it.timeEnd || '10:00'
      location.value = it.location
      transport.value = it.transport
      dining.value = it.dining
      duration.value = it.duration || 60
      notes.value = it.notes
      difficulty.value = it.difficulty
      tags.value = [...it.tags]
    } else {
      timeStart.value = '09:00'
      timeEnd.value = '10:00'
      location.value = ''
      transport.value = '自驾'
      dining.value = ''
      duration.value = 60
      notes.value = ''
      difficulty.value = '轻松'
      tags.value = []
    }
  },
  { immediate: true }
)

const toggleTag = (tag: NZTag) => {
  const idx = tags.value.indexOf(tag)
  if (idx >= 0) tags.value.splice(idx, 1)
  else tags.value.push(tag)
}

const handleSave = () => {
  if (!location.value.trim()) {
    alert('请填写游玩地点')
    return
  }
  const base: ScheduleItem = {
    id: props.editingItem?.id || generateId(),
    date: props.date,
    timeStart: timeStart.value,
    timeEnd: timeEnd.value,
    location: location.value.trim(),
    transport: transport.value,
    dining: dining.value.trim(),
    duration: Number(duration.value) || 0,
    notes: notes.value.trim(),
    difficulty: difficulty.value,
    tags: [...tags.value],
    createdBy: '',
    createdAt: 0,
    updatedBy: '',
    updatedAt: 0,
    sortOrder: props.editingItem?.sortOrder ?? 0,
  }
  emit('save', base)
  emit('update:visible', false)
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="editingItem ? '编辑行程' : `新增行程 · ${date.slice(5)}`"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <div class="space-y-4">
      <!-- 时间段 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
            <IconClock :size="12" /> 开始时间
          </label>
          <input type="time" v-model="timeStart" class="input-base py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
            <IconClock :size="12" /> 结束时间
          </label>
          <input type="time" v-model="timeEnd" class="input-base py-2 text-sm" />
        </div>
      </div>

      <!-- 地点 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
          <IconMapPin :size="12" /> 游玩地点 <span class="text-red-500">*</span>
        </label>
        <input
          v-model="location"
          type="text"
          class="input-base"
          placeholder="例如：米尔福德峡湾巡游"
          maxlength="40"
        />
      </div>

      <!-- 交通 + 停留时长 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
            <IconCar :size="12" /> 交通方式
          </label>
          <select v-model="transport" class="select-base py-2 text-sm">
            <option v-for="t in TRANSPORT_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
            <IconClock :size="12" /> 停留时长(分钟)
          </label>
          <input
            v-model.number="duration"
            type="number"
            min="0"
            step="15"
            class="input-base py-2 text-sm"
          />
        </div>
      </div>

      <!-- 餐饮 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
          <IconUtensils :size="12" /> 餐饮安排
        </label>
        <input
          v-model="dining"
          type="text"
          class="input-base"
          placeholder="例如：Fergburger 汉堡 / 山顶自助餐"
          maxlength="50"
        />
      </div>

      <!-- 难易度 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">当日难易度</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="lvl in DIFFICULTY_LEVELS"
            :key="lvl"
            type="button"
            class="py-1.5 rounded-lg text-xs font-medium border transition-all"
            :class="difficulty === lvl
              ? getDifficultyColor(lvl) + ' border-transparent ring-2 ring-offset-1 ring-current/30'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
            @click="difficulty = lvl"
          >
            {{ lvl }}
          </button>
        </div>
      </div>

      <!-- 新西兰标签 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
          <IconTag :size="12" /> 新西兰标签（可多选）
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tag in NZ_TAGS"
            :key="tag"
            type="button"
            class="tag-badge border transition-all"
            :class="tags.includes(tag)
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'bg-white text-gray-500 border-gray-200 hover:border-primary-200 hover:text-primary-600'"
            @click="toggleTag(tag)"
          >
            <IconCheck v-if="tags.includes(tag)" :size="10" class="mr-0.5" />
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- 备注 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">行程备注</label>
        <textarea
          v-model="notes"
          rows="3"
          class="textarea-base"
          placeholder="预订链接、集合点、注意事项等..."
          maxlength="300"
        />
        <div class="text-right text-[10px] text-gray-400 mt-0.5">{{ notes.length }}/300</div>
      </div>
    </div>

    <template #footer>
      <div class="px-5 py-3 border-t border-gray-100 flex gap-2 shrink-0">
        <button
          type="button"
          class="btn-secondary flex-1"
          @click="emit('update:visible', false)"
        >取消</button>
        <button
          type="button"
          class="btn-primary flex-1"
          @click="handleSave"
        >
          <IconCheck :size="16" /> {{ editingItem ? '保存修改' : '添加行程' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
