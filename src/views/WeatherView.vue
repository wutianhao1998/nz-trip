// ================================
// 页面视图：新西兰天气预报
// 实时天气 + 10日预报 + 出行建议
// ================================
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { WeatherData } from '@/types'
import { NZ_CITIES } from '@/utils/constants'
import { getCitiesWeather } from '@/services/weather'
import WeatherIcon from '@/components/common/WeatherIcon.vue'
import {
  IconCloud,
  IconRefresh,
  IconDroplets,
  IconWind,
  IconThermometer,
  IconSun,
  IconUmbrella,
  IconAlert,
  IconMapPin,
} from '@/components/icons'
import { formatDateCN, generateWeatherAdvice } from '@/utils'

const loading = ref(true)
const error = ref('')
const cityWeathers = ref<Record<string, WeatherData>>({})
const selectedCity = ref(NZ_CITIES[0].code) // 默认奥克兰
const refreshing = ref(false)

// 城市按钮颜色映射（不同颜色贴纸）
const cityColorMap: Record<string, { card: string; badge: string; tape: string }> = {
  'AKL': { card: 'trip-card--pink',  badge: 'sticker-badge--pink',  tape: 'washi-tape--pink' },
  'ZQN': { card: 'trip-card--grape', badge: 'sticker-badge--grape', tape: 'washi-tape--grape' },
  'CHC': { card: 'trip-card--lemon', badge: 'sticker-badge--lemon', tape: 'washi-tape--lemon' },
  'WAN': { card: 'trip-card--mint',  badge: 'sticker-badge--mint',  tape: 'washi-tape--mint' },
  'MTC': { card: 'trip-card--sky',   badge: 'sticker-badge--sky',   tape: 'washi-tape--sky' },
  'MIL': { card: 'trip-card--sky',   badge: 'sticker-badge--sky',   tape: 'washi-tape--sky' },
  'WLG': { card: 'trip-card--pink',  badge: 'sticker-badge--peach', tape: 'washi-tape--pink' },
  'ROT': { card: 'trip-card--lemon', badge: 'sticker-badge--lemon', tape: 'washi-tape--lemon' },
}

const currentCityWeather = computed(
  () => cityWeathers.value[selectedCity.value]
)

const current = computed(() => currentCityWeather.value?.current)
const forecast = computed(() => currentCityWeather.value?.forecast || [])

// 加载天气
const loadWeather = async (showRefreshing = false) => {
  if (showRefreshing) refreshing.value = true
  else loading.value = true
  error.value = ''
  try {
    const codes = NZ_CITIES.map((c) => c.code)
    const data = await getCitiesWeather(codes)
    // 至少要有一个城市的数据才算成功
    if (Object.keys(data).length === 0) {
      throw new Error('未获取到任何天气数据')
    }
    cityWeathers.value = data
  } catch (e) {
    error.value = (e as Error).message || '天气服务暂不可用'
    console.warn(e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => loadWeather())

// 根据当前天气重新计算建议（防止 API 没返回 advice 的情况）
const advices = computed(() => {
  const c = current.value
  if (!c) return []
  if (c.advice?.length) return c.advice
  return generateWeatherAdvice(c.temperature, c.rainProbability, c.uvIndex, c.windSpeed)
})

// UV等级文本
const uvLevel = (uv: number) => {
  if (uv <= 2) return { text: '低', color: 'sticker-badge--mint' }
  if (uv <= 5) return { text: '中等', color: 'sticker-badge--lemon' }
  if (uv <= 7) return { text: '高', color: 'sticker-badge--peach' }
  if (uv <= 10) return { text: '很高', color: 'sticker-badge--pink' }
  return { text: '极高', color: 'sticker-badge--grape' }
}
</script>

<template>
  <div class="space-y-5 md:space-y-6" id="weather-view">
    <!-- ===== 页面标题 ===== -->
    <div class="page-header">
      <div>
        <h1 class="page-title">🌤️ 天气预报手账</h1>
        <p class="page-subtitle font-hand">
          ~ 新西兰8城实时天气 · 10日预报 · 贴心出行建议 ~
        </p>
      </div>
      <button
        class="btn-secondary !py-2 !px-4 text-sm"
        :disabled="refreshing"
        @click="loadWeather(true)"
      >
        <IconRefresh :size="14" :class="refreshing ? 'animate-spin' : ''" />
        {{ refreshing ? '刷新中' : '刷新天气' }}
      </button>
    </div>

    <!-- ===== 错误提示 ===== -->
    <div
      v-if="error && Object.keys(cityWeathers).length === 0"
      class="trip-card trip-card--pink p-5 pt-7 relative"
    >
      <div class="washi-tape washi-tape--pink !w-24 !h-5" />
      <div class="flex items-start gap-3">
        <IconAlert :size="22" class="text-strawberry-500 mt-0.5 shrink-0 animate-wiggle" />
        <div>
          <p class="font-bold text-ink-800">天气服务暂不可用</p>
          <p class="font-hand text-sm text-ink-600 mt-0.5">{{ error }} · 可稍后手动刷新哦~</p>
        </div>
      </div>
    </div>

    <!-- ===== 城市选择：不同颜色贴纸按钮 ===== -->
    <div class="trip-card trip-card--sky p-4 md:p-5 pt-7 relative">
      <div class="washi-tape washi-tape--sky" />
      <div class="font-hand text-xs text-ink-500 mb-3 flex items-center gap-1">
        <IconMapPin :size="12" /> 选择目的地查看详细天气~
      </div>
      <div class="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
        <button
          v-for="(city, cIdx) in NZ_CITIES"
          :key="city.code"
          type="button"
          class="relative p-2.5 md:p-3 rounded-2xl transition-all text-left sticker-hover border-2 min-h-[80px]"
          :class="selectedCity === city.code
            ? `${cityColorMap[city.code].card.replace('trip-card--', 'bg-gradient-to-br from-')} text-white shadow-sticker border-transparent border-white`
            : 'bg-white border-dashed border-ink-200/50 text-ink-600 hover:border-strawberry-200'"
          :style="{ transform: `rotate(${cIdx % 3 === 0 ? '-0.6' : cIdx % 3 === 1 ? '0.8' : '-0.3'}deg)` }"
          @click="selectedCity = city.code"
        >
          <div class="font-bold text-xs md:text-sm truncate" :class="selectedCity === city.code ? 'text-white' : ''">
            {{ city.name }}
          </div>
          <div
            class="text-[9px] md:text-[10px] mt-0.5 opacity-75 truncate"
          >{{ city.region }}</div>
          <!-- 温度小数字 -->
          <div
            v-if="cityWeathers[city.code]?.current"
            class="font-sticker text-base md:text-lg font-extrabold mt-1.5"
            :class="selectedCity === city.code ? 'text-white' : 'text-ink-800'"
          >
            {{ cityWeathers[city.code].current.temperature.toFixed(0) }}°
          </div>
          <!-- 天气小图标 -->
          <div
            v-if="cityWeathers[city.code]?.current && !loading"
            class="absolute -top-2 -right-2 animate-float"
            style="animation-delay: `${cIdx * 0.15}s`"
          >
            <WeatherIcon :type="cityWeathers[city.code].current.icon" :size="34" />
          </div>
          <!-- 选中角标 -->
          <div
            v-if="selectedCity === city.code"
            class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sticker-sm border-2 border-white"
          >
            <span class="text-xs">✨</span>
          </div>
        </button>
      </div>
    </div>

    <!-- ===== 加载骨架 ===== -->
    <div v-if="loading && !current" class="trip-card trip-card--sky p-6 md:p-8 space-y-4 pt-8 relative">
      <div class="washi-tape washi-tape--sky" />
      <div class="flex gap-4 md:gap-6">
        <div class="skeleton w-24 h-24 md:w-32 md:h-32 rounded-2xl" />
        <div class="flex-1 space-y-3">
          <div class="skeleton h-10 w-40 rounded-xl" />
          <div class="skeleton h-5 w-60 rounded-lg" />
          <div class="skeleton h-5 w-48 rounded-lg" />
          <div class="grid grid-cols-4 gap-2 pt-2">
            <div class="skeleton h-16 rounded-xl" v-for="i in 4" :key="i" />
          </div>
        </div>
      </div>
      <div class="skeleton h-36 rounded-2xl" />
    </div>

    <!-- ===== 当前天气详情：天空蓝渐变 + 大emoji浮动 ===== -->
    <template v-else-if="current">
      <div
        class="trip-card trip-card--sky p-5 md:p-8 pt-8 relative overflow-hidden"
        :class="{
          '!bg-gradient-to-br from-lemon-50 via-peach-50 to-strawberry-50': current.temperature >= 22,
          '!bg-gradient-to-br from-skyblue-50 via-grape-50 to-primary-50': current.temperature < 22 && current.temperature >= 12,
          '!bg-gradient-to-br from-grape-50 via-skyblue-50 to-primary-50': current.temperature < 12,
        }"
      >
        <div class="washi-tape washi-tape--sky" />
        <!-- 角落装饰小花 -->
        <span class="doodle-corner top-3 right-6 text-xl animate-sparkle">🌈</span>
        <span class="doodle-corner bottom-4 left-6 text-lg opacity-60">☁️</span>

        <!-- 大背景装饰天气图 -->
        <div class="absolute -right-10 -top-10 opacity-20 pointer-events-none">
          <WeatherIcon :type="current.icon" :size="220" />
        </div>

        <div class="relative flex flex-col md:flex-row gap-5 md:gap-8 items-start md:items-center">
          <!-- 图标 + 大温度 -->
          <div class="flex items-center gap-4 md:gap-6">
            <div class="shrink-0 animate-float">
              <WeatherIcon :type="current.icon" :size="110" />
            </div>
            <div>
              <div class="flex items-start">
                <!-- 温度大数字 -->
                <span
                  class="font-sticker text-6xl md:text-7xl font-extrabold text-ink-800 leading-none"
                  style="text-shadow: 3px 3px 0 rgba(186,230,253,0.6), 6px 6px 0 rgba(186,230,253,0.3)"
                >
                  {{ current.temperature.toFixed(0) }}
                </span>
                <span class="text-2xl md:text-3xl text-ink-500 mt-2 font-hand">°C</span>
              </div>
              <div class="mt-1 font-hand text-sm md:text-base text-ink-600">
                体感 {{ current.feelsLike.toFixed(1) }}°C · {{ current.description }}
              </div>
              <div class="mt-0.5 text-[11px] text-ink-400 font-hand">
                更新于 {{ new Date(current.updatedAt).toLocaleString('zh-CN') }}
              </div>
            </div>
          </div>

          <!-- 详细指标贴纸 -->
          <div class="flex-1 w-full grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
            <!-- 体感 -->
            <div class="sticky-note sticky-note--mint !p-3 text-center">
              <div class="flex items-center justify-center gap-1 text-ink-500 text-[10px] md:text-xs font-hand mb-1">
                <IconThermometer :size="12" /> 体感
              </div>
              <div class="font-sticker font-extrabold text-ink-800 text-sm md:text-base">
                {{ current.feelsLike.toFixed(0) }}°
              </div>
            </div>
            <!-- 湿度 -->
            <div class="sticky-note sticky-note--blue !p-3 text-center">
              <div class="flex items-center justify-center gap-1 text-ink-500 text-[10px] md:text-xs font-hand mb-1">
                <IconDroplets :size="12" /> 湿度
              </div>
              <div class="font-sticker font-extrabold text-ink-800 text-sm md:text-base">
                {{ current.humidity }}%
              </div>
            </div>
            <!-- 风力 -->
            <div class="sticky-note sticky-note--pink !p-3 text-center">
              <div class="flex items-center justify-center gap-1 text-ink-500 text-[10px] md:text-xs font-hand mb-1">
                <IconWind :size="12" /> 风力
              </div>
              <div class="font-sticker font-extrabold text-ink-800 text-sm md:text-base">
                {{ current.windSpeed.toFixed(0) }}<span class="text-[10px] font-normal text-ink-500 font-sans">km/h</span>
              </div>
              <div class="text-[9px] text-ink-500 font-hand mt-0.5">{{ current.windDirection }}</div>
            </div>
            <!-- 降水 -->
            <div class="sticky-note sticky-note--blue !p-3 text-center">
              <div class="flex items-center justify-center gap-1 text-ink-500 text-[10px] md:text-xs font-hand mb-1">
                <IconUmbrella :size="12" /> 降水
              </div>
              <div
                class="font-sticker font-extrabold text-sm md:text-base"
                :class="current.rainProbability >= 60 ? 'text-skyblue-600' : 'text-ink-800'"
              >
                {{ current.rainProbability }}%
              </div>
            </div>
            <!-- UV -->
            <div class="sticky-note sticky-note--lemon !p-3 text-center">
              <div class="flex items-center justify-center gap-1 text-ink-500 text-[10px] md:text-xs font-hand mb-1">
                <IconSun :size="12" /> UV
              </div>
              <div class="font-sticker font-extrabold text-ink-800 text-sm md:text-base">
                {{ current.uvIndex }}
              </div>
              <div class="mt-0.5">
                <span
                  :class="['sticker-badge !px-1.5 !py-0.5 !text-[8px] font-sticker', uvLevel(current.uvIndex).color]"
                >
                  {{ uvLevel(current.uvIndex).text }}
                </span>
              </div>
            </div>
            <!-- 城市 -->
            <div class="sticky-note sticky-note--grape !p-3 text-center col-span-2 md:col-span-1">
              <div class="flex items-center justify-center gap-1 text-ink-500 text-[10px] md:text-xs font-hand mb-1">
                <IconMapPin :size="12" /> 城市
              </div>
              <div class="font-sticker font-extrabold text-ink-800 text-sm truncate">
                {{ current.location }}
              </div>
              <div class="text-[9px] text-ink-500 font-hand truncate mt-0.5">
                {{ NZ_CITIES.find((c) => c.code === selectedCity)?.description }}
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 出行建议：葡萄紫便签 ===== -->
        <div class="relative mt-6 pt-5 border-t-2 border-dashed border-skyblue-200/70">
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <span class="title-sticker title-sticker--grape text-sm md:text-base">
              💡 出行建议
            </span>
            <span
              v-if="advices.some((a) => a.includes('雨') || a.includes('防晒') || a.includes('风'))"
              class="sticker-badge sticker-badge--lemon !text-[10px] font-hand animate-wiggle"
            >要注意哦~</span>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div
              v-for="(adv, i) in advices"
              :key="i"
              class="sticky-note sticky-note--grape flex items-start gap-2"
              :style="{ transform: `rotate(${i % 2 === 0 ? '-0.8' : '0.6'}deg)` }"
            >
              <span class="text-lg shrink-0 mt-0.5">
                {{
                  adv.includes('雨') ? '☔' :
                  adv.includes('防晒') ? '🧴' :
                  adv.includes('风') ? '💨' :
                  adv.includes('保暖') || adv.includes('穿衣') ? '🧥' :
                  adv.includes('墨镜') ? '🕶️' :
                  adv.includes('水') ? '💧' :
                  '✨'
                }}
              </span>
              <span class="font-hand text-sm text-ink-700 leading-relaxed flex-1">{{ adv }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 10 日预报 ===== -->
      <div class="trip-card trip-card--mint p-4 md:p-6 pt-8 relative">
        <div class="washi-tape washi-tape--mint" />
        <span class="doodle-corner top-3 right-4 text-lg animate-sparkle">📆</span>

        <div class="flex items-center justify-between mb-5 flex-wrap gap-2">
          <span class="title-sticker title-sticker--mint text-base md:text-lg">
            📆 未来 10 日天气预报
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
          <div
            v-for="(day, i) in forecast"
            :key="day.date"
            class="p-3 md:p-3.5 rounded-2xl transition-all text-center relative group hover:-translate-y-1"
            :class="i === 0
              ? 'bg-gradient-to-br from-strawberry-50 to-lemon-50 border-2 border-strawberry-200 shadow-sticker-sm'
              : 'bg-white/80 border-2 border-dashed border-primary-100 hover:border-primary-300 hover:bg-primary-50/60'"
            :style="{ transform: `rotate(${i % 2 === 0 ? '-0.5' : '0.5'}deg)` }"
          >
            <!-- 今日贴纸 -->
            <div v-if="i === 0" class="absolute -top-2 left-1/2 -translate-x-1/2">
              <span class="sticker-badge sticker-badge--pink !px-2 !py-0.5 !text-[9px] font-sticker">今日</span>
            </div>

            <div class="font-hand text-[10px] md:text-xs text-ink-600 font-bold">
              {{ i === 0 ? '今天' : formatDateCN(day.date).split(' ')[0] }}
            </div>
            <div class="text-[9px] md:text-[10px] text-ink-400 font-hand mt-0.5">
              {{ formatDateCN(day.date).split(' ')[1] }}
            </div>

            <div class="my-2 flex justify-center animate-float" style="animation-delay: `${i * 0.1}s`">
              <WeatherIcon :type="day.icon" :size="38" />
            </div>

            <div class="text-[9px] md:text-[10px] text-ink-500 h-8 leading-tight overflow-hidden font-hand">
              {{ day.description }}
            </div>

            <div class="mt-1.5 flex items-center justify-center gap-0.5 font-sticker font-extrabold">
              <span class="text-strawberry-500 text-sm">{{ day.tempHigh.toFixed(0) }}°</span>
              <span class="text-ink-300 text-[10px] mx-0.5">/</span>
              <span class="text-skyblue-600 text-sm">{{ day.tempLow.toFixed(0) }}°</span>
            </div>

            <!-- 降水概率贴纸 -->
            <div
              class="mt-1 flex items-center justify-center gap-0.5"
            >
              <span
                :class="[
                  'sticker-badge !px-1.5 !py-0.5 !text-[8px] md:!text-[9px] font-sticker',
                  day.rainProbability >= 50 ? 'sticker-badge--sky' : '!bg-ink-50 !text-ink-400 !border-ink-200'
                ]"
              >
                <IconDroplets :size="8" class="inline -mt-0.5" />
                {{ day.rainProbability }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 目的地简介：特色便签 ===== -->
      <div class="trip-card trip-card--lemon p-4 md:p-6 pt-8 relative">
        <div class="washi-tape washi-tape--lemon" />
        <span class="doodle-corner top-3 right-4 text-lg">📍</span>

        <div class="flex items-center gap-2 mb-4">
          <span class="title-sticker title-sticker--lemon text-base md:text-lg">
            📍 目的地简介
          </span>
        </div>

        <div class="sticky-note sticky-note--pink">
          <div class="flex items-start gap-3 md:gap-4">
            <div
              class="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white shadow-sticker flex items-center justify-center text-3xl md:text-4xl shrink-0 border-2 border-white animate-float"
            >
              {{
                selectedCity === 'AKL' ? '🏙️' :
                selectedCity === 'ZQN' ? '🏔️' :
                selectedCity === 'CHC' ? '🌸' :
                selectedCity === 'WAN' ? '🏞️' :
                selectedCity === 'MTC' ? '⛰️' :
                selectedCity === 'MIL' ? '🌊' :
                selectedCity === 'WLG' ? '💨' :
                selectedCity === 'ROT' ? '♨️' : '🌆'
              }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-sticker font-extrabold text-ink-800 text-lg md:text-xl">
                  {{ NZ_CITIES.find((c) => c.code === selectedCity)?.name }}
                </span>
                <span class="font-hand text-sm text-ink-500">
                  {{ NZ_CITIES.find((c) => c.code === selectedCity)?.enName }}
                </span>
                <span
                  class="sticker-badge sticker-badge--sky !px-2 !py-0.5 !text-[10px] font-sticker"
                >
                  {{ NZ_CITIES.find((c) => c.code === selectedCity)?.region }}
                </span>
              </div>
              <div class="mt-2 font-hand text-sm md:text-base text-ink-700 leading-relaxed">
                {{ NZ_CITIES.find((c) => c.code === selectedCity)?.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
