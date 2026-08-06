// ================================
// 根组件 App.vue
// ================================
<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useTripStore } from '@/stores/trip'
import AppLayout from '@/components/layout/AppLayout.vue'
import NicknameModal from '@/components/common/NicknameModal.vue'
import SyncToast from '@/components/common/SyncToast.vue'

const tripStore = useTripStore()

// 监听在线/离线状态，处理离线缓存与自动同步
const handleOnline = () => {
  tripStore.setOnlineStatus(true)
  tripStore.syncOfflineChanges()
}
const handleOffline = () => {
  tripStore.setOnlineStatus(false)
}

onMounted(() => {
  // 初始化在线状态
  tripStore.setOnlineStatus(navigator.onLine)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

// 自动保存（防抖）
watch(
  () => [tripStore.schedules, tripStore.orders, tripStore.noticeData],
  () => {
    tripStore.saveToLocal()
  },
  { deep: true }
)
</script>

<template>
  <div id="app-root" class="min-h-screen">
    <!-- 昵称输入弹窗（首次进入显示） -->
    <NicknameModal v-if="!tripStore.currentUser" />

    <!-- 主布局 -->
    <AppLayout v-else />

    <!-- 同步状态提示 -->
    <SyncToast />
  </div>
</template>
