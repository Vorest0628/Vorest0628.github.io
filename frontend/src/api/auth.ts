import { apiService } from '../services/api'
import type { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse, 
  AuthResponse, 
  PasswordChangeData, 
  ProfileUpdateData, 
  UploadResponse,
  ForgotPasswordData,
  PasswordResetData,
  User
} from '../types/api'

/*
AuthApi输出函数一览：
register 用户注册
login 用户登录
getCurrentUser 获取当前用户信息
refreshToken 刷新令牌
changePassword 修改密码
updateProfile 更新用户资料
uploadAvatar 上传头像
forgotPassword 忘记密码
resetPassword 重置密码
logout 退出登录
*/

/*
authStorage输出函数一览：
setAuth 保存认证信息
getAuth 获取认证信息
clearAuth 清除认证信息
isAuthenticated 检查是否已认证
isAdmin 检查是否为管理员
*/

/**
 * 认证相关的API请求
 */
export const authApi = {
  /**
   * 用户注册
   */
  register(userData: RegisterData): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/register', userData)
  },

  /**
   * 用户登录
   */
  login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', credentials)
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<AuthResponse> {
    return apiService.get<AuthResponse>('/auth/me')
  },

  /**
   * 刷新令牌
   */
  refreshToken(): Promise<{ token: string }> {
    return apiService.post<{ token: string }>('/auth/refresh')
  },

  /**
   * 修改密码
   */
  changePassword(passwordData: PasswordChangeData): Promise<{ success: boolean; message: string }> {
    return apiService.put<{ success: boolean; message: string }>('/auth/password', passwordData)
  },

  /**
   * 更新用户资料
   */
  updateProfile(userData: ProfileUpdateData): Promise<{ user: User }> {
    return apiService.put<{ user: User }>('/auth/profile', userData)
  },

  /**
   * 上传头像
   */
  uploadAvatar(formData: FormData): Promise<UploadResponse> {
    return apiService.upload<UploadResponse>('/auth/avatar', formData)
  },

  /**
   * 忘记密码
   */
  forgotPassword(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/auth/forgot-password', data)
  },

  /**
   * 重置密码
   */
  resetPassword(data: PasswordResetData): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/auth/reset-password', data)
  },

  /**
   * 退出登录
   */
  logout(): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/auth/logout')
  }
}

/**
 * 本地存储管理
 */
export const authStorage = {
  /**
   * 保存认证信息
   */
  setAuth(token: string, user: User): void {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    console.log('💾 认证信息已保存')
  },

  /**
   * 获取认证信息
   */
  getAuth(): { token: string | null; user: User | null } {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    return { 
      token, 
      user: userStr ? JSON.parse(userStr) as User : null 
    }
  },

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    console.log('🗑️ 认证信息已清除')
  },

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  /**
   * 检查是否为管理员
   */
  isAdmin(): boolean {
    const { user } = this.getAuth()
    return user?.role === 'admin'
  }
}

