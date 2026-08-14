// ================================
// 通用工具函数集合
// ================================
import dayjs from 'dayjs'
import type { WeatherIconType, Currency } from '@/types'
import { CURRENCIES, DEFAULT_EXCHANGE_RATES } from '@/utils/constants'

/**
 * 生成唯一ID（UUID v4 简化版，足够前端使用）
 */
export const generateId = (): string => {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

/**
 * 生成随机颜色（用于协作者头像标识）
 */
export const generateAvatarColor = (): string => {
  const colors = [
    '#22c55e', '#0ea5e9', '#f97316', '#eab308', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * 从昵称生成颜色（稳定哈希，同一昵称颜色固定）
 */
export const hashColorFromString = (str: string): string => {
  const colors = [
    '#22c55e', '#0ea5e9', '#f97316', '#eab308', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * 格式化日期显示
 */
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

/**
 * 格式化日期为中文友好格式
 */
export const formatDateCN = (date: string | Date): string => {
  const d = dayjs(date)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.month() + 1}月${d.date()}日 ${weekdays[d.day()]}`
}

/**
 * 格式化时间显示（HH:mm）
 */
export const formatTime = (time: string): string => {
  if (!time) return ''
  return time
}

/**
 * 格式化相对时间（几分钟前、几小时前等）
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return dayjs(timestamp).format('MM-DD HH:mm')
}

/**
 * 计算两个日期间的天数（含首尾）
 */
export const calcDaysBetween = (start: string, end: string): number => {
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  return endDate.diff(startDate, 'day') + 1
}

/**
 * 生成日期范围内的所有日期列表
 */
export const generateDateRange = (start: string, end: string): string[] => {
  const dates: string[] = []
  const startDate = dayjs(start)
  const days = calcDaysBetween(start, end)
  for (let i = 0; i < days; i++) {
    dates.push(startDate.add(i, 'day').format('YYYY-MM-DD'))
  }
  return dates
}

/**
 * 计算订单/行程是否临近（3天内）
 */
export const isUpcoming = (dateTimeIso: string, days = 3): boolean => {
  const target = dayjs(dateTimeIso)
  const now = dayjs()
  const diff = target.diff(now, 'day')
  return diff >= 0 && diff <= days
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 300
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit = 300
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 文件转 Base64 DataURL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 格式化文件大小显示
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

/**
 * 天气描述映射为图标类型
 */
export const mapWeatherIcon = (desc: string): WeatherIconType => {
  const d = desc.toLowerCase()
  if (d.includes('晴') || d.includes('sunny') || d.includes('clear')) return 'sunny'
  if (d.includes('多云') || d.includes('partly')) return 'partly-cloudy'
  if (d.includes('阴') || d.includes('cloud')) return 'cloudy'
  if (d.includes('雨') || d.includes('rain') || d.includes('shower')) return 'rainy'
  if (d.includes('雷') || d.includes('storm')) return 'storm'
  if (d.includes('雪') || d.includes('snow')) return 'snow'
  if (d.includes('雾') || d.includes('fog') || d.includes('mist')) return 'fog'
  if (d.includes('风') || d.includes('wind')) return 'windy'
  return 'partly-cloudy'
}

/**
 * 根据天气数据生成出行建议
 */
export const generateWeatherAdvice = (
  temp: number,
  rainProb: number,
  uvIndex: number,
  windSpeed: number
): string[] => {
  const advice: string[] = []
  // 温度建议
  if (temp < 10) advice.push('气温较低，建议穿着羽绒服/厚外套，注意保暖')
  else if (temp < 18) advice.push('天气偏凉，建议穿着夹克或薄外套')
  else if (temp > 28) advice.push('气温较高，穿着清凉透气衣物，多喝水防中暑')
  // 降雨建议
  if (rainProb >= 70) advice.push('降雨概率很高，务必携带雨伞，优先安排室内行程')
  else if (rainProb >= 40) advice.push('有一定降雨可能，建议随身携带折叠伞')
  // UV建议
  if (uvIndex >= 10) advice.push('紫外线极强！必须涂抹SPF50+防晒霜，戴帽子墨镜')
  else if (uvIndex >= 7) advice.push('紫外线较强，建议涂抹防晒霜，做好防晒措施')
  else if (uvIndex >= 5) advice.push('紫外线中等，敏感人群注意防晒')
  // 风力建议
  if (windSpeed >= 40) advice.push('风力较大，海边活动注意安全，驾驶注意横风')
  else if (windSpeed >= 25) advice.push('风力不小，户外活动注意防风')
  // 默认友好建议
  if (advice.length === 0) advice.push('天气宜人，非常适合户外活动！')
  return advice
}

/**
 * 新西兰元格式化（保留向后兼容）
 */
export const formatNZD = (amount: number): string => {
  return `NZ$${amount.toFixed(2)}`
}

/**
 * 按指定币种格式化金额
 */
export const formatCurrency = (amount: number, currency: Currency = 'NZD'): string => {
  const info = CURRENCIES.find((c) => c.code === currency)
  const symbol = info?.symbol || ''
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * 将某币种金额换算为人民币
 * @param amount 原始金额
 * @param currency 原始币种
 * @param rates 汇率表（1外币 = X人民币）
 */
export const convertToCNY = (
  amount: number,
  currency: Currency = 'NZD',
  rates: Record<Currency, number> = DEFAULT_EXCHANGE_RATES
): number => {
  const rate = rates[currency] ?? 1
  return amount * rate
}

/**
 * 将某币种金额换算为人民币并格式化显示
 */
export const formatAsCNY = (
  amount: number,
  currency: Currency = 'NZD',
  rates: Record<Currency, number> = DEFAULT_EXCHANGE_RATES
): string => {
  const cny = convertToCNY(amount, currency, rates)
  return `¥${cny.toFixed(2)}`
}

/**
 * 格式化人民币金额
 */
export const formatCNY = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
}

/**
 * 简易深拷贝（JSON安全对象）
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 获取订单状态对应样式颜色
 */
export const getOrderStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    '未预订': 'bg-gray-100 text-gray-600',
    '已预订': 'bg-ocean-100 text-ocean-700',
    '已付款': 'bg-primary-100 text-primary-700',
    '已核销': 'bg-purple-100 text-purple-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

/**
 * 获取难易度对应颜色
 */
export const getDifficultyColor = (level: string): string => {
  const map: Record<string, string> = {
    '轻松': 'bg-green-100 text-green-700',
    '适中': 'bg-yellow-100 text-yellow-700',
    '较难': 'bg-orange-100 text-orange-700',
    '挑战': 'bg-red-100 text-red-700',
  }
  return map[level] || 'bg-gray-100 text-gray-600'
}
