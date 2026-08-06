// ================================
// 页面视图：同伴留言板（简易聊天）
// ================================
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useTripStore } from '@/stores/trip'
import type { ChatMessage } from '@/types'
import {
  IconChat,
  IconSend,
  IconUsers,
} from '@/components/icons'
import { formatRelativeTime, generateAvatarColor } from '@/utils'

const store = useTripStore()
const inputText = ref('')
const listRef = ref<HTMLElement | null>(null)

// 按分钟分组（可选，这里简化为时间分隔）
const isNewTime = (idx: number): boolean => {
  if (idx === 0) return true
  const prev = store.messages[idx - 1]
  const curr = store.messages[idx]
  return (curr.createdAt - prev.createdAt) > 5 * 60 * 1000 // 超过5分钟显示时间
}

const send = () => {
  if (!inputText.value.trim() || !store.canEdit) return
  store.sendMessage(inputText.value)
  inputText.value = ''
  scrollBottom()
}

const scrollBottom = async () => {
  await nextTick()
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

watch(
  () => store.messages.length,
  () => scrollBottom()
)

onMounted(() => scrollBottom())

// 快捷短语
const quickPhrases = [
  '行程我确认了，没问题👌',
  '大家还有什么要补充的吗？',
  '记得准备好 XXX 哦',
  '这个天气行程要调整吗？',
  '订单都搞定了吗？',
  '出发倒计时！🎉',
]

// 消息样式：自己靠右
const isMine = (msg: ChatMessage) =>
  msg.senderId === store.currentUser?.id ||
  (store.currentUser && msg.senderName === store.currentUser.nickname)

// 气泡颜色分配（6种颜色循环使用）
const bubbleColors = [
  { bg: 'bg-gradient-to-br from-strawberry-100 to-strawberry-200',    border: 'border-strawberry-300',   text: 'text-ink-800', name: 'strawberry' },
  { bg: 'bg-gradient-to-br from-primary-100 to-primary-200',          border: 'border-primary-300',      text: 'text-ink-800', name: 'mint' },
  { bg: 'bg-gradient-to-br from-skyblue-100 to-skyblue-200',          border: 'border-skyblue-300',      text: 'text-ink-800', name: 'sky' },
  { bg: 'bg-gradient-to-br from-grape-100 to-grape-200',              border: 'border-grape-300',        text: 'text-ink-800', name: 'grape' },
  { bg: 'bg-gradient-to-br from-lemon-100 to-lemon-200',              border: 'border-lemon-300',        text: 'text-ink-800', name: 'lemon' },
  { bg: 'bg-gradient-to-br from-peach-100 to-peach-200',              border: 'border-peach-300',        text: 'text-ink-800', name: 'peach' },
]
// 根据发送者名称稳定分配颜色
const getBubbleColor = (msg: ChatMessage) => {
  if (isMine(msg)) return bubbleColors[0] // 自己固定草莓粉（自己的消息后面会改白色）
  let hash = 0
  for (let i = 0; i < msg.senderName.length; i++) {
    hash = msg.senderName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % bubbleColors.length
  return bubbleColors[idx]
}

// 获取头像背景颜色（如果没有 senderColor）
const getAvatarBg = (msg: ChatMessage): string => {
  if (msg.senderColor) return msg.senderColor
  return generateAvatarColor()
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-180px)] min-h-[500px]" id="chat-view">
    <!-- ===== 页面标题 ===== -->
    <div class="page-header !mb-3 md:!mb-4">
      <div>
        <h1 class="page-title">💬 同伴留言板</h1>
        <p class="page-subtitle font-hand">
          ~ 实时同步讨论 · 共 {{ store.messages.length }} 条暖心留言 ~
        </p>
      </div>
    </div>

    <!-- ===== 顶部统计 ===== -->
    <div class="trip-card trip-card--grape p-4 pt-7 mb-3 md:mb-4 shrink-0 relative">
      <div class="washi-tape washi-tape--grape" />
      <span class="doodle-corner top-3 right-4 text-lg animate-sparkle">💫</span>

      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="title-sticker title-sticker--grape text-sm md:text-base">
            💬 同伴留言板
          </span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="sticker-badge sticker-badge--mint !text-[11px] font-hand"
          >
            <span
              class="w-2 h-2 rounded-full bg-primary-500 pulse-dot mr-1"
            />
            {{ store.currentUser?.nickname }} 在线
          </span>
          <!-- 颜色指示 -->
          <span
            class="sticker-badge sticker-badge--pink !text-[11px] font-hand"
          >
            <span
              class="w-4 h-4 rounded-full shrink-0 mr-1 border-2 border-white shadow-sticker-sm"
              :style="{ background: store.currentUser?.color || generateAvatarColor() }"
            />
            你的标识色
          </span>
          <span class="sticker-badge sticker-badge--lemon !text-[11px] font-hand">
            <IconUsers :size="12" class="mr-0.5" />
            {{ store.messages.length }} 条
          </span>
        </div>
      </div>
    </div>

    <!-- ===== 消息列表 ===== -->
    <div
      ref="listRef"
      class="trip-card trip-card--sky flex-1 overflow-y-auto p-4 md:p-5 space-y-3 mb-3 md:mb-4 pt-7 relative"
    >
      <div class="washi-tape washi-tape--sky !w-28" />

      <div
        v-if="store.messages.length === 0"
        class="h-full flex flex-col items-center justify-center text-center py-10"
      >
        <div class="sticky-note sticky-note--mint max-w-xs py-6">
          <div class="text-5xl mb-3 opacity-80">💬</div>
          <p class="font-hand text-ink-700 text-sm">还没有任何留言哦~</p>
          <p class="font-hand text-ink-500 text-xs mt-1">说点什么，开启与同伴的讨论吧！</p>
        </div>
      </div>

      <template v-else>
        <template v-for="(msg, idx) in store.messages" :key="msg.id">
          <!-- 时间分隔：便签风 -->
          <div
            v-if="isNewTime(idx)"
            class="flex justify-center my-2"
          >
            <span class="sticker-badge sticker-badge--lemon !px-3 !py-0.5 !text-[10px] font-hand">
              🕐 {{ new Date(msg.createdAt).toLocaleString('zh-CN') }}
            </span>
          </div>

          <!-- 单条消息 -->
          <div
            class="flex gap-2.5 md:gap-3"
            :class="isMine(msg) ? 'flex-row-reverse' : 'flex-row'"
          >
            <!-- 头像：圆形彩色贴纸 -->
            <div class="relative shrink-0">
              <div
                class="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-sticker-sm border-[3px] border-white"
                :style="{ background: getAvatarBg(msg) }"
              >
                {{ msg.senderName.slice(0, 1) }}
              </div>
              <!-- 贴纸角标 -->
              <span
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center text-[8px] shadow-sticker-sm border border-white"
              >
                {{
                  getBubbleColor(msg).name === 'strawberry' ? '🍓' :
                  getBubbleColor(msg).name === 'mint' ? '🌿' :
                  getBubbleColor(msg).name === 'sky' ? '☁️' :
                  getBubbleColor(msg).name === 'grape' ? '🍇' :
                  getBubbleColor(msg).name === 'lemon' ? '🍋' :
                  '🍑'
                }}
              </span>
            </div>

            <!-- 内容气泡贴纸 -->
            <div
              class="max-w-[75%] md:max-w-[65%]"
              :class="isMine(msg) ? 'text-right' : 'text-left'"
            >
              <!-- 昵称手写体 + 时间 -->
              <div
                class="text-[10px] md:text-xs text-ink-500 mb-1 flex items-center gap-1 font-hand"
                :class="isMine(msg) ? 'justify-end' : ''"
              >
                <span class="font-bold">{{ msg.senderName }}</span>
                <span>·</span>
                <span>{{ formatRelativeTime(msg.createdAt) }}</span>
              </div>

              <!-- 气泡：贴纸风 + 小尾巴 -->
              <div class="relative inline-block">
                <!-- 小尾巴 -->
                <div
                  class="absolute top-3 w-4 h-4 border-l-[10px] border-y-[8px] border-y-transparent"
                  :class="[
                    isMine(msg)
                      ? '-right-2 border-l-current rotate-180'
                      : '-left-2 border-l-current',
                    getBubbleColor(msg).border.replace('border-', 'text-')
                  ]"
                  :style="{ color: 'transparent', borderLeftColor: getBubbleColor(msg).name === 'strawberry' && isMine(msg) ? '#ff6f96' : undefined }"
                />
                <div
                  class="relative inline-block px-4 py-2.5 md:px-5 md:py-3 rounded-3xl text-sm md:text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sticker-sm border-[2.5px] transition-transform hover:scale-[1.01]"
                  :class="[
                    isMine(msg)
                      ? 'bg-gradient-to-br from-strawberry-400 to-strawberry-500 border-strawberry-400 text-white rounded-tr-md'
                      : `${getBubbleColor(msg).bg} ${getBubbleColor(msg).border} ${getBubbleColor(msg).text} rounded-tl-md`
                  ]"
                  :style="isMine(msg) ? {} : { fontFamily: '&quot;Mali&quot;, &quot;ZCOOL KuaiLe&quot;, &quot;PingFang SC&quot;, cursive, sans-serif' }"
                >
                  <!-- 贴纸角落装饰 -->
                  <span
                    v-if="idx % 4 === 0"
                    class="absolute -top-1.5 -left-1 text-xs"
                  >✨</span>
                  <span
                    v-else-if="idx % 4 === 1"
                    class="absolute -top-1.5 -right-1 text-xs"
                  >🌟</span>
                  <span
                    v-else-if="idx % 4 === 2"
                    class="absolute -bottom-1.5 -left-1 text-xs"
                  >💖</span>
                  {{ msg.content }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- ===== 快捷短语：贴纸胶囊 ===== -->
    <div
      v-if="store.canEdit && store.messages.length < 8"
      class="mb-3 shrink-0"
    >
      <div class="font-hand text-[11px] text-ink-500 mb-2 flex items-center gap-1">
        <span>💡</span> 快捷消息（点击填入哦~）
      </div>
      <div class="flex flex-wrap gap-1.5 md:gap-2">
        <button
          v-for="(p, pIdx) in quickPhrases"
          :key="p"
          type="button"
          class="sticker-badge transition-all cursor-pointer !text-xs"
          :class="[
            pIdx % 6 === 0 ? 'sticker-badge--pink' :
            pIdx % 6 === 1 ? 'sticker-badge--mint' :
            pIdx % 6 === 2 ? 'sticker-badge--sky' :
            pIdx % 6 === 3 ? 'sticker-badge--grape' :
            pIdx % 6 === 4 ? 'sticker-badge--lemon' :
            'sticker-badge--peach'
          ]"
          :style="{ transform: `rotate(${pIdx % 2 === 0 ? '-0.6' : '0.5'}deg)` }"
          @click="inputText = p"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- ===== 输入框：胶带贴纸风格 ===== -->
    <div class="trip-card trip-card--pink p-3 md:p-4 pt-6 shrink-0 relative">
      <div class="washi-tape washi-tape--pink" />
      <span class="doodle-corner top-3 right-4 text-lg animate-sparkle">💌</span>

      <div class="flex gap-2 md:gap-3 items-end">
        <textarea
          v-model="inputText"
          rows="1"
          class="textarea-base flex-1 !py-2.5 md:!py-3 text-sm md:text-base resize-none max-h-32 !bg-white/80"
          :placeholder="store.canEdit ? '📝 输入留言，回车发送 / Shift+回车换行...' : '🔒 只读模式下无法发送消息哦~'"
          :disabled="!store.canEdit"
          @keydown.enter.exact.prevent="send"
        />
        <button
          class="btn-primary !px-3 md:!px-4 py-2.5 md:py-3 aspect-square md:aspect-auto shrink-0"
          :disabled="!inputText.trim() || !store.canEdit"
          title="发送消息~"
          @click="send"
        >
          <IconSend :size="18" class="md:-ml-0.5 md:mr-1" />
          <span class="hidden md:inline font-hand">发送</span>
          <span class="absolute -top-1 -right-1 text-sm animate-sparkle">📨</span>
        </button>
      </div>
    </div>
  </div>
</template>
