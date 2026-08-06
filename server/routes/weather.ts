// ================================
// 天气接口路由
// GET /api/weather?city=AKL     单城市天气
// GET /api/weather/batch?cities=AKL,ZQN,CHC   批量天气
// ================================
import { Router, type Request, type Response } from 'express'
import { fetchCityWeather, fetchCitiesWeather } from '../services/weatherService'
import { NZ_CITIES } from '../../src/utils/constants'

const router = Router()

// 接口缓存（简单内存缓存，10分钟）
interface CacheItem {
  data: unknown
  expireAt: number
}
const cache = new Map<string, CacheItem>()
const CACHE_TTL = 10 * 60 * 1000 // 10分钟

const getCache = (key: string): unknown | null => {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() > item.expireAt) {
    cache.delete(key)
    return null
  }
  return item.data
}
const setCache = (key: string, data: unknown) => {
  cache.set(key, { data, expireAt: Date.now() + CACHE_TTL })
  // 限制缓存上限
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
}

/** 单城市天气 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const city = String(req.query.city || 'AKL').toUpperCase()
    // 校验城市合法性
    if (!NZ_CITIES.some((c) => c.code === city)) {
      return res.status(400).json({
        success: false,
        message: `不支持的城市代码：${city}`,
        supportedCities: NZ_CITIES.map((c) => ({ code: c.code, name: c.name })),
      })
    }
    const cacheKey = `w:${city}`
    const cached = getCache(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true })
    }
    const data = await fetchCityWeather(city)
    setCache(cacheKey, data)
    res.json({ success: true, data })
  } catch (err) {
    const e = err as Error
    console.error('[API/Weather] 单城市错误:', e.message)
    res.status(500).json({
      success: false,
      message: '天气服务暂不可用，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined,
    })
  }
})

/** 批量城市天气 */
router.get('/batch', async (req: Request, res: Response) => {
  try {
    const citiesRaw = String(req.query.cities || '')
    const cities = citiesRaw
      ? citiesRaw.split(',').map((c) => c.trim().toUpperCase())
      : NZ_CITIES.map((c) => c.code)
    // 过滤无效城市
    const validCities = cities.filter((c) => NZ_CITIES.some((nz) => nz.code === c))
    if (validCities.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的城市代码',
      })
    }
    const cacheKey = `wb:${validCities.join(',')}`
    const cached = getCache(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true })
    }
    const data = await fetchCitiesWeather(validCities)
    setCache(cacheKey, data)
    res.json({ success: true, data })
  } catch (err) {
    const e = err as Error
    console.error('[API/Weather] 批量错误:', e.message)
    res.status(500).json({
      success: false,
      message: '天气批量服务暂不可用',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined,
    })
  }
})

/** 支持的城市列表 */
router.get('/cities', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: NZ_CITIES.map((c) => ({
      code: c.code,
      name: c.name,
      enName: c.enName,
      region: c.region,
      description: c.description,
    })),
  })
})

export default router
