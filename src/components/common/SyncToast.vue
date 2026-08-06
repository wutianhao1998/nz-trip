// ================================
// 通用组件：同步状态 Toast（手账风·可爱小贴纸）
// ================================
<script setup lang="ts">
import { computed } from 'vue'
import { useTripStore } from '@/stores/trip'
import { IconWifi, IconWifiOff, IconRefresh } from '@/components/icons'
import { formatRelativeTime } from '@/utils'

const store = useTripStore()

const statusText = computed(() => {
  if (!store.isOnline) return '📴 离线模式'
  if (store.isSyncing) return '🌀 同步中...'
  if (store.lastSyncAt) return `✨ 已同步 · ${formatRelativeTime(store.lastSyncAt)}`
  return '⏳ 等待同步'
})
// 根据状态返回不同的贴纸样式
const statusStickerClass = computed(() => {
  if (!store.isOnline) return 'bg-ink-600 border-ink-400 text-white'
  if (store.isSyncing) return 'bg-skyblue-100 border-skyblue-300 text-skyblue-700'
  return 'bg-primary-100 border-primary-300 text-primary-700'
})
</script>

<template>
  <transition name="fade">
    <div
      class="no-print fixed bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-8 left-1/2 -translate-x-1/2 z-40
             px-4 py-2 rounded-full flex items-center gap-2
             font-bold text-xs md:text-sm border-2 border-dashed shadow-sticker-sm backdrop-blur-md
             animate-float"
      :class="statusStickerClass"
      style="font-family: 'Baloo 2', 'ZCOOL KuaiLe', sans-serif"
    >
      <span v-if="!store.isOnline" class="pulse-dot inline-flex">
        <IconWifiOff :size="14" />
      </span>
      <span v-else-if="store.isSyncing" class="inline-flex" style="animation: spin 1.2s linear infinite">
        <IconRefresh :size="14" />
      </span>
      <span v-else class="pulse-dot inline-flex">
        <IconWifi :size="14" />
      </span>
      <span>{{ statusText }}</span>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 14px) scale(0.9);
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
