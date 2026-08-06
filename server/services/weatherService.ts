// ================================
// 天气服务 - 调用 MetService Point Forecast API
// 包含 Mock 数据兜底（未配置 API Key 时使用）
// ================================
import axios from 'axios'
import type {
  WeatherData,
  CurrentWeather,
  ForecastDay,
  WeatherIconType,
} from '../../src/types'
import { NZ_CITIES, type NZCity } from '../../src/utils/constants'
import { mapWeatherIcon, generateWeatherAdvice } from '../../src/utils'

// 从环境变量读取 MetService API Key
const METSERVICE_API_KEY = process.env.VITE_METSERVICE_API_KEY || ''
const USE_MOCK = !METSERVICE_API_KEY

// MetService 公共数据点 API 端点（实际使用时请替换为官方接口）
// 说明：MetService 官方 API 需要申请授权，此处提供标准格式适配
const METSERVICE_BASE = 'https://api.metservice.com/weather'

/**
 * 从 MetService API 拉取某城市天气
 * 若未配置 Key 或请求失败，返回 Mock 数据（保证页面可用）
 */
export const fetchCityWeather = async (cityCode: string): Promise<WeatherData> => {
  const city = NZ_CITIES.find((c) => c.code === cityCode) || NZ_CITIES[0]

  // ---- Mock 模式：返回基于城市的模拟真实数据 ----
  if (USE_MOCK) {
    return generateMockWeather(city)
  }

  // ---- 真实 API 模式 ----
  try {
    // 超时 5 秒，超时自动降级
    const resp = await axios.get(`${METSERVICE_BASE}/point`, {
      params: {
        lat: city.lat,
        lon: city.lon,
        units: 'metric',
      },
      headers: {
        Authorization: `Bearer ${METSERVICE_API_KEY}`,
        'User-Agent': 'NZ-Trip-Planner/1.0',
      },
      timeout: 5000,
    })
    return transformMetServiceResponse(city, resp.data)
  } catch (err) {
    console.warn('[Weather] MetService API 调用失败，降级 Mock:', (err as Error).message)
    return generateMockWeather(city)
  }
}

/**
 * 批量拉取多个城市的天气（并发 + 限流）
 */
export const fetchCitiesWeather = async (
  cityCodes: string[] = NZ_CITIES.map((c) => c.code)
): Promise<Record<string, WeatherData>> => {
  const result: Record<string, WeatherData> = {}
  // 限制并发数为 3，避免打爆 API
  const BATCH = 3
  for (let i = 0; i < cityCodes.length; i += BATCH) {
    const batch = cityCodes.slice(i, i + BATCH)
    const batchRes = await Promise.all(batch.map((code) => fetchCityWeather(code)))
    batch.forEach((code, idx) => {
      result[code] = batchRes[idx]
    })
  }
  return result
}

/**
 * 转换 MetService 原始响应为内部格式
 * （根据真实 API 返回结构做适配，这里给出典型字段映射）
 */
const transformMetServiceResponse = (city: NZCity, raw: unknown): WeatherData => {
  const data = raw as Record<string, unknown>
  const curr = (data.current || {}) as Record<string, unknown>
  const daily = (data.daily || []) as Record<string, unknown>[]

  const temperature = Number(curr.temp_2m ?? curr.temperature ?? 18)
  const feelsLike = Number(curr.feels_like ?? curr.apparent_temperature ?? temperature)
  const windSpeed = Number(curr.wind_speed_10m ?? curr.windSpeed ?? 10)
  const windDir = String(curr.wind_direction_10m ?? curr.windDirection ?? 'NW')
  const humidity = Number(curr.relative_humidity_2m ?? curr.humidity ?? 65)
  const rainProb = Number(curr.precipitation_probability ?? curr.rainProb ?? 20)
  const uvIndex = Number(curr.uv_index ?? curr.uv ?? 5)
  const desc = String(curr.weather ?? curr.description ?? 'Partly cloudy')
  const icon: WeatherIconType = mapWeatherIcon(desc)

  const current: CurrentWeather = {
    location: city.name,
    locationCode: city.code,
    temperature,
    feelsLike,
    windSpeed,
    windDirection: windDir,
    humidity,
    rainProbability: rainProb,
    uvIndex,
    icon,
    description: desc,
    advice: generateWeatherAdvice(temperature, rainProb, uvIndex, windSpeed),
    updatedAt: Date.now(),
  }

  const forecast: ForecastDay[] = daily.slice(0, 10).map((d, i) => {
    const base = new Date()
    base.setDate(base.getDate() + i)
    const tempHigh = Number(d.temp_max ?? d.temperatureMax ?? 22)
    const tempLow = Number(d.temp_min ?? d.temperatureMin ?? 12)
    const rain = Number(d.precipitation_probability_max ?? d.rainProb ?? 30)
    const ddesc = String(d.weather ?? d.description ?? '晴间多云')
    return {
      date: base.toISOString().slice(0, 10),
      tempHigh,
      tempLow,
      rainProbability: rain,
      icon: mapWeatherIcon(ddesc),
      description: ddesc,
    }
  })

  // 若 daily 为空（API不返回），自动生成未来10天
  if (forecast.length === 0) {
    return {
      current,
      forecast: generateMockForecast(temperature, 10),
    }
  }

  return { current, forecast }
}

// ================================
// Mock 数据生成（真实模拟新西兰各地气候）
// ================================
const generateMockWeather = (city: NZCity): WeatherData => {
  // 按城市/地区模拟温度基线
  const tempBase: Record<string, { avg: number; range: number }> = {
    AKL: { avg: 20, range: 6 },   // 奥克兰：北岛温暖
    WLG: { avg: 17, range: 5 },   // 惠灵顿：风大偏凉
    ROT: { avg: 18, range: 7 },   // 罗托鲁瓦：地热区
    CHC: { avg: 15, range: 8 },   // 基督城：南岛干燥
    ZQN: { avg: 13, range: 9 },   // 皇后镇：高山湖泊
    WAN: { avg: 12, range: 9 },   // 瓦纳卡：比皇后镇稍凉
    MTC: { avg: 8, range: 10 },   // 库克山：山区寒冷
    MIL: { avg: 11, range: 7 },   // 米尔福德峡湾：多雨
  }
  const base = tempBase[city.code] || { avg: 16, range: 7 }

  // 按月份微调季节温度
  const month = new Date().getMonth()
  // 南半球季节：12-2月夏季，6-8月冬季
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

  // 根据概率选择天气描述
  let desc: string
  if (rainProb >= 70) desc = '有雨'
  else if (rainProb >= 40) desc = '多云偶阵雨'
  else if (uvIndex >= 9 && temp >= 20) desc = '晴朗'
  else if (temp <= 5) desc = '晴间多云'
  else desc = '晴间多云'

  const icon: WeatherIconType = mapWeatherIcon(desc)

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
    icon,
    description: desc,
    advice: generateWeatherAdvice(temp, rainProb, uvIndex, windSpeed),
    updatedAt: Date.now(),
  }

  const forecast: ForecastDay[] = generateMockForecastWithBase(
    temp,
    tempHigh,
    tempLow,
    rainProb,
    10
  )
  // 用 forecast 第一个的最高/最低和current对齐
  forecast[0].tempHigh = tempHigh
  forecast[0].tempLow = tempLow
  forecast[0].rainProbability = rainProb
  forecast[0].icon = icon
  forecast[0].description = desc

  return { current, forecast }
}

/** 生成未来N天预报（基于当前温度） */
const generateMockForecast = (currentTemp: number, days: number): ForecastDay[] => {
  return generateMockForecastWithBase(
    currentTemp,
    currentTemp + 4,
    currentTemp - 4,
    30,
    days
  )
}

const generateMockForecastWithBase = (
  _curr: number,
  highBase: number,
  lowBase: number,
  rainBase: number,
  days: number
): ForecastDay[] => {
  const arr: ForecastDay[] = []
  const today = new Date()
  const descs = ['晴朗', '晴间多云', '多云', '多云偶阵雨', '有雨', '阴天']
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const jitter = (Math.random() - 0.5) * 3
    const rain = Math.min(95, Math.max(5, rainBase + Math.floor((Math.random() - 0.5) * 40)))
    const desc = rain >= 70 ? descs[4] : rain >= 40 ? descs[3] : descs[Math.floor(Math.random() * 3)]
    arr.push({
      date: d.toISOString().slice(0, 10),
      tempHigh: Math.round((highBase + jitter) * 10) / 10,
      tempLow: Math.round((lowBase + jitter) * 10) / 10,
      rainProbability: rain,
      icon: mapWeatherIcon(desc),
      description: desc,
    })
  }
  return arr
}
