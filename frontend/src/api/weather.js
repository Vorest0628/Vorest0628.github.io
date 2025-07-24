import { apiService } from '../services/api'

/**
 * 天气相关的API请求
 */
export const weatherApi = {
  /**
   * 获取当前天气
   * @param {Object} params - 查询参数
   * @param {string} params.city - 城市名称
   * @param {number} params.lat - 纬度
   * @param {number} params.lon - 经度
   * @returns {Promise} 返回当前天气数据
   */
  getCurrentWeather(params) {
    return apiService.get('/weather/current', { params })
  },

  /**
   * 获取天气预报
   * @param {Object} params - 查询参数
   * @param {string} params.city - 城市名称
   * @param {number} params.lat - 纬度
   * @param {number} params.lon - 经度
   * @param {number} params.days - 预报天数（默认7天）
   * @returns {Promise} 返回天气预报数据
   */
  getWeatherForecast(params) {
    return apiService.get('/weather/forecast', { params })
  },

  /**
   * 根据IP获取天气
   * @returns {Promise} 返回基于IP位置的天气数据
   */
  getWeatherByIP() {
    return apiService.get('/weather/ip')
  },

  /**
   * 搜索城市
   * @param {string} keyword - 搜索关键词
   * @returns {Promise} 返回城市搜索结果
   */
  searchCities(keyword) {
    return apiService.get('/weather/cities/search', { 
      params: { keyword } 
    })
  },

  /**
   * 获取热门城市列表
   * @returns {Promise} 返回热门城市列表
   */
  getPopularCities() {
    return apiService.get('/weather/cities/popular')
  },

  /**
   * 获取用户关注的城市天气
   * @returns {Promise} 返回关注城市的天气数据
   */
  getFollowedCitiesWeather() {
    return apiService.get('/weather/followed')
  },

  /**
   * 添加关注城市
   * @param {Object} data - 城市数据
   * @param {string} data.cityName - 城市名称
   * @param {string} data.cityCode - 城市代码
   * @param {number} data.lat - 纬度
   * @param {number} data.lon - 经度
   * @returns {Promise} 返回添加结果
   */
  followCity(data) {
    return apiService.post('/weather/follow', data)
  },

  /**
   * 取消关注城市
   * @param {string} cityId - 城市ID
   * @returns {Promise} 返回取消关注结果
   */
  unfollowCity(cityId) {
    return apiService.delete(`/weather/follow/${cityId}`)
  },

  /**
   * 获取历史天气
   * @param {Object} params - 查询参数
   * @param {string} params.city - 城市名称
   * @param {string} params.date - 日期 (YYYY-MM-DD)
   * @returns {Promise} 返回历史天气数据
   */
  getHistoricalWeather(params) {
    return apiService.get('/weather/historical', { params })
  },

  /**
   * 获取天气预警
   * @param {Object} params - 查询参数
   * @param {string} params.city - 城市名称
   * @returns {Promise} 返回天气预警数据
   */
  getWeatherAlerts(params) {
    return apiService.get('/weather/alerts', { params })
  },

  /**
   * 获取空气质量
   * @param {Object} params - 查询参数
   * @param {string} params.city - 城市名称
   * @param {number} params.lat - 纬度
   * @param {number} params.lon - 经度
   * @returns {Promise} 返回空气质量数据
   */
  getAirQuality(params) {
    return apiService.get('/weather/air-quality', { params })
  },

  /**
   * 获取生活指数
   * @param {Object} params - 查询参数
   * @param {string} params.city - 城市名称
   * @returns {Promise} 返回生活指数数据
   */
  getLifeIndex(params) {
    return apiService.get('/weather/life-index', { params })
  },

  /**
   * 获取天气配置
   * @returns {Promise} 返回天气配置信息
   */
  getWeatherConfig() {
    return apiService.get('/weather/config')
  },

  /**
   * 更新天气配置
   * @param {Object} data - 配置数据
   * @returns {Promise} 返回更新结果
   */
  updateWeatherConfig(data) {
    return apiService.put('/weather/config', data)
  }
}
