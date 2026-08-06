// ================================
// 通用组件：首次进入 - 昵称输入 + 权限选择弹窗（可爱手账风 🎀）
// ================================
<script setup lang="ts">
import { ref } from 'vue'
import { useTripStore } from '@/stores/trip'
import { IconUser, IconSparkles, IconEye, IconEdit } from '@/components/icons'

const store = useTripStore()
const nickname = ref('')
const role = ref<'editor' | 'viewer'>('editor')
const loading = ref(false)
const error = ref('')

const handleConfirm = () => {
  error.value = ''
  const name = nickname.value.trim()
  if (!name) {
    error.value = '请输入您的昵称哦～'
    return
  }
  if (name.length > 12) {
    error.value = '昵称最多12个字符啦'
    return
  }
  loading.value = true
  setTimeout(() => {
    store.setCurrentUser(name, role.value)
    loading.value = false
  }, 400)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background:
      radial-gradient(circle at 15% 20%, rgba(255, 202, 217, 0.55) 0%, transparent 45%),
      radial-gradient(circle at 85% 15%, rgba(186, 230, 253, 0.6) 0%, transparent 45%),
      radial-gradient(circle at 50% 100%, rgba(233, 213, 255, 0.6) 0%, transparent 50%),
      rgba(255, 253, 247, 0.85);
      backdrop-filter: blur(6px);
    "
  >
    <div class="w-full max-w-md relative animate-pop">
      <!-- 顶部胶带（两条交错） -->
      <div class="washi-tape !w-36 !h-8 washi-tape--pink" style="left: 22%; transform: translateX(-50%) rotate(-4deg)" />
      <div class="washi-tape !w-28 !h-8 washi-tape--mint" style="left: 72%; transform: translateX(-50%) rotate(3deg)" />

      <!-- 主体手账卡片 -->
      <div class="relative modal-card p-6 md:p-8">
        <!-- 角落贴纸装饰 -->
        <span class="absolute -top-5 -left-3 text-3xl animate-float" style="animation-delay: 0.2s">🌸</span>
        <span class="absolute -top-4 -right-4 text-2xl animate-wiggle">✨</span>
        <span class="absolute -bottom-3 -left-4 text-2xl animate-float" style="animation-delay: 0.6s">🦋</span>
        <span class="absolute -bottom-5 -right-3 text-3xl animate-wiggle" style="animation-delay: 0.4s">🍡</span>

        <!-- 顶部标题贴纸 -->
        <div class="text-center mb-7 relative">
          <!-- 新西兰大贴纸 -->
          <div class="inline-flex items-center justify-center relative mb-4">
            <div class="w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] bg-gradient-to-br from-skyblue-300 via-skyblue-400 to-primary-400 flex items-center justify-center shadow-sticker-lg border-4 border-white -rotate-2">
              <span class="text-4xl md:text-5xl">🐑</span>
            </div>
            <!-- 小爱心 -->
            <span class="absolute -top-1 -right-1 text-2xl animate-sparkle">💕</span>
            <!-- 小星 -->
            <span class="absolute -bottom-1 -left-2 text-xl animate-sparkle" style="animation-delay: 0.8s">🌟</span>
          </div>

          <!-- 贴纸标题 -->
          <div class="flex items-center justify-center gap-2 mb-2">
            <span class="title-sticker title-sticker--pink !px-5 !py-1.5 !text-2xl md:!text-3xl">
              新西兰旅行手账
            </span>
          </div>
          <p class="text-sm md:text-base text-ink-500 font-hand">
            ~ 多人协同 · 实时同步 · 记录每一个美好瞬间 ~
          </p>
        </div>

        <!-- 昵称输入：便签纸风 -->
        <div class="mb-6 relative">
          <label class="flex items-center gap-1.5 text-sm md:text-base font-bold text-ink-800 mb-2.5">
            <span class="inline-block w-7 h-7 rounded-xl bg-strawberry-100 border-2 border-strawberry-300 flex items-center justify-center shadow-sticker-sm text-strawberry-600">
              <IconUser :size="14" />
            </span>
            你的昵称 <span class="text-strawberry-500 text-lg">*</span>
          </label>
          <div class="relative">
            <input
              v-model="nickname"
              type="text"
              maxlength="12"
              placeholder="输入昵称，例如：小明 🌸"
              class="input-base pl-11 !py-3.5 !text-base"
              @keyup.enter="handleConfirm"
            />
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-strawberry-400">
              <IconUser :size="18" />
            </span>
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 sticker-badge !px-2 !py-0.5 !text-[10px]"
              :class="nickname.length >= 10 ? 'sticker-badge--pink' : 'sticker-badge--lemon'"
            >
              {{ nickname.length }}/12
            </span>
          </div>
        </div>

        <!-- 权限选择：双卡片贴纸 -->
        <div class="mb-6">
          <label class="flex items-center gap-1.5 text-sm md:text-base font-bold text-ink-800 mb-3">
            <span class="inline-block w-7 h-7 rounded-xl bg-grape-100 border-2 border-grape-300 flex items-center justify-center shadow-sticker-sm text-grape-600">
              ✏️
            </span>
            选择你的编辑权限
          </label>
          <div class="grid grid-cols-2 gap-3">
            <!-- 可编辑：薄荷绿卡 -->
            <button
              type="button"
              class="relative p-3.5 md:p-4 rounded-2xl text-left transition-all duration-300 border-[2.5px] group"
              :class="role === 'editor'
                ? 'bg-primary-50 border-primary-400 shadow-sticker -rotate-0.5 scale-[1.02]'
                : 'bg-white border-ink-200/30 hover:border-primary-200 hover:bg-primary-50/50'"
              @click="role = 'editor'"
            >
              <!-- 胶带装饰 -->
              <div v-if="role === 'editor'" class="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 rounded-sm opacity-80"
                style="background: repeating-linear-gradient(45deg, #c6ebc4, #c6ebc4 5px, #9fdc9c 5px, #9fdc9c 10px); transform: translateX(-50%) rotate(-2deg)">
              </div>
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center border-2"
                  :class="role === 'editor'
                    ? 'bg-primary-200 border-primary-400 text-primary-800'
                    : 'bg-gray-100 border-gray-200 text-gray-500'"
                >
                  <IconEdit :size="15" />
                </div>
                <span
                  class="font-bold text-sm md:text-base"
                  :class="role === 'editor' ? 'text-primary-800' : 'text-ink-700'"
                >可编辑模式</span>
              </div>
              <p class="text-[11px] md:text-xs text-ink-500 leading-relaxed font-hand">
                可修改行程、订单、注意事项<br/>适合组织者 ✨
              </p>
              <!-- 选中小勾贴纸 -->
              <div
                v-if="role === 'editor'"
                class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sticker-sm border-2 border-white animate-pop"
              >
                <span class="text-white text-sm font-bold">✓</span>
              </div>
            </button>

            <!-- 只读：天空蓝卡 -->
            <button
              type="button"
              class="relative p-3.5 md:p-4 rounded-2xl text-left transition-all duration-300 border-[2.5px] group"
              :class="role === 'viewer'
                ? 'bg-skyblue-50 border-skyblue-400 shadow-sticker rotate-0.5 scale-[1.02]'
                : 'bg-white border-ink-200/30 hover:border-skyblue-200 hover:bg-skyblue-50/50'"
              @click="role = 'viewer'"
            >
              <div v-if="role === 'viewer'" class="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 rounded-sm opacity-80"
                style="background: repeating-linear-gradient(-45deg, #bae6fd, #bae6fd 5px, #7dd3fc 5px, #7dd3fc 10px); transform: translateX(-50%) rotate(2deg)">
              </div>
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-xl flex items-center justify-center border-2"
                  :class="role === 'viewer'
                    ? 'bg-skyblue-200 border-skyblue-400 text-skyblue-800'
                    : 'bg-gray-100 border-gray-200 text-gray-500'"
                >
                  <IconEye :size="15" />
                </div>
                <span
                  class="font-bold text-sm md:text-base"
                  :class="role === 'viewer' ? 'text-skyblue-800' : 'text-ink-700'"
                >只读模式</span>
              </div>
              <p class="text-[11px] md:text-xs text-ink-500 leading-relaxed font-hand">
                只查看、不修改<br/>防止误操作 👀
              </p>
              <div
                v-if="role === 'viewer'"
                class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-skyblue-400 to-skyblue-600 flex items-center justify-center shadow-sticker-sm border-2 border-white animate-pop"
              >
                <span class="text-white text-sm font-bold">✓</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 错误提示：粉色便签 -->
        <transition name="pop-tip">
          <div v-if="error" class="mb-5 sticky-note sticky-note--pink !rotate-0 !rounded-2xl">
            <div class="flex items-center gap-2 text-strawberry-800 font-bold text-sm">
              <span class="text-lg">⚠️</span>
              <span>{{ error }}</span>
            </div>
          </div>
        </transition>

        <!-- 确认按钮：草莓粉大按钮 -->
        <button
          class="w-full btn-primary !py-4 !text-lg md:!text-xl relative overflow-hidden"
          :disabled="loading || !nickname.trim()"
          @click="handleConfirm"
        >
          <span v-if="loading" class="inline-flex items-center gap-2">
            <span class="w-5 h-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"></span>
            开启中...
          </span>
          <template v-else>
            <IconSparkles :size="20" />
            开启新西兰之旅 ✈️
          </template>
          <!-- 按钮上的小闪烁 -->
          <span class="pointer-events-none absolute -top-1 right-6 text-sm animate-sparkle">✨</span>
          <span class="pointer-events-none absolute bottom-1 left-8 text-xs animate-sparkle" style="animation-delay: 0.6s">💖</span>
        </button>

        <!-- 底部说明：小花边 -->
        <div class="mt-6 pt-5 text-center">
          <div class="text-ink-400 text-[10px] md:text-xs tracking-[0.2em] mb-2 font-hand">
            ✦ ✧ ❀ ✿ ❁ ✾ ✽ ❋ ✦
          </div>
          <div class="inline-block px-4 py-1.5 rounded-full bg-lemon-100 border border-lemon-300 shadow-sticker-sm text-lemon-700 text-xs md:text-sm font-bold">
            💡 无需注册登录 · 云端实时同步 · 离线也能看
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pop-tip-enter-active,
.pop-tip-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-tip-enter-from,
.pop-tip-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(-6px);
}
</style>
