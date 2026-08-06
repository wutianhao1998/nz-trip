// ================================
// 通用组件：SVG 天气图标（带颜色渐变）
// ================================
<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherIconType } from '@/types'

interface Props {
  type?: WeatherIconType | undefined
  size?: number
}
const props = withDefaults(defineProps<Props>(), {
  type: undefined,
  size: 48,
})

// 按图标类型返回内联 SVG
const svgHtml = computed(() => {
  const s = props.size
  const t: WeatherIconType = props.type ?? 'partly-cloudy'
  switch (t) {
    case 'sunny':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><radialGradient id="sg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FDE047"/><stop offset="100%" stop-color="#F59E0B"/></radialGradient></defs>
        <circle cx="24" cy="24" r="9" fill="url(#sg1)"/>
        <g stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round">
          <line x1="24" y1="5" x2="24" y2="11"/>
          <line x1="24" y1="37" x2="24" y2="43"/>
          <line x1="5" y1="24" x2="11" y2="24"/>
          <line x1="37" y1="24" x2="43" y2="24"/>
          <line x1="10.5" y1="10.5" x2="14.5" y2="14.5"/>
          <line x1="33.5" y1="33.5" x2="37.5" y2="37.5"/>
          <line x1="37.5" y1="10.5" x2="33.5" y2="14.5"/>
          <line x1="14.5" y1="33.5" x2="10.5" y2="37.5"/>
        </g></svg>`
    case 'partly-cloudy':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><linearGradient id="pc1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#BAE6FD"/><stop offset="100%" stop-color="#7DD3FC"/></linearGradient>
        <radialGradient id="pc2" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#FDE047"/><stop offset="100%" stop-color="#F59E0B"/></radialGradient></defs>
        <circle cx="16" cy="16" r="7" fill="url(#pc2)"/>
        <path d="M38 32H15a7 7 0 0 1 1-14 8 9 9 0 0 1 17-2 6 6 0 0 1 5 10z" fill="url(#pc1)" stroke="#38BDF8" stroke-width="1.2"/></svg>`
    case 'cloudy':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><linearGradient id="cy1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E2E8F0"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient></defs>
        <path d="M40 33H13a8 8 0 0 1 .5-15.9A11 11 0 0 1 34 17a7.5 7.5 0 0 1 6 16z" fill="url(#cy1)" stroke="#64748B" stroke-width="1.2"/></svg>`
    case 'rainy':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><linearGradient id="rn1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#94A3B8"/><stop offset="100%" stop-color="#64748B"/></linearGradient>
        <linearGradient id="rn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs>
        <path d="M40 28H13a8 8 0 0 1 .5-15.9A11 11 0 0 1 34 12a7.5 7.5 0 0 1 6 16z" fill="url(#rn1)"/>
        <g fill="url(#rn2)">
          <path d="M17 31l-3 7a1.5 1.5 0 1 0 2.7 1.2l3-7a1.5 1.5 0 0 0-2.7-1.2zM26 31l-3 7a1.5 1.5 0 1 0 2.7 1.2l3-7a1.5 1.5 0 0 0-2.7-1.2zM35 31l-3 7a1.5 1.5 0 1 0 2.7 1.2l3-7a1.5 1.5 0 0 0-2.7-1.2z"/>
        </g></svg>`
    case 'storm':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><linearGradient id="st1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#64748B"/><stop offset="100%" stop-color="#475569"/></linearGradient></defs>
        <path d="M40 28H13a8 8 0 0 1 .5-15.9A11 11 0 0 1 34 12a7.5 7.5 0 0 1 6 16z" fill="url(#st1)"/>
        <path d="M24 29l-5 9h4l-2 8 9-11h-4l3-6z" fill="#FACC15" stroke="#EAB308" stroke-width="1"/></svg>`
    case 'snow':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><linearGradient id="sn1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#CBD5E1"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient></defs>
        <path d="M40 28H13a8 8 0 0 1 .5-15.9A11 11 0 0 1 34 12a7.5 7.5 0 0 1 6 16z" fill="url(#sn1)"/>
        <g fill="#60A5FA" stroke="#3B82F6" stroke-width="0.5">
          <circle cx="16" cy="36" r="1.6"/><circle cx="24" cy="38" r="1.6"/><circle cx="32" cy="36" r="1.6"/>
          <circle cx="20" cy="43" r="1.6"/><circle cx="28" cy="43" r="1.6"/>
        </g></svg>`
    case 'fog':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E2E8F0"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient></defs>
        <path d="M40 24H13a8 8 0 0 1 .5-15.9A11 11 0 0 1 34 8a7.5 7.5 0 0 1 6 16z" fill="url(#fg1)"/>
        <g stroke="#94A3B8" stroke-width="3" stroke-linecap="round">
          <line x1="8" y1="32" x2="40" y2="32"/>
          <line x1="6" y1="38" x2="42" y2="38"/>
          <line x1="10" y1="44" x2="38" y2="44"/>
        </g></svg>`
    case 'windy':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" fill="none">
        <g stroke="#0EA5E9" stroke-width="2.8" stroke-linecap="round" fill="none">
          <path d="M6 14h26a4 4 0 1 0-3-6.5M6 24h32a4.5 4.5 0 1 1-3.5 7M6 34h22a4 4 0 1 1-3 6.5"/>
        </g></svg>`
    default:
      return ''
  }
})
</script>

<template>
  <div class="inline-flex items-center justify-center" v-html="svgHtml" />
</template>
