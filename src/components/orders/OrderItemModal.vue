// ================================
// 通用弹窗组件：订单编辑弹窗
// ================================
<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import {
  IconCheck,
  IconUpload,
  IconX,
  IconFile,
} from '@/components/icons'
import type { OrderItem, OrderCategory, OrderStatus, OrderVoucher } from '@/types'
import {
  ORDER_CATEGORIES,
  ORDER_STATUSES,
  ORDER_CATEGORY_ICONS,
  ORDER_CATEGORY_COLORS,
} from '@/utils/constants'
import { generateId, fileToDataURL, formatFileSize } from '@/utils'
import dayjs from 'dayjs'

interface Props {
  visible: boolean
  editingItem?: OrderItem
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'save', item: OrderItem): void
}>()

// 表单
const category = ref<OrderCategory>('国际机票')
const title = ref('')
const orderNo = ref('')
const dateTime = ref('')
const price = ref<number>(0)
const contact = ref('')
const status = ref<OrderStatus>('未预订')
const notes = ref('')
const voucher = ref<OrderVoucher | undefined>(undefined)
const uploading = ref(false)

watch(
  () => [props.visible, props.editingItem] as const,
  ([v, item]) => {
    if (!v) return
    if (item) {
      const it = item as OrderItem
      category.value = it.category
      title.value = it.title
      orderNo.value = it.orderNo
      dateTime.value = it.dateTime
        ? dayjs(it.dateTime).format('YYYY-MM-DDTHH:mm')
        : ''
      price.value = it.price
      contact.value = it.contact
      status.value = it.status
      notes.value = it.notes
      voucher.value = it.voucher
    } else {
      category.value = '国际机票'
      title.value = ''
      orderNo.value = ''
      dateTime.value = ''
      price.value = 0
      contact.value = ''
      status.value = '未预订'
      notes.value = ''
      voucher.value = undefined
    }
  },
  { immediate: true }
)

// 上传凭证
const onUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    alert('凭证文件不能超过 3MB')
    input.value = ''
    return
  }
  uploading.value = true
  try {
    const dataUrl = await fileToDataURL(file)
    voucher.value = {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
    }
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const removeVoucher = () => {
  voucher.value = undefined
}

const handleSave = () => {
  if (!title.value.trim()) {
    alert('请填写订单标题')
    return
  }
  const isoDate = dateTime.value
    ? dayjs(dateTime.value).toISOString()
    : ''
  const item: OrderItem = {
    id: props.editingItem?.id || generateId(),
    category: category.value,
    title: title.value.trim(),
    orderNo: orderNo.value.trim(),
    dateTime: isoDate,
    price: Number(price.value) || 0,
    contact: contact.value.trim(),
    status: status.value,
    notes: notes.value.trim(),
    voucher: voucher.value,
    createdBy: '',
    createdAt: 0,
    updatedBy: '',
    updatedAt: 0,
  }
  emit('save', item)
  emit('update:visible', false)
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="editingItem ? '编辑订单' : '新增订单'"
    @update:visible="(v) => emit('update:visible', v)"
  >
    <div class="space-y-4">
      <!-- 分类选择 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">订单分类</label>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="cat in ORDER_CATEGORIES"
            :key="cat"
            type="button"
            class="flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all"
            :class="category === cat
              ? `${ORDER_CATEGORY_COLORS[cat]} border-transparent shadow-soft`
              : 'bg-white border-gray-200 hover:bg-gray-50'"
            @click="category = cat"
          >
            <span class="text-xl">{{ ORDER_CATEGORY_ICONS[cat] }}</span>
            <span
              class="leading-tight text-center"
              :class="category === cat ? 'font-semibold' : 'text-gray-600'"
            >{{ cat }}</span>
          </button>
        </div>
      </div>

      <!-- 标题 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">
          订单标题 <span class="text-red-500">*</span>
        </label>
        <input
          v-model="title"
          type="text"
          class="input-base"
          placeholder="例如：新西兰航空 NZ289 上海→奥克兰"
          maxlength="60"
        />
      </div>

      <!-- 订单号 + 时间 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5">订单号</label>
          <input
            v-model="orderNo"
            type="text"
            class="input-base"
            placeholder="可留空"
            maxlength="40"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5">出行/使用时间</label>
          <input
            v-model="dateTime"
            type="datetime-local"
            class="input-base"
          />
        </div>
      </div>

      <!-- 价格 + 状态 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5">价格 (NZD 纽币)</label>
          <input
            v-model.number="price"
            type="number"
            min="0"
            step="0.01"
            class="input-base"
            placeholder="0.00"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1.5">订单状态</label>
          <select v-model="status" class="select-base py-2.5 text-sm">
            <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <!-- 联系人 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">联系人/电话/邮箱</label>
        <input
          v-model="contact"
          type="text"
          class="input-base"
          placeholder="例如：张三 +64-21-1234567"
          maxlength="60"
        />
      </div>

      <!-- 凭证上传 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">
          凭证上传（行程单/电子票/PDF等，≤3MB）
        </label>
        <div
          v-if="voucher"
          class="flex items-center justify-between p-3 rounded-xl bg-ocean-50 border border-ocean-100"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-ocean-100 flex items-center justify-center text-ocean-600 shrink-0">
              <IconFile :size="18" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-gray-800 truncate">{{ voucher.name }}</div>
              <div class="text-[11px] text-gray-500">{{ formatFileSize(voucher.size) }}</div>
            </div>
          </div>
          <button
            type="button"
            class="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
            @click="removeVoucher"
          >
            <IconX :size="16" />
          </button>
        </div>
        <label
          v-else
          class="flex flex-col items-center justify-center py-5 px-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer transition-all"
        >
          <IconUpload
            :size="22"
            :class="uploading ? 'animate-bounce text-primary-500' : 'text-gray-400'"
          />
          <span class="mt-1.5 text-sm text-gray-500">
            {{ uploading ? '上传中...' : '点击选择凭证文件' }}
          </span>
          <span class="text-[11px] text-gray-400 mt-0.5">PDF/JPG/PNG 最大3MB</span>
          <input
            type="file"
            class="hidden"
            accept=".pdf,image/*"
            @change="onUpload"
          />
        </label>
      </div>

      <!-- 备注 -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1.5">备注</label>
        <textarea
          v-model="notes"
          rows="2"
          class="textarea-base"
          placeholder="预订链接、取消政策、注意事项..."
          maxlength="200"
        />
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
          <IconCheck :size="16" /> {{ editingItem ? '保存修改' : '添加订单' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
