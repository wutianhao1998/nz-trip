// ================================
// 通用组件：模态弹窗基础容器（可爱手账风 🎀）
//   胶带固定 + 贴纸标题 + 虚线边框
// ================================
<script setup lang="ts">
import { watch } from 'vue'
import { IconX } from '@/components/icons'

interface Props {
  visible: boolean
  title?: string
  maxWidth?: string
  hideClose?: boolean
  closeOnMask?: boolean
  /** 胶带颜色变体：pink/mint/lemon/sky/grape */
  tapeColor?: 'pink' | 'mint' | 'lemon' | 'sky' | 'grape'
  /** 贴纸标题颜色变体：pink/mint/lemon/sky/grape */
  titleColor?: 'pink' | 'mint' | 'lemon' | 'sky' | 'grape'
}
const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidth: 'max-w-lg',
  hideClose: false,
  closeOnMask: true,
  tapeColor: 'pink',
  titleColor: 'pink',
})
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'close'): void
}>()

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const onMaskClick = () => {
  if (props.closeOnMask) close()
}

// ESC 键关闭
watch(
  () => props.visible,
  (v) => {
    if (!v) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    const stopWatch = watch(
      () => props.visible,
      (nv) => {
        if (!nv) {
          window.removeEventListener('keydown', handler)
          stopWatch()
        }
      }
    )
  }
)
</script>

<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      >
        <!-- 手账风遮罩：奶油色渐变 + 柔光 -->
        <div
          class="absolute inset-0"
          style="background:
            radial-gradient(circle at 20% 20%, rgba(255, 202, 217, 0.55) 0%, transparent 45%),
            radial-gradient(circle at 80% 30%, rgba(186, 230, 253, 0.55) 0%, transparent 45%),
            radial-gradient(circle at 50% 100%, rgba(233, 213, 255, 0.55) 0%, transparent 50%),
            rgba(63, 59, 50, 0.35);
            backdrop-filter: blur(4px);
          "
          @click="onMaskClick"
        />
        <!-- 内容区：手账卡片 + 胶带 -->
        <div
          class="relative w-full max-h-[92vh] flex flex-col"
          :class="maxWidth"
        >
          <!-- 顶部胶带（左右各一条） -->
          <div
            class="absolute -top-3 left-6 h-7 w-24 md:w-28 z-10 rounded-sm opacity-90"
            :class="{
              'washi-tape--pink': tapeColor === 'pink',
              'washi-tape--mint': tapeColor === 'mint',
              'washi-tape--lemon': tapeColor === 'lemon',
              'washi-tape--sky': tapeColor === 'sky',
              'washi-tape--grape': tapeColor === 'grape',
            }"
            style="transform: rotate(-5deg); background-size: auto !important; background: var(--tape-bg, repeating-linear-gradient(45deg,#ffcad9,#ffcad9 8px,#ffa3bd 8px,#ffa3bd 16px))"
          >
            <div
              class="w-full h-full"
              :style="{
                background: tapeColor === 'pink' ? 'repeating-linear-gradient(45deg,#ffcad9,#ffcad9 8px,#ffa3bd 8px,#ffa3bd 16px)' :
                           tapeColor === 'mint' ? 'repeating-linear-gradient(45deg,#c6ebc4,#c6ebc4 8px,#9fdc9c 8px,#9fdc9c 16px)' :
                           tapeColor === 'lemon' ? 'repeating-linear-gradient(-45deg,#fff7c2,#fff7c2 8px,#ffe44a 8px,#ffe44a 16px)' :
                           tapeColor === 'sky' ? 'repeating-linear-gradient(-45deg,#bae6fd,#bae6fd 8px,#7dd3fc 8px,#7dd3fc 16px)' :
                           'repeating-linear-gradient(45deg,#e9d5ff,#e9d5ff 8px,#d8b4fe 8px,#d8b4fe 16px)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                borderRadius: '2px'
              }"
            />
          </div>
          <div
            class="absolute -top-3 right-6 h-7 w-20 md:w-24 z-10 rounded-sm opacity-90"
            style="transform: rotate(4deg); box-shadow: 0 2px 6px rgba(0,0,0,0.1); border-radius: 2px"
          >
            <div
              class="w-full h-full"
              :style="{
                background: tapeColor === 'pink' ? 'repeating-linear-gradient(-45deg,#fff7c2,#fff7c2 8px,#ffe44a 8px,#ffe44a 16px)' :
                           tapeColor === 'mint' ? 'repeating-linear-gradient(-45deg,#e9d5ff,#e9d5ff 8px,#d8b4fe 8px,#d8b4fe 16px)' :
                           tapeColor === 'lemon' ? 'repeating-linear-gradient(45deg,#ffcad9,#ffcad9 8px,#ffa3bd 8px,#ffa3bd 16px)' :
                           tapeColor === 'sky' ? 'repeating-linear-gradient(45deg,#c6ebc4,#c6ebc4 8px,#9fdc9c 8px,#9fdc9c 16px)' :
                           'repeating-linear-gradient(-45deg,#bae6fd,#bae6fd 8px,#7dd3fc 8px,#7dd3fc 16px)',
                borderRadius: '2px'
              }"
            />
          </div>

          <!-- 主体 modal-card（已在 style.css 定义：粉边+虚线内框+弹跳动画） -->
          <div class="modal-card flex flex-col">
            <!-- 角落贴纸装饰 -->
            <span class="absolute -top-4 -left-3 text-2xl animate-float" style="animation-delay: 0.2s; z-index: 5">🌸</span>
            <span class="absolute -top-3 -right-4 text-xl animate-wiggle" style="z-index: 5">✨</span>

            <!-- 标题栏 -->
            <div
              v-if="title || !hideClose"
              class="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4 shrink-0 gap-2"
            >
              <!-- 贴纸标题 -->
              <div class="flex items-center gap-2 min-w-0">
                <span
                  v-if="title"
                  class="title-sticker !px-4 !py-1.5 !text-base md:!text-lg truncate"
                  :class="{
                    'title-sticker--pink': titleColor === 'pink',
                    'title-sticker--mint': titleColor === 'mint',
                    'title-sticker--lemon': titleColor === 'lemon',
                    'title-sticker--sky': titleColor === 'sky',
                    'title-sticker--grape': titleColor === 'grape',
                  }"
                >{{ title }}</span>
              </div>
              <!-- 关闭按钮：圆形贴纸 -->
              <button
                v-if="!hideClose"
                type="button"
                class="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-strawberry-100 border-2 border-strawberry-300 text-strawberry-600 hover:bg-strawberry-200 active:scale-90 transition-all shadow-sticker-sm flex items-center justify-center"
                title="关闭"
                @click="close"
              >
                <IconX :size="18" />
              </button>
            </div>

            <!-- 小花边分隔线 -->
            <div
              v-if="title || !hideClose"
              class="mx-5 md:mx-6 h-0.5 rounded-full"
              style="background: repeating-linear-gradient(90deg, #ffcad9 0 8px, transparent 8px 14px); opacity: 0.7"
            />

            <!-- 内容 -->
            <div class="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-5">
              <slot />
            </div>

            <!-- 底部操作区 -->
            <slot
              v-if="$slots.footer"
              name="footer"
            />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
/* 内容区入场动画由 modal-card 的 animate-pop 接管 */
</style>
