<template>
  <div class="admin-user-manager">
    <h3>用户管理</h3>
    <p>管理系统用户和权限</p>
    
    <div class="user-list">
      <div v-for="user in users" :key="user.id" class="user-item">
        <div class="user-info">
          <h4>{{ user.username }}</h4>
          <p>{{ user.email }}</p>
          <span class="role-badge" :class="user.role">{{ user.role }}</span>
        </div>
        <div class="user-actions">
          <button @click="toggleUserStatus(user)" class="action-btn">
            {{ user.active ? '禁用' : '启用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])

const loadUsers = async () => {
  // 模拟加载用户数据
  users.value = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', active: true },
    { id: 2, username: 'alice', email: 'alice@example.com', role: 'user', active: true },
    { id: 3, username: 'bob', email: 'bob@example.com', role: 'user', active: true }
  ]
}

const toggleUserStatus = (user) => {
  user.active = !user.active
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-user-manager {
  padding: 20px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-info h4 {
  margin: 0 0 5px 0;
}

.user-info p {
  margin: 0 0 5px 0;
  color: #666;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-badge.admin {
  background: #dc3545;
  color: white;
}

.role-badge.user {
  background: #28a745;
  color: white;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  background: #007bff;
  color: white;
}
</style> 