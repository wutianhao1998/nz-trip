// ================================
// 前端天气服务 - 直接调用 Open-Meteo 免费 API
// ✅ 无需后端中转 · ✅ 无需 API Key · ✅ 支持 CORS 前端直连
// 三层兜底：Open-Meteo 真实数据 → localStorage 缓存 → 内置 Mock
// ================================
import axios from 'axios'
import type { WeatherData, CurrentWeather, ForecastDay } from '@/types'
import { STORAGE_KEYS, NZ_CITIES, type NZCity } from '@/utils/constants'
import { mapWeatherIcon, generateWeatherAdvice } from '@/utils'

// Open-Meteo API（免费、无需 Key、支持 CORS）
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

// 内存缓存（10 分钟）
const memoryCache = new Map<string, { data: WeatherData; expireAt: number }>()
const CACHE_TTL = 10 * 60 * 1000

// ================================
// Open-Meteo 响应类型定义
// ================================
interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
    wind_direction_10m: number
  }
  hourly: {
    time: string[]
    uv_index: number[]
    precipitation_probability: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    uv_index_max: number[]
    wind_speed_10m_max: number[]
  }
}

// ================================
// WMO Weather Code → 中文描述
// ================================
const wmoToDescription = (code: number): string => {
  const map: Record<number, string> = {
    0: '晴朗',
    1: '晴间多云',
    2: '多云',
    3: '阴天',
    45: '雾',
    48: '雾凇',
    51: '毛毛雨',
    53: '毛毛雨',
    55: '毛毛雨',
    56: '冻雨',
    57: '冻雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    66: '冻雨',
    67: '冻雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪粒',
    80: '阵雨',
    81: '阵雨',
    82: '暴雨',
    85: '阵雪',
    86: '暴雪',
    95: '雷暴',
    96: '雷暴冰雹',
    99: '雷暴冰雹',
  }
  return map[code] ?? '未知'
}

// ================================
// 风向度数 → 8 方位缩写
// ================================
const degreeToDirection = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const idx = Math.round(deg / 45) % 8
  return dirs[idx]
}

// ================================
// 获取当前小时在 hourly.time 中的索引
// ================================
const getCurrentHourIndex = (times: string[]): number => {
  const now = Date.now()
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() > now - 3600000) return i
  }
  return 0
}

// ================================
// Open-Meteo 响应 → WeatherData 转换
// ================================
const transformOpenMeteo = (city: NZCity, resp: OpenMeteoResponse): WeatherData => {
  const cur = resp.current

  // 从 hourly 取当前小时的 UV 和降水概率
  const hourIdx = getCurrentHourIndex(resp.hourly.time)
  const uvIndex = Math.round((resp.hourly.uv_index[hourIdx] ?? 0) * 10) / 10
  const rainProb = resp.hourly.precipitation_probability[hourIdx] ?? 0

  const desc = wmoToDescription(cur.weather_code)

  const current: CurrentWeather = {
    location: city.name,
    locationCode: city.code,
    temperature: Math.round(cur.temperature_2m * 10) / 10,
    feelsLike: Math.round(cur.apparent_temperature * 10) / 10,
    windSpeed: Math.round(cur.wind_speed_10m * 10) / 10,
    windDirection: degreeToDirection(cur.wind_direction_10m),
    humidity: cur.relative_humidity_2m,
    rainProbability: rainProb,
    uvIndex: Math.round(uvIndex),
    icon: mapWeatherIcon(desc),
    description: desc,
    advice: generateWeatherAdvice(
      cur.temperature_2m,
      rainProb,
      uvIndex,
      cur.wind_speed_10m
    ),
    updatedAt: Date.now(),
  }

  // 10 日预报
  const forecast: ForecastDay[] = resp.daily.time.map((date, i) => {
    const fDesc = wmoToDescription(resp.daily.weather_code[i])
    return {
      date,
      tempHigh: Math.round(resp.daily.temperature_2m_max[i] * 10) / 10,
      tempLow: Math.round(resp.daily.temperature_2m_min[i] * 10) / 10,
      rainProbability: resp.daily.precipitation_probability_max[i] ?? 0,
      icon: mapWeatherIcon(fDesc),
      description: fDesc,
    }
  })

  return { current, forecast }
}

// ================================
// 前端内置 Mock（最终兜底，不依赖后端）
// 基于新西兰各地真实气候规律生成模拟数据
// ================================
const generateMockWeather = (city: NZCity): WeatherData => {
  // 按城市/地区模拟温度基线
  const tempBase: Record<string, { avg: number; range: number }> = {
    AKL: { avg: 20, range: 6 },
    WLG: { avg: 17, range: 5 },
    ROT: { avg: 18, range: 7 },
    CHC: { avg: 15, range: 8 },
    ZQN: { avg: 13, range: 9 },
    WAN: { avg: 12, range: 9 },
    MTC: { avg: 8, range: 10 },
    MIL: { avg: 11, range: 7 },
  }
  const base = tempBase[city.code] || { avg: 16, range: 7 }

  // 按月份微调季节温度（南半球：12-2月夏季，6-8月冬季）
  const month = new Date().getMonth()
  const seasonAdj = month >= 11 || month <= 1 ? 5 : month >= 5 && month <= 7 ? -5 : 0

  const avgTemp = base.avg + seasonAdj + (Math.random() - 0.5) * 2
  const temp = Math.round(avgTemp * 10) / 10
  const tempHigh = Math.round((avgTemp + base.range / 2) * 10) / 10
  const tempLow = Math.round((avgTemp - base.range / 2) * 10) / 10

  // 米尔福德和南岛西岸降水概率高
  const rainBase = city.code === 'MIL' ? 65 : city.region === '南岛' ? 35 : 25
  const rainProb = Math.min(95, Math.max(5, rainBase + Math.floor((Math.random() - 0.5) * 30)))

  // UV：夏季高冬季低
  const uvBase = seasonAdj > 0 ? 9 : seasonAdj < 0 ? 3 : 6
  const uvIndex = Math.max(1, Math.min(12, uvBase + Math.floor((Math.random() - 0.5) * 3)))

  // 风速：惠灵顿（风城）和南岛偏高
  const windBase = city.code === 'WLG' ? 25 : city.region === '南岛' ? 18 : 12
  const windSpeed = Math.round((windBase + (Math.random() - 0.5) * 10) * 10) / 10
  const windDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const windDirection = windDirs[Math.floor(Math.random() * windDirs.length)]

  const humidity = Math.round(55 + Math.random() * 30)

  let desc: string
  if (rainProb >= 70) desc = '有雨'
  else if (rainProb >= 40) desc = '多云偶阵雨'
  else if (uvIndex >= 9 && temp >= 20) desc = '晴朗'
  else if (temp <= 5) desc = '晴间多云'
  else desc = '晴间多云'

  // 体感温度：风大更冷
  const windChill = windSpeed > 20 ? -1.5 : windSpeed > 30 ? -3 : 0
  const feelsLike = Math.round((temp + windChill + (rainProb > 60 ? -1 : 0)) * 10) / 10

  const current: CurrentWeather = {
    location: city.name,
    locationCode: city.code,
    temperature: temp,
    feelsLike,
    windSpeed,
    windDirection,
    humidity,
    rainProbability: rainProb,
    uvIndex,
    icon: mapWeatherIcon(desc),
    description: desc,
    advice: generateWeatherAdvice(temp, rainProb, uvIndex, windSpeed),
    updatedAt: Date.now(),
  }

  // 生成 10 天预报
  const forecast: ForecastDay[] = []
  const today = new Date()
  const descs = ['晴朗', '晴间多云', '多云', '多云偶阵雨', '有雨', '阴天']
  for (let i = 0; i < 10; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const variance = (Math.random() - 0.5) * 4
    const fDesc = descs[Math.floor(Math.random() * descs.length)]
    forecast.push({
      date: dateStr,
      tempHigh: Math.round((tempHigh + variance) * 10) / 10,
      tempLow: Math.round((tempLow + variance) * 10) / 10,
      rainProbability: Math.min(95, Math.max(5, rainProb + Math.floor((Math.random() - 0.5) * 30))),
      icon: mapWeatherIcon(fDesc),
      description: fDesc,
    })
  }
  // 第一天和 current 对齐
  forecast[0].tempHigh = tempHigh
  forecast[0].tempLow = tempLow
  forecast[0].rainProbability = rainProb
  forecast[0].icon = current.icon
  forecast[0].description = desc

  return { current, forecast }
}

// ================================
// localStorage 缓存读写
// ================================
const readDiskCache = (): Record<string, WeatherData> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEATHER_CACHE)
    return raw ? (JSON.parse(raw) as Record<string, WeatherData>) : {}
  } catch {
    return {}
  }
}
const writeDiskCache = (data: Record<string, WeatherData>) => {
  try {
    localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

/** 校验数据是否是合法 WeatherData（防止缓存中遗留旧结构） */
const isValidWeatherData = (w: unknown): w is WeatherData => {
  if (!w || typeof w !== 'object') return false
  const obj = w as Record<string, unknown>
  const cur = obj.current
  if (!cur || typeof cur !== 'object') return false
  const c = cur as Record<string, unknown>
  return typeof c.temperature === 'number' && typeof c.feelsLike === 'number'
}

// ================================
// 调用 Open-Meteo API 获取单城市真实天气
// ================================
const fetchFromOpenMeteo = async (city: NZCity): Promise<WeatherData> => {
  const params = {
    latitude: city.lat,
    longitude: city.lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
    hourly: 'uv_index,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max',
    timezone: 'Pacific/Auckland',
    forecast_days: 10,
  }

  const resp = await axios.get<OpenMeteoResponse>(OPEN_METEO_URL, {
    params,
    timeout: 8000,
  })

  if (!resp.data?.current) throw new Error('Open-Meteo 返回数据异常')
  return transformOpenMeteo(city, resp.data)
}

// ================================
// 主函数：获取单城市天气
// 优先级：内存缓存 → Open-Meteo 真实 API → localStorage 缓存 → Mock 兜底
// ================================
export const getCityWeather = async (cityCode: string): Promise<WeatherData> => {
  const now = Date.now()

  // 1. 内存缓存
  const mem = memoryCache.get(cityCode)
  if (mem && now < mem.expireAt && isValidWeatherData(mem.data)) return mem.data

  const city = NZ_CITIES.find((c) => c.code === cityCode) || NZ_CITIES[0]

  try {
    // 2. 调 Open-Meteo API（真实天气数据）
    const data = await fetchFromOpenMeteo(city)
    memoryCache.set(cityCode, { data, expireAt: now + CACHE_TTL })
    const disk = readDiskCache()
    disk[cityCode] = data
    writeDiskCache(disk)
    return data
  } catch (e) {
    console.warn(`[Weather] Open-Meteo 获取${city.name}失败，尝试缓存`, (e as Error).message)
    // 3. 读 localStorage 缓存
    const disk = readDiskCache()
    if (isValidWeatherData(disk[cityCode])) return disk[cityCode] as WeatherData
    // 4. 前端内置 Mock 兜底（保证页面永远有数据）
    console.warn(`[Weather] 使用 Mock 数据兜底: ${city.name}`)
    return generateMockWeather(city)
  }
}

/**
 * 批量获取多城市天气（并发请求，每个城市独立兜底）
 */
export const getCitiesWeather = async (
  cityCodes: string[] = NZ_CITIES.map((c) => c.code)
): Promise<Record<string, WeatherData>> => {
  const result: Record<string, WeatherData> = {}
  const now = Date.now()
  const needFetch: string[] = []

  for (const code of cityCodes) {
    const mem = memoryCache.get(code)
    if (mem && now < mem.expireAt && isValidWeatherData(mem.data)) {
      result[code] = mem.data
    } else {
      needFetch.push(code)
    }
  }
  if (needFetch.length === 0) return result

  // 并发请求，每个城市独立兜底，失败不影响其他城市
  const promises = needFetch.map(async (code) => {
    try {
      const data = await getCityWeather(code)
      result[code] = data
    } catch {
      // getCityWeather 内部已有 Mock 兜底，不会抛错
    }
  })
  await Promise.all(promises)

  return result
}

/** 支持的城市列表（直接返回本地常量，无需后端） */
export const getSupportedCities = async () => {
  return NZ_CITIES.map((c) => ({
    code: c.code,
    name: c.name,
    enName: c.enName,
    region: c.region,
    description: c.description,
  }))
}
