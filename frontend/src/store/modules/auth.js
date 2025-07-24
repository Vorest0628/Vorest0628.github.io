import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, authStorage } from '../../api/auth'

/**
 * 认证状态管理
 * 使用Pinia实现，提供：
 * 1. 用户状态管理
 * 2. 认证方法
 * 3. 状态持久化
 */
export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const loading = ref(true)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  /**
   * 初始化认证状态
   * 在应用启动时调用
   */
  const initAuth = async () => {
    try {
      if (authStorage.isAuthenticated()) {
        const { data } = await authApi.getCurrentUser()
        user.value = data.user
      }
    } catch (error) {
      console.error('认证初始化失败:', error)
      authStorage.clearAuth()
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise} 注册结果
   */
  const register = async (userData) => {
    const { data } = await authApi.register(userData)
    authStorage.setAuth(data.token, data.user)
    user.value = data.user
    return data
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @returns {Promise} 登录结果
   */
  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    authStorage.setAuth(data.token, data.user)
    user.value = data.user
    return data
  }

  /**
   * 用户登出
   */
  const logout = () => {
    authStorage.clearAuth()
    user.value = null
  }

  /**
   * 更新用户信息
   * @param {Object} newUserData - 新的用户数据
   */
  const updateUser = (newUserData) => {
    user.value = { ...user.value, ...newUserData }
    authStorage.setAuth(authStorage.getAuth().token, user.value)
  }

  return {
    // 状态
    user,
    loading,
    // 计算属性
    isAuthenticated,
    isAdmin,
    // 方法
    initAuth,
    register,
    login,
    logout,
    updateUser
  }
})