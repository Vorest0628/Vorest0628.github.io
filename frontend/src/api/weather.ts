import { apiService } from '../services/api'
import type { 
  WeatherData, 
  WeatherForecast, 
  CityInfo, 
  WeatherParams 
} from '../types/api'

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

