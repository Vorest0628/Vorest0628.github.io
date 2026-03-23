import { apiService } from '../services/api'
import type { 
  WeatherData, 
  WeatherForecast, 
  CityInfo, 
  WeatherParams 
} from '../types/api'

const SHANGHAI_COORDINATES = {
  latitude: 31.2304,
  longitude: 121.4737
}

const OPEN_METEO_CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'weather_code',
  'surface_pressure',
  'wind_speed_10m',
  'is_day'
].join(',')

const OPEN_METEO_DAILY_FIELDS = [
  'temperature_2m_max',
  'temperature_2m_min'
].join(',')

const WEATHER_CODE_MAP: Record<number, { day: string; night?: string; icon: string }> = {
  0: { day: '晴朗', night: '晴夜', icon: '☀️' },
  1: { day: '晴间多云', night: '夜间少云', icon: '🌤️' },
  2: { day: '多云', night: '夜间多云', icon: '⛅' },
  3: { day: '阴天', icon: '☁️' },
  45: { day: '有雾', icon: '🌫️' },
  48: { day: '雾凇', icon: '🌫️' },
  51: { day: '小毛毛雨', icon: '🌦️' },
  53: { day: '毛毛雨', icon: '🌦️' },
  55: { day: '强毛毛雨', icon: '🌧️' },
  56: { day: '冻毛毛雨', icon: '🌧️' },
  57: { day: '强冻毛毛雨', icon: '🌧️' },
  61: { day: '小雨', icon: '🌦️' },
  63: { day: '中雨', icon: '🌧️' },
  65: { day: '大雨', icon: '🌧️' },
  66: { day: '冻雨', icon: '🌧️' },
  67: { day: '强冻雨', icon: '🌧️' },
  71: { day: '小雪', icon: '🌨️' },
  73: { day: '中雪', icon: '🌨️' },
  75: { day: '大雪', icon: '❄️' },
  77: { day: '阵雪', icon: '🌨️' },
  80: { day: '阵雨', icon: '🌦️' },
  81: { day: '较强阵雨', icon: '🌧️' },
  82: { day: '强阵雨', icon: '⛈️' },
  85: { day: '阵雪', icon: '🌨️' },
  86: { day: '强阵雪', icon: '❄️' },
  95: { day: '雷阵雨', icon: '⛈️' },
  96: { day: '雷雨伴冰雹', icon: '⛈️' },
  99: { day: '强雷雨伴冰雹', icon: '⛈️' }
}

interface OpenMeteoForecastResponse {
  current?: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    weather_code: number
    surface_pressure: number
    wind_speed_10m: number
    is_day: number
  }
  daily?: {
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
  }
}

export interface ShanghaiWeatherSnapshot {
  location: string
  temperature: number
  low: number
  high: number
  humidity: number
  description: string
  icon: string
  windSpeed: number
  pressure: number
  updatedAt: string
  tip: string
}

const resolveWeatherPresentation = (weatherCode: number, isDay: number) => {
  const meta = WEATHER_CODE_MAP[weatherCode] || { day: '天气平稳', icon: '🌤️' }
  const description = isDay ? meta.day : meta.night || meta.day

  return {
    description,
    icon: meta.icon
  }
}

const buildWeatherTip = (weatherCode: number, temperature: number, humidity: number) => {
  if ([95, 96, 99].includes(weatherCode)) {
    return '有雷雨信号，出门记得带伞并注意通勤节奏。'
  }

  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return '上海有降雨，适合把今天的计划排得更从容一些。'
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return '气温偏低，记得做好保暖再出门。'
  }

  if ([45, 48].includes(weatherCode)) {
    return '能见度一般，出行时可以稍微留出一点冗余时间。'
  }

  if (temperature >= 30) {
    return '气温偏高，补水和室内通风都很重要。'
  }

  if (temperature <= 8) {
    return '体感偏凉，泡杯热饮再开始今天也不错。'
  }

  if (humidity >= 85) {
    return '空气湿度比较高，适合把节奏放轻一点。'
  }

  return '天气状态稳定，适合继续写点新内容。'
}

/*
WeatherApi输出函数一览：
getCurrentWeather 获取当前天气
getWeatherForecast 获取天气预报
getWeatherByIP 根据IP获取天气
searchCities 搜索城市
getPopularCities 获取热门城市列表
getFollowedCitiesWeather 获取用户关注的城市天气
followCity 添加关注城市
unfollowCity 取消关注城市
getHistoricalWeather 获取历史天气
getWeatherAlerts 获取天气预警
getAirQuality 获取空气质量
getLifeIndex 获取生活指数
getWeatherConfig 获取天气配置
updateWeatherConfig 更新天气配置
*/

/**
 * 关注城市数据
 */
export interface FollowCityData {
  cityName: string
  cityCode: string
  lat: number
  lon: number
}

/**
 * 历史天气查询参数
 */
export interface HistoricalWeatherParams {
  city: string
  date: string // YYYY-MM-DD format
}

/**
 * 天气预警数据
 */
export interface WeatherAlert {
  id: string
  title: string
  description: string
  level: 'yellow' | 'orange' | 'red'
  startTime: string
  endTime: string
  areas: string[]
}

/**
 * 空气质量数据
 */
export interface AirQuality {
  aqi: number
  level: string
  pm25: number
  pm10: number
  so2: number
  no2: number
  co: number
  o3: number
}

/**
 * 生活指数数据
 */
export interface LifeIndex {
  comfort: { level: string; description: string }
  carWash: { level: string; description: string }
  dressing: { level: string; description: string }
  exercise: { level: string; description: string }
  tourism: { level: string; description: string }
  uv: { level: string; description: string }
}

/**
 * 天气配置
 */
export interface WeatherConfig {
  defaultCity: string
  units: 'metric' | 'imperial'
  language: string
  autoLocation: boolean
  updateInterval: number
}

/**
 * 天气相关的API请求
 */
export const weatherApi = {
  /**
   * 获取首页上海天气卡片数据
   */
  async getShanghaiWeather(): Promise<ShanghaiWeatherSnapshot> {
    const response = await apiService.get<OpenMeteoForecastResponse>('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: SHANGHAI_COORDINATES.latitude,
        longitude: SHANGHAI_COORDINATES.longitude,
        current: OPEN_METEO_CURRENT_FIELDS,
        daily: OPEN_METEO_DAILY_FIELDS,
        forecast_days: 1,
        timezone: 'Asia/Shanghai'
      }
    })

    const current = response?.current
    const daily = response?.daily
    const low = daily?.temperature_2m_min?.[0]
    const high = daily?.temperature_2m_max?.[0]

    if (!current || typeof low !== 'number' || typeof high !== 'number') {
      throw new Error('Invalid Shanghai weather response')
    }

    const presentation = resolveWeatherPresentation(current.weather_code, current.is_day)
    const temperature = Math.round(current.temperature_2m)
    const humidity = Math.round(current.relative_humidity_2m)

    return {
      location: 'Shanghai',
      temperature,
      low: Math.round(low),
      high: Math.round(high),
      humidity,
      description: presentation.description,
      icon: presentation.icon,
      windSpeed: Math.round(current.wind_speed_10m),
      pressure: Math.round(current.surface_pressure),
      updatedAt: current.time,
      tip: buildWeatherTip(current.weather_code, temperature, humidity)
    }
  },

  /**
   * 获取当前天气
   */
  getCurrentWeather(params: WeatherParams): Promise<WeatherData> {
    return apiService.get<WeatherData>('/weather/current', { params })
  },

  /**
   * 获取天气预报
   */
  getWeatherForecast(params: WeatherParams): Promise<WeatherForecast[]> {
    return apiService.get<WeatherForecast[]>('/weather/forecast', { params })
  },

  /**
   * 根据IP获取天气
   */
  getWeatherByIP(): Promise<WeatherData> {
    return apiService.get<WeatherData>('/weather/ip')
  },

  /**
   * 搜索城市
   */
  searchCities(keyword: string): Promise<CityInfo[]> {
    return apiService.get<CityInfo[]>('/weather/cities/search', { 
      params: { keyword } 
    })
  },

  /**
   * 获取热门城市列表
   */
  getPopularCities(): Promise<CityInfo[]> {
    return apiService.get<CityInfo[]>('/weather/cities/popular')
  },

  /**
   * 获取用户关注的城市天气
   */
  getFollowedCitiesWeather(): Promise<WeatherData[]> {
    return apiService.get<WeatherData[]>('/weather/followed')
  },

  /**
   * 添加关注城市
   */
  followCity(data: FollowCityData): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/weather/follow', data)
  },

  /**
   * 取消关注城市
   */
  unfollowCity(cityId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/weather/follow/${cityId}`)
  },

  /**
   * 获取历史天气
   */
  getHistoricalWeather(params: HistoricalWeatherParams): Promise<WeatherData> {
    return apiService.get<WeatherData>('/weather/historical', { params })
  },

  /**
   * 获取天气预警
   */
  getWeatherAlerts(params: { city: string }): Promise<WeatherAlert[]> {
    return apiService.get<WeatherAlert[]>('/weather/alerts', { params })
  },

  /**
   * 获取空气质量
   */
  getAirQuality(params: WeatherParams): Promise<AirQuality> {
    return apiService.get<AirQuality>('/weather/air-quality', { params })
  },

  /**
   * 获取生活指数
   */
  getLifeIndex(params: { city: string }): Promise<LifeIndex> {
    return apiService.get<LifeIndex>('/weather/life-index', { params })
  },

  /**
   * 获取天气配置
   */
  getWeatherConfig(): Promise<WeatherConfig> {
    return apiService.get<WeatherConfig>('/weather/config')
  },

  /**
   * 更新天气配置
   */
  updateWeatherConfig(data: Partial<WeatherConfig>): Promise<WeatherConfig> {
    return apiService.put<WeatherConfig>('/weather/config', data)
  }
}
