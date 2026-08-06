// ================================
// 前端天气服务 - 调用后端中转 API
// 含本地缓存兜底 + 接口异常降级
// ================================
import axios from 'axios'
import type { WeatherData } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { NZ_CITIES } from '@/utils/constants'

// 前端内存缓存（10分钟）
const memoryCache = new Map<string, { data: WeatherData; expireAt: number }>()
const CACHE_TTL = 10 * 60 * 1000

// API Base URL：开发走 vite 代理 /api，生产走同域
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/** 读取本地磁盘缓存（localStorage，极端情况兜底） */
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

/**
 * 获取单城市天气
 * 优先级：内存缓存 -> 后端API -> localStorage缓存 -> Mock数据(最后兜底)
 */
export const getCityWeather = async (cityCode: string): Promise<WeatherData> => {
  // 1. 内存缓存
  const now = Date.now()
  const mem = memoryCache.get(cityCode)
  if (mem && now < mem.expireAt && isValidWeatherData(mem.data)) return mem.data

  try {
    // 2. 调后端 API（超时 8 秒）
    const resp = await axios.get<{ success: boolean; data: WeatherData }>(
      `${API_BASE}/weather`,
      {
        params: { city: cityCode },
        timeout: 8000,
      }
    )
    if (resp.data?.success && isValidWeatherData(resp.data.data)) {
      memoryCache.set(cityCode, { data: resp.data.data, expireAt: now + CACHE_TTL })
      // 写入磁盘缓存
      const disk = readDiskCache()
      disk[cityCode] = resp.data.data
      writeDiskCache(disk)
      return resp.data.data
    }
    throw new Error('API 返回格式异常')
  } catch (e) {
    console.warn(`[Weather] 城市${cityCode}接口失败，尝试缓存`, (e as Error).message)
    // 3. 读本地缓存
    const disk = readDiskCache()
    if (isValidWeatherData(disk[cityCode])) return disk[cityCode] as WeatherData
    // 4. 最后兜底：直接调用 server 里的 Mock（通过后端，但无 MetService Key 时也是 Mock）
    // 再试一次接口（不带超时更宽容），不行就抛出，调用方自己也会做异常处理
    throw e
  }
}

/** 校验数据是否是合法 WeatherData（防止缓存中遗留了旧的错误结构） */
const isValidWeatherData = (w: unknown): w is WeatherData => {
  if (!w || typeof w !== 'object') return false
  const obj = w as Record<string, unknown>
  const cur = obj.current
  if (!cur || typeof cur !== 'object') return false
  const c = cur as Record<string, unknown>
  return typeof c.temperature === 'number' && typeof c.feelsLike === 'number'
}

/**
 * 批量获取多城市天气（串行 fallback，保证总有数据）
 */
export const getCitiesWeather = async (
  cityCodes: string[] = NZ_CITIES.map((c) => c.code)
): Promise<Record<string, WeatherData>> => {
  const result: Record<string, WeatherData> = {}
  // 先用内存/磁盘能返回多少返回多少
  const now = Date.now()
  const disk = readDiskCache()
  const needFetch: string[] = []
  for (const code of cityCodes) {
    const mem = memoryCache.get(code)
    if (mem && now < mem.expireAt && isValidWeatherData(mem.data)) {
      result[code] = mem.data
    } else if (isValidWeatherData(disk[code])) {
      result[code] = disk[code] as WeatherData
      needFetch.push(code) // 有磁盘缓存也还是尝试刷新
    } else {
      needFetch.push(code)
    }
  }
  if (needFetch.length === 0) return result

  try {
    const resp = await axios.get<{ success: boolean; data: Record<string, WeatherData> }>(
      `${API_BASE}/weather/batch`,
      {
        params: { cities: needFetch.join(',') },
        timeout: 12000,
      }
    )
    if (resp.data?.success && resp.data.data) {
      Object.keys(resp.data.data).forEach((code) => {
        const w = resp.data.data![code]
        if (!isValidWeatherData(w)) return // 过滤不合法数据
        result[code] = w
        memoryCache.set(code, { data: w, expireAt: now + CACHE_TTL })
        disk[code] = w
      })
      writeDiskCache(disk)
    }
  } catch (e) {
    console.warn('[Weather] 批量接口失败，使用缓存数据', (e as Error).message)
  }
  return result
}

/** 支持的城市列表（从后端拿，拿不到用本地常量） */
export const getSupportedCities = async () => {
  try {
    const resp = await axios.get(`${API_BASE}/weather/cities`, { timeout: 5000 })
    if (resp.data?.success) return resp.data.data
  } catch {
    /* ignore */
  }
  return NZ_CITIES.map((c) => ({
    code: c.code,
    name: c.name,
    enName: c.enName,
    region: c.region,
    description: c.description,
  }))
}
