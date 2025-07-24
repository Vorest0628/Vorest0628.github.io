<template>
  <div class="admin-user-manager">
    <div class="manager-header">
      <h2>用户管理</h2>
    </div>

    <!-- 筛选选项 -->
    <div class="filter-bar">
      <select v-model="roleFilter" @change="filterUsers">
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="user">普通用户</option>
      </select>
      <select v-model="statusFilter" @change="filterUsers">
        <option value="">全部状态</option>
        <option value="approved">已启用</option>
        <option value="pending">待审核</option>
      </select>
      <input
        v-model="searchQuery"
        placeholder="搜索用户名或邮箱..."
        @input="filterUsers"
      />
    </div>

    <!-- 用户列表 -->
    <div v-if="loading" class="loading-state">
      <p>正在加载用户数据...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="getUsers" class="retry-btn">重试</button>
    </div>
    
    <div v-else class="users-table">
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedUsers" :key="user._id || user.id" :class="{ 'pending-user': user.status === 'pending' }">
            <td>
              <div class="user-info">
                <div class="username">
                  <span v-if="user.status === 'pending'" class="pending-dot"></span>
                  {{ user.username }}
                </div>
                <div class="user-id">ID: {{ user._id || user.id }}</div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-badge', user.role]">
                {{ getRoleText(user.role) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', user.status]">
                {{ getStatusText(user.status) }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt || user.registerTime) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="editUser(user)" class="edit-btn">编辑</button>
                <button 
                  v-if="user.status === 'pending'"
                  @click="approveUser(user._id || user.id)" 
                  class="approve-btn"
                >
                  启用
                </button>
                <button 
                  v-if="user.role !== 'admin' || user._id !== currentUserId" 
                  @click="deleteUser(user._id || user.id)" 
                  class="delete-btn"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && filteredUsers.length === 0" class="empty-state">
      <h3>暂无用户数据</h3>
      <p>没有找到符合条件的用户</p>
    </div>

    <!-- 编辑模态框 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="currentUser.username" type="text" required />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="currentUser.email" type="email" required />
            </div>
            <div class="form-group">
              <label>密码</label>
              <div class="password-input-group">
                <input v-model="currentUser.password" type="password" placeholder="留空则不修改密码" />
                <button type="button" @click="resetPassword" class="reset-password-btn">重置密码</button>
              </div>
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model="currentUser.role" required>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="currentUser.status">
                <option value="pending">待审核</option>
                <option value="approved">已启用</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-btn">取消</button>
              <button type="submit" class="save-btn">更新</button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { adminApi } from '../../../api/admin'
import { authStorage } from '../../../utils/auth'

const users = ref([])
const filteredUsers = ref([])
const showEditModal = ref(false)
const loading = ref(false)
const error = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const searchQuery = ref('')

const currentUser = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'user',
  status: 'pending'
})

// 获取当前用户ID
const currentUserId = computed(() => {
  const { user } = authStorage.getAuth()
  return user?._id || user?.id
})

// 排序用户：待审核用户优先显示
const sortedUsers = computed(() => {
  return [...filteredUsers.value].sort((a, b) => {
    // 待审核用户排在前面
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    // 其他情况按注册时间降序
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })
})

// 获取用户列表
const getUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await adminApi.getAllUsers()
    if (response.success) {
      // 处理用户数据
      const userData = (response.data.users || response.data || []).map(user => ({
        ...user,
        status: user.status || (user.active !== false ? 'approved' : 'pending')
      }))
      
      users.value = userData
      filteredUsers.value = userData
    } else {
      throw new Error(response.message || '获取用户列表失败')
    }
  } catch (err) {
    console.error('❌ 获取用户列表失败:', err)
    error.value = err.message || '获取用户列表失败，请稍后重试'
    
    // 设置模拟数据进行测试
    const mockData = [
      {
        _id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'user',
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '3',
        username: 'alice',
        email: 'alice@example.com',
        role: 'user',
        status: 'approved',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
    
    users.value = mockData
    filteredUsers.value = mockData
  } finally {
    loading.value = false
  }
}



// 过滤用户
const filterUsers = () => {
  let filtered = users.value

  // 角色过滤
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value)
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(user => user.status === statusFilter.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  filteredUsers.value = filtered
}

// 编辑用户
const editUser = (user) => {
  Object.assign(currentUser, {
    id: user._id || user.id,
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
    status: user.status
  })
  showEditModal.value = true
}

// 重置密码
const resetPassword = () => {
  if (confirm('确定要重置此用户的密码为 123456 吗？')) {
    currentUser.password = '123456'
    alert('密码已设置为 123456')
  }
}

// 启用用户
const approveUser = async (id) => {
  if (!confirm('确定要启用此用户吗？')) return

  try {
    const response = await adminApi.updateUserRole(id, { status: 'approved' })
    if (response.success) {
      await getUsers()
      alert('用户已启用!')
    }
  } catch (error) {
    console.error('启用失败:', error)
    alert('启用失败: ' + (error.response?.data?.message || error.message))
  }
}

// 保存用户
const saveUser = async () => {
  try {
    const userData = {
      username: currentUser.username,
      email: currentUser.email,
      role: currentUser.role,
      status: currentUser.status
    }

    if (currentUser.password) {
      userData.password = currentUser.password
    }

    const response = await adminApi.updateUserRole(currentUser.id, userData)
    if (response.success) {
      alert('用户更新成功!')
      await getUsers()
      closeModal()
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error.response?.data?.message || error.message))
  }
}

// 删除用户
const deleteUser = async (id) => {
  if (!confirm('确定要删除此用户吗？此操作将删除该用户的所有博客、评论等数据，不可恢复！')) return

  try {
    const response = await adminApi.deleteUser(id)
    if (response.success) {
      await getUsers()
      alert('用户删除成功!')
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

// 关闭模态框
const closeModal = () => {
  showEditModal.value = false
  Object.assign(currentUser, {
    id: null,
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'pending'
  })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN')
}

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    admin: '管理员',
    user: '普通用户'
  }
  return roleMap[role] || role
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    approved: '已启用',
    pending: '待审核'
  }
  return statusMap[status] || status
}

onMounted(() => {
  getUsers()
})
</script>

<style scoped>
.admin-user-manager {
  height: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.manager-header h2 {
  color: #333;
  margin: 0;
}



.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-bar select,
.filter-bar input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.filter-bar input {
  min-width: 300px;
}

.users-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

/* 待审核用户行高亮 */
.pending-user {
  background-color: #fff3cd !important;
}

.pending-user:hover {
  background-color: #ffeaa7 !important;
}

.user-info .username {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pending-dot {
  width: 8px;
  height: 8px;
  background-color: #dc3545;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.user-info .user-id {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-badge.admin {
  background: #dc3545;
  color: white;
}

.role-badge.user {
  background: #007bff;
  color: white;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.edit-btn {
  background: #007bff;
  color: white;
}

.edit-btn:hover {
  background: #0056b3;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.approve-btn:hover {
  background: #218838;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
}

.error-state h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
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

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}

.password-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.password-input-group input {
  flex: 1;
}

.reset-password-btn {
  padding: 0.5rem 1rem;
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background 0.3s;
}

.reset-password-btn:hover {
  background: #e0a800;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn,
.save-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #545b62;
}

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover {
  background: #218838;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }

  .filter-bar input {
    min-width: auto;
  }

  .users-table {
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
  }
  
  .password-input-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 