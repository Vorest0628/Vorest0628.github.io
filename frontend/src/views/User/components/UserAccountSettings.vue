<template>
  <div class="user-account-settings">
    <div class="settings-header">
      <h2>账户设置</h2>
      <p>管理您的个人资料和账户安全</p>
    </div>

    <div class="settings-sections">
      <!-- 个人资料 -->
      <div class="setting-section">
        <h3>个人资料</h3>
        <div class="setting-content">
          <form @submit.prevent="updateProfile">
            <div class="form-row">
              <div class="form-group">
                <label>用户名</label>
                <input v-model="profileForm.username" type="text" readonly class="readonly" />
                <small>用户名无法修改</small>
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input v-model="profileForm.email" type="email" required />
              </div>
            </div>
            <button type="submit" class="save-btn" :disabled="profileLoading">
              {{ profileLoading ? '保存中...' : '保存资料' }}
            </button>
          </form>
        </div>
      </div>

      <!-- 密码修改 -->
      <div class="setting-section">
        <h3>密码安全</h3>
        <div class="setting-content">
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label>当前密码</label>
              <input v-model="passwordForm.currentPassword" type="password" required />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="passwordForm.newPassword" type="password" required minlength="6" />
              <small>密码至少6位</small>
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="passwordForm.confirmPassword" type="password" required />
              <small v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="error">
                两次输入的密码不一致
              </small>
            </div>
            <div class="form-actions">
              <button type="submit" class="save-btn" :disabled="passwordLoading || !canChangePassword">
                {{ passwordLoading ? '修改中...' : '修改密码' }}
              </button>
              <button type="button" @click="showResetPassword = true" class="forgot-btn">
                忘记密码？
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 密码重置模态框 -->
      <div v-if="showResetPassword" class="modal-overlay" @click="closeResetPassword">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>重置密码</h3>
            <button @click="closeResetPassword" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="resetPassword">
              <div class="form-group">
                <label>邮箱地址</label>
                <input v-model="resetForm.email" type="email" required placeholder="输入您的邮箱地址" />
              </div>
              <div class="form-group">
                <label>新密码</label>
                <input v-model="resetForm.newPassword" type="password" required minlength="6" />
                <small>密码至少6位</small>
              </div>
              <div class="form-group">
                <label>确认新密码</label>
                <input v-model="resetForm.confirmPassword" type="password" required />
                <small v-if="resetForm.newPassword && resetForm.confirmPassword && resetForm.newPassword !== resetForm.confirmPassword" class="error">
                  两次输入的密码不一致
                </small>
              </div>
              <div class="form-actions">
                <button type="button" @click="closeResetPassword" class="cancel-btn">取消</button>
                <button type="submit" class="save-btn" :disabled="resetLoading || !canResetPassword">
                  {{ resetLoading ? '重置中...' : '重置密码' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { userApi } from '@/api/user'

const authStore = useAuthStore()

const profileForm = ref({
  username: '',
  email: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const resetForm = ref({
  email: '',
  newPassword: '',
  confirmPassword: ''
})

const profileLoading = ref(false)
const passwordLoading = ref(false)
const showResetPassword = ref(false)
const resetLoading = ref(false)

const canChangePassword = computed(() => {
  return passwordForm.value.currentPassword && 
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 6
})

const canResetPassword = computed(() => {
  return resetForm.value.email &&
         resetForm.value.newPassword &&
         resetForm.value.confirmPassword &&
         resetForm.value.newPassword === resetForm.value.confirmPassword &&
         resetForm.value.newPassword.length >= 6
})

// 加载用户数据
const loadUserData = async () => {
  try {
    // 从认证store获取基本信息
    const user = authStore.user
    if (user) {
      profileForm.value = {
        username: user.username || '',
        email: user.email || ''
      }
    }
  } catch (error) {
    console.error('加载用户数据失败:', error)
  }
}

// 更新个人资料
const updateProfile = async () => {
  profileLoading.value = true
  try {
    const { username, ...updateData } = profileForm.value
    const response = await userApi.updateProfile(updateData)
    if (response.success) {
      alert('个人资料更新成功！')
      // 更新认证store中的用户信息
      await authStore.initAuth()
    } else {
      throw new Error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新资料失败:', error)
    alert('更新失败：' + (error.response?.data?.message || error.message || '请重试'))
  } finally {
    profileLoading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  passwordLoading.value = true
  try {
    const { confirmPassword, ...data } = passwordForm.value
    const response = await userApi.changePassword(data)
    if (response.success) {
      alert('密码修改成功！')
      // 清空表单
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    } else {
      throw new Error(response.message || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    const errorMessage = error.response?.data?.message || error.message || '修改密码失败，请重试'
    alert('修改密码失败：' + errorMessage)
  } finally {
    passwordLoading.value = false
  }
}

// 重置密码
const resetPassword = async () => {
  resetLoading.value = true
  try {
    const response = await userApi.resetPassword(resetForm.value)
    if (response.success) {
      alert('密码重置成功！请检查您的邮箱，并使用新密码登录。')
      // 清空表单
      resetForm.value = {
        email: '',
        newPassword: '',
        confirmPassword: ''
      }
    } else {
      throw new Error(response.message || '重置失败')
    }
  } catch (error) {
    console.error('重置密码失败:', error)
    const errorMessage = error.response?.data?.message || error.message || '重置密码失败，请重试'
    alert('重置密码失败：' + errorMessage)
  } finally {
    resetLoading.value = false
  }
}

const closeResetPassword = () => {
  showResetPassword.value = false
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.user-account-settings {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 30px;
  text-align: center;
}

.settings-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.settings-header p {
  color: #666;
  margin: 0;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.setting-section {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.setting-section h3 {
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
  color: white;
  margin: 0;
  padding: 15px 20px;
  font-size: 1.1rem;
}

.setting-content {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #36d1dc;
}

.form-group input.readonly {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.9rem;
}

.form-group small.error {
  color: #dc3545;
}

.save-btn {
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(54, 209, 220, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.form-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.forgot-btn {
  background: none;
  border: none;
  color: #36d1dc;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  padding: 0;
}

.forgot-btn:hover {
  color: #2bb8c4;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #5a6268;
}



@media (max-width: 768px) {
  .user-account-settings {
    padding: 15px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style> 