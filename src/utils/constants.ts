// ================================
// 应用常量配置
// ================================
import type { NZTag, TransportType, OrderCategory, OrderStatus, DifficultyLevel, Currency } from '@/types'

// ---- 新西兰专属标签列表 ----
export const NZ_TAGS: NZTag[] = [
  '环岛', '冰川', '徒步', '峡湾', '海边',
  '城市休闲', '观星', '温泉', '酒庄', '农场',
]

// ---- 交通方式列表 ----
export const TRANSPORT_TYPES: TransportType[] = [
  '自驾', '飞机', '大巴', '火车', '轮渡', '步行', '出租车', '其他',
]

// ---- 行程难易度列表 ----
export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['轻松', '适中', '较难', '挑战']

// ---- 订单分类列表 ----
export const ORDER_CATEGORIES: OrderCategory[] = [
  '国际机票', '境内机票', '酒店', '租车', '景点门票', '徒步预约', '轮渡票',
]

// ---- 订单分类对应的图标 emoji ----
export const ORDER_CATEGORY_ICONS: Record<OrderCategory, string> = {
  '国际机票': '✈️',
  '境内机票': '🛫',
  '酒店': '🏨',
  '租车': '🚗',
  '景点门票': '🎫',
  '徒步预约': '🥾',
  '轮渡票': '⛴️',
}

// ---- 订单分类对应的颜色 ----
export const ORDER_CATEGORY_COLORS: Record<OrderCategory, string> = {
  '国际机票': 'bg-ocean-100 text-ocean-700 border-ocean-200',
  '境内机票': 'bg-sky-100 text-sky-700 border-sky-200',
  '酒店': 'bg-sunset-100 text-sunset-700 border-sunset-200',
  '租车': 'bg-amber-100 text-amber-700 border-amber-200',
  '景点门票': 'bg-primary-100 text-primary-700 border-primary-200',
  '徒步预约': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '轮渡票': 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

// ---- 订单状态列表 ----
export const ORDER_STATUSES: OrderStatus[] = ['未预订', '已预订', '已付款', '已核销']

// ---- 支持的币种列表 ----
export interface CurrencyInfo {
  code: Currency
  name: string
  symbol: string
  flag: string
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
  { code: 'USD', name: '美元', symbol: 'US$', flag: '🇺🇸' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
]

/** 各币种对人民币的汇率（1单位外币 = X人民币），用户可在设置中调整 */
export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  NZD: 4.3,
  CNY: 1,
  USD: 7.1,
  AUD: 4.7,
  EUR: 7.8,
}

// ---- 新西兰主要目的地城市（带坐标用于天气API） ----
export interface NZCity {
  code: string
  name: string
  enName: string
  lat: number
  lon: number
  region: '北岛' | '南岛'
  description: string
}

export const NZ_CITIES: NZCity[] = [
  {
    code: 'AKL',
    name: '奥克兰',
    enName: 'Auckland',
    lat: -36.8485,
    lon: 174.7633,
    region: '北岛',
    description: '新西兰最大城市，千帆之都',
  },
  {
    code: 'WLG',
    name: '惠灵顿',
    enName: 'Wellington',
    lat: -41.2865,
    lon: 174.7762,
    region: '北岛',
    description: '首都，风城，文化艺术中心',
  },
  {
    code: 'CHC',
    name: '基督城',
    enName: 'Christchurch',
    lat: -43.5321,
    lon: 172.6362,
    region: '南岛',
    description: '花园城市，南岛门户',
  },
  {
    code: 'ZQN',
    name: '皇后镇',
    enName: 'Queenstown',
    lat: -45.0312,
    lon: 168.6626,
    region: '南岛',
    description: '冒险之都，瓦卡蒂普湖畔明珠',
  },
  {
    code: 'WAN',
    name: '瓦纳卡',
    enName: 'Wanaka',
    lat: -44.6980,
    lon: 169.1680,
    region: '南岛',
    description: '宁静湖畔小镇，户外天堂',
  },
  {
    code: 'MTC',
    name: '库克山',
    enName: 'Mt Cook',
    lat: -43.7333,
    lon: 170.0967,
    region: '南岛',
    description: '新西兰最高峰，冰川徒步圣地',
  },
  {
    code: 'MIL',
    name: '米尔福德峡湾',
    enName: 'Milford Sound',
    lat: -44.6278,
    lon: 167.9250,
    region: '南岛',
    description: '世界第八大奇迹，峡湾代表',
  },
  {
    code: 'ROT',
    name: '罗托鲁瓦',
    enName: 'Rotorua',
    lat: -38.1400,
    lon: 176.2400,
    region: '北岛',
    description: '地热之乡，毛利文化中心',
  },
]

// ---- 物资清单分类 ----
export const INVENTORY_CATEGORIES = [
  '证件', '衣物', '电子', '洗漱', '药品', '户外', '其他',
] as const

// ---- 旅行日期默认值（今天起14天）----
export const DEFAULT_TRIP_DURATION = 14

// ---- 本地存储 Key 前缀 ----
export const STORAGE_KEYS = {
  USER: 'nz_trip_user',
  TRIP_ID: 'nz_trip_id',
  SCHEDULES: 'nz_trip_schedules',
  ORDERS: 'nz_trip_orders',
  NOTICE: 'nz_trip_notice',
  MESSAGES: 'nz_trip_messages',
  WEATHER_CACHE: 'nz_trip_weather_cache',
  OFFLINE_QUEUE: 'nz_trip_offline_queue',
  EXCHANGE_RATES: 'nz_trip_exchange_rates',
}

// ---- 协同房间默认 ID（可分享给同伴加入同一行程）----
export const DEFAULT_TRIP_ID = 'nz-trip-demo-2024'
