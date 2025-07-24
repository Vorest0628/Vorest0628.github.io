<!--
  登录/注册模态框组件
  功能：
  1. 用户登录表单
  2. 用户注册表单
  3. 登录/注册切换
  4. 表单验证
  5. 错误处理
  6. 响应式设计
-->
<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isLoginMode ? '用户登录' : '用户注册' }}</h3>
        <button class="close-btn" @click="$emit('close')" title="关闭">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 登录/注册切换标签 -->
      <div class="mode-tabs">
        <button 
          @click="isLoginMode = true" 
          :class="{ active: isLoginMode }"
          class="mode-tab"
          :disabled="loading"
        >
          <i class="fas fa-sign-in-alt"></i>
          登录
        </button>
        <button 
          @click="isLoginMode = false" 
          :class="{ active: !isLoginMode }"
          class="mode-tab"
          :disabled="loading"
        >
          <i class="fas fa-user-plus"></i>
          注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="isLoginMode" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="loading"
            @blur="validateLoginUsername"
          />
          <span v-if="loginErrors.username" class="error-message">{{ loginErrors.username }}</span>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
              id="password"
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              required
              :disabled="loading"
              @blur="validateLoginPassword"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
              title="显示/隐藏密码"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span v-if="loginErrors.password" class="error-message">{{ loginErrors.password }}</span>
        </div>

        <div v-if="errorMessage" class="error-banner">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" :disabled="loading" class="cancel-btn">
            取消
          </button>
          <button type="submit" :disabled="loading || !isLoginFormValid" class="submit-btn">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="reg-username">用户名</label>
          <input
            id="reg-username"
            v-model="registerForm.username"
            type="text"
            placeholder="请输入用户名（2-20个字符）"
            required
            :disabled="loading"
            @blur="validateRegisterUsername"
          />
          <span v-if="registerErrors.username" class="error-message">{{ registerErrors.username }}</span>
        </div>

        <div class="form-group">
          <label for="reg-email">邮箱</label>
          <input
            id="reg-email"
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            required
            :disabled="loading"
            @blur="validateEmail"
          />
          <span v-if="registerErrors.email" class="error-message">{{ registerErrors.email }}</span>
        </div>

        <div class="form-group">
          <label for="reg-password">密码</label>
          <div class="password-input">
            <input
              id="reg-password"
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码（至少6个字符）"
              required
              :disabled="loading"
              @blur="validateRegisterPassword"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
              title="显示/隐藏密码"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span v-if="registerErrors.password" class="error-message">{{ registerErrors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirm-password">确认密码</label>
          <div class="password-input">
            <input
              id="confirm-password"
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              required
              :disabled="loading"
              @blur="validateConfirmPassword"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="loading"
              title="显示/隐藏密码"
            >
              <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span v-if="registerErrors.confirmPassword" class="error-message">{{ registerErrors.confirmPassword }}</span>
        </div>

        <div v-if="errorMessage" class="error-banner">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" :disabled="loading" class="cancel-btn">
            取消
          </button>
          <button type="submit" :disabled="loading || !isRegisterFormValid" class="submit-btn">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </div>
      </form>

      <!-- 提示信息 -->
      <div class="auth-tips">
        <div v-if="isLoginMode">
          <p><i class="fas fa-info-circle"></i> 提示：默认管理员账户</p>
          <p>用户名：admin，密码：admin123456</p>
        </div>
        <div v-else>
          <p><i class="fas fa-info-circle"></i> 注册后自动登录</p>
          <p>请使用真实邮箱地址，方便找回密码</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/modules/auth'

// 组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 组件事件
const emit = defineEmits(['close', 'success'])

// 使用认证store
const authStore = useAuthStore()

// 响应式数据
const isLoginMode = ref(true)
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 登录表单数据
const loginForm = ref({
  username: '',
  password: ''
})

// 注册表单数据
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 登录表单错误
const loginErrors = ref({
  username: '',
  password: ''
})

// 注册表单错误
const registerErrors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 计算属性
const isLoginFormValid = computed(() => {
  return loginForm.value.username.trim().length >= 2 && 
         loginForm.value.password.length >= 6 &&
         !loginErrors.value.username && 
         !loginErrors.value.password
})

const isRegisterFormValid = computed(() => {
  return registerForm.value.username.trim().length >= 2 &&
         registerForm.value.email.trim() &&
         registerForm.value.password.length >= 6 &&
         registerForm.value.confirmPassword &&
         registerForm.value.password === registerForm.value.confirmPassword &&
         !registerErrors.value.username &&
         !registerErrors.value.email &&
         !registerErrors.value.password &&
         !registerErrors.value.confirmPassword
})

// 验证方法
const validateLoginUsername = () => {
  const username = loginForm.value.username.trim()
  if (!username) {
    loginErrors.value.username = '用户名不能为空'
  } else if (username.length < 2) {
    loginErrors.value.username = '用户名至少需要2个字符'
  } else {
    loginErrors.value.username = ''
  }
}

const validateLoginPassword = () => {
  const password = loginForm.value.password
  if (!password) {
    loginErrors.value.password = '密码不能为空'
  } else if (password.length < 6) {
    loginErrors.value.password = '密码至少需要6个字符'
  } else {
    loginErrors.value.password = ''
  }
}

const validateRegisterUsername = () => {
  const username = registerForm.value.username.trim()
  if (!username) {
    registerErrors.value.username = '用户名不能为空'
  } else if (username.length < 2) {
    registerErrors.value.username = '用户名至少需要2个字符'
  } else if (username.length > 20) {
    registerErrors.value.username = '用户名不能超过20个字符'
  } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    registerErrors.value.username = '用户名只能包含字母、数字、下划线和中文'
  } else {
    registerErrors.value.username = ''
  }
}

const validateEmail = () => {
  const email = registerForm.value.email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    registerErrors.value.email = '邮箱不能为空'
  } else if (!emailRegex.test(email)) {
    registerErrors.value.email = '请输入有效的邮箱地址'
  } else {
    registerErrors.value.email = ''
  }
}

const validateRegisterPassword = () => {
  const password = registerForm.value.password
  if (!password) {
    registerErrors.value.password = '密码不能为空'
  } else if (password.length < 6) {
    registerErrors.value.password = '密码至少需要6个字符'
  } else if (password.length > 50) {
    registerErrors.value.password = '密码不能超过50个字符'
  } else {
    registerErrors.value.password = ''
  }
  
  // 重新验证确认密码
  if (registerForm.value.confirmPassword) {
    validateConfirmPassword()
  }
}

const validateConfirmPassword = () => {
  const password = registerForm.value.password
  const confirmPassword = registerForm.value.confirmPassword
  
  if (!confirmPassword) {
    registerErrors.value.confirmPassword = '请确认密码'
  } else if (password !== confirmPassword) {
    registerErrors.value.confirmPassword = '两次输入的密码不一致'
  } else {
    registerErrors.value.confirmPassword = ''
  }
}

// 处理登录
const handleLogin = async () => {
  // 先验证表单
  validateLoginUsername()
  validateLoginPassword()
  
  if (!isLoginFormValid.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const credentials = {
      username: loginForm.value.username,
      password: loginForm.value.password
    }

    await authStore.login(credentials)
    
    // 登录成功
    emit('success')
    emit('close')
    
    // 清空表单
    resetForms()
    
  } catch (error) {
    console.error('登录失败:', error)
    
    // 处理不同类型的错误
    if (error.response?.status === 401) {
      errorMessage.value = '用户名或密码错误'
    } else if (error.response?.status === 403) {
      errorMessage.value = '账户已被禁用'
    } else if (error.response?.status === 500) {
      errorMessage.value = '服务器错误，请稍后重试'
    } else {
      errorMessage.value = error.response?.data?.message || '登录失败，请检查网络连接'
    }
  } finally {
    loading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  // 先验证表单
  validateRegisterUsername()
  validateEmail()
  validateRegisterPassword()
  validateConfirmPassword()
  
  if (!isRegisterFormValid.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const userData = {
      username: registerForm.value.username.trim(),
      email: registerForm.value.email.trim(),
      password: registerForm.value.password
    }

    await authStore.register(userData)
    
    // 注册成功
    emit('success')
    emit('close')
    
    // 清空表单
    resetForms()
    
  } catch (error) {
    console.error('注册失败:', error)
    
    // 处理不同类型的错误
    if (error.response?.status === 400) {
      errorMessage.value = error.response?.data?.message || '注册信息有误'
    } else if (error.response?.status === 409) {
      errorMessage.value = '用户名或邮箱已被注册'
    } else if (error.response?.status === 500) {
      errorMessage.value = '服务器错误，请稍后重试'
    } else {
      errorMessage.value = error.response?.data?.message || '注册失败，请检查网络连接'
    }
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForms = () => {
  // 重置登录表单
  loginForm.value.username = ''
  loginForm.value.password = ''
  loginErrors.value.username = ''
  loginErrors.value.password = ''
  
  // 重置注册表单
  registerForm.value.username = ''
  registerForm.value.email = ''
  registerForm.value.password = ''
  registerForm.value.confirmPassword = ''
  registerErrors.value.username = ''
  registerErrors.value.email = ''
  registerErrors.value.password = ''
  registerErrors.value.confirmPassword = ''
  
  // 重置其他状态
  errorMessage.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
  isLoginMode.value = true
}

// 处理点击遮罩层
const handleOverlayClick = () => {
  if (!loading.value) {
    emit('close')
  }
}

// 监听visible变化，重置表单
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetForms()
  }
})

// 监听模式切换，清除错误信息
watch(isLoginMode, () => {
  errorMessage.value = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalShow 0.3s ease;
}

@keyframes modalShow {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.mode-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.mode-tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mode-tab:hover:not(:disabled) {
  background-color: #f8f9fa;
  color: #333;
}

.mode-tab.active {
  background-color: rgb(45, 167, 224);
  color: white;
  font-weight: 500;
}

.mode-tab:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.auth-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: rgb(45, 167, 224);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  font-size: 1rem;
}

.password-toggle:hover {
  color: #333;
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 4px;
}

.error-banner {
  background-color: #fdf2f2;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn, .submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 80px;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #e0e0e0;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #e9ecef;
}

.submit-btn {
  background-color: rgb(45, 167, 224);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: rgb(35, 147, 204);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.auth-tips {
  background-color: #f8f9fa;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.85rem;
  color: #666;
}

.auth-tips p {
  margin: 4px 0;
}

.auth-tips i {
  color: rgb(45, 167, 224);
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .auth-form,
  .auth-tips {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn, .submit-btn {
    width: 100%;
  }
  
  .mode-tab {
    font-size: 0.85rem;
  }
}
</style> 