// ================================
// 内联 SVG 图标组件库（零依赖，使用 h() 函数渲染，不用 JSX）
// 所有图标基于 Lucide/Feather 风格
// ================================
import { h, defineComponent, type PropType } from 'vue'

// 图标通用 props 接口
export interface IconProps {
  size?: number | string
  strokeWidth?: number
  className?: string
}

/** 创建 SVG 图标工厂 */
const makeIcon = (svgPaths: string, viewBox = '0 0 24 24') => {
  return defineComponent({
    name: 'Icon',
    props: {
      size: { type: [Number, String] as PropType<number | string>, default: 20 },
      strokeWidth: { type: Number as PropType<number>, default: 2 },
      className: { type: String as PropType<string>, default: '' },
    },
    setup(props) {
      return () =>
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox,
          width: props.size,
          height: props.size,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': props.strokeWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          class: props.className,
          // 使用 innerHTML 注入 paths，避免大量 h() 嵌套
          innerHTML: svgPaths,
        })
    },
  })
}

// 常用图标定义（每条 path 都是 SVG 内部 HTML）
export const IconHome = makeIcon(
  '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z"/>'
)
export const IconCalendar = makeIcon(
  '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
)
export const IconTicket = makeIcon(
  '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7z"/><path d="M13 5v14"/>'
)
export const IconCloud = makeIcon(
  '<path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.8 6 6 0 0 0-11.6 2A4 4 0 0 0 5 19h12.5z"/>'
)
export const IconInfo = makeIcon(
  '<circle cx="12" cy="12" r="10"/><path d="M12 8h.01M11 12h1v4h1"/>'
)
export const IconChat = makeIcon(
  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
)
export const IconPlus = makeIcon('<path d="M12 5v14M5 12h14"/>')
export const IconMinus = makeIcon('<path d="M5 12h14"/>')
export const IconEdit = makeIcon(
  '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'
)
export const IconTrash = makeIcon(
  '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>'
)
export const IconX = makeIcon('<path d="M18 6 6 18M6 6l12 12"/>')
export const IconCheck = makeIcon('<path d="M20 6 9 17l-5-5"/>')
export const IconChevronLeft = makeIcon('<path d="m15 18-6-6 6-6"/>')
export const IconChevronRight = makeIcon('<path d="m9 18 6-6-6-6"/>')
export const IconChevronDown = makeIcon('<path d="m6 9 6 6 6-6"/>')
export const IconChevronUp = makeIcon('<path d="m18 15-6-6-6 6"/>')
export const IconSun = makeIcon(
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
)
export const IconMoon = makeIcon(
  '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
)
export const IconCloudRain = makeIcon(
  '<path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.8 6 6 0 0 0-11.6 2A4 4 0 0 0 5 19h12.5z"/><path d="M8 19v2M12 19v2M16 19v2"/>'
)
export const IconCloudSnow = makeIcon(
  '<path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.8 6 6 0 0 0-11.6 2A4 4 0 0 0 5 19h12.5z"/>' +
    '<circle cx="8" cy="36" r="1.6"/>'
)
export const IconCloudSun = makeIcon(
  '<circle cx="7" cy="8" r="3"/><path d="M4.5 9.5L3 8.5M9.5 4.5L8.5 3M11.5 9.5L13 8.5M9.5 13L8.5 14.5"/>' +
    '<path d="M18 17a3.5 3.5 0 0 0 .7-7 5 5 0 0 0-9.4 1.5"/>'
)
export const IconUmbrella = makeIcon(
  '<path d="M12 2v20M12 2a10 10 0 0 0-10 10h20A10 10 0 0 0 12 2zM12 13a3 3 0 0 0-3 3"/>'
)
export const IconWind = makeIcon(
  '<path d="M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M15 14a2.5 2.5 0 1 1 2 4H2"/>'
)
export const IconDroplets = makeIcon(
  '<path d="M7 16.3a4 4 0 1 0 0-6.6 4 4 0 0 0 0 6.6zM17 12.3a5 5 0 1 0 0-8.6 5 5 0 0 0 0 8.6z"/>'
)
export const IconThermometer = makeIcon(
  '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><circle cx="12" cy="18" r="1.5"/>'
)
export const IconMapPin = makeIcon(
  '<path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'
)
export const IconCar = makeIcon(
  '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>' +
    '<circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'
)
export const IconPlane = makeIcon(
  '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'
)
export const IconUtensils = makeIcon(
  '<path d="M3 2v7c0 1.1.9 2 2 2h4v-2H5V2H3zM21 2v7c0 1.1-.9 2-2 2h-4v-2h3V2h3zM11 22V8l-2 2V22z"/>'
)
export const IconClock = makeIcon(
  '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
)
export const IconTag = makeIcon(
  '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>' +
    '<circle cx="7" cy="7" r="1.5"/>'
)
export const IconUser = makeIcon(
  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
)
export const IconUsers = makeIcon(
  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>' +
    '<circle cx="9" cy="7" r="4"/>' +
    '<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
)
export const IconWifi = makeIcon(
  '<path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/>' +
    '<line x1="12" y1="20" x2="12.01" y2="20"/>'
)
export const IconWifiOff = makeIcon(
  '<path d="M1 1l22 22"/>' +
    '<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>' +
    '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>' +
    '<path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>' +
    '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>' +
    '<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>' +
    '<line x1="12" y1="20" x2="12.01" y2="20"/>'
)
export const IconDownload = makeIcon(
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'
)
export const IconShare = makeIcon(
  '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
    '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>' +
    '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'
)
export const IconRefresh = makeIcon(
  '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
)
export const IconSend = makeIcon('<path d="m22 2-7 20-4-9-9-4 20-7z"/>')
export const IconAlert = makeIcon(
  '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
    '<line x1="12" y1="9" x2="12" y2="13"/>' +
    '<line x1="12" y1="17" x2="12.01" y2="17"/>'
)
export const IconShield = makeIcon(
  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
)
export const IconPackage = makeIcon(
  '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>' +
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
    '<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>' +
    '<line x1="12" y1="22.08" x2="12" y2="12"/>'
)
export const IconSettings = makeIcon(
  '<circle cx="12" cy="12" r="3"/>' +
    '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
)
export const IconEye = makeIcon(
  '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'
)
export const IconEyeOff = makeIcon(
  '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>' +
    '<line x1="1" y1="1" x2="23" y2="23"/>'
)
export const IconGripVertical = makeIcon(
  '<circle cx="9" cy="5" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="9" cy="19" r="1.2"/>' +
    '<circle cx="15" cy="5" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="15" cy="19" r="1.2"/>'
)
export const IconFile = makeIcon(
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
    '<polyline points="14 2 14 8 20 8"/>'
)
export const IconUpload = makeIcon(
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'
)
export const IconSparkles = makeIcon(
  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>' +
    '<path d="m6 6 2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>'
)
