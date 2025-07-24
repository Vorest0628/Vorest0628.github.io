<!-- 
  Navigation组件
  功能：
  1. 提供主导航菜单
  2. 实现搜索功能
  3. 响应式设计
-->
<template>
  <nav class="main-nav">
    <ul>
      <li><router-link to="/" @click="debugRoute('/')">主页</router-link></li>
      <li><router-link to="/blog" @click="debugRoute('/blog')">博客</router-link></li>
      <li><router-link to="/comments" @click="debugRoute('/comments')">评论</router-link></li>
      <li><router-link to="/friends" @click="debugRoute('/friends')">友情链接</router-link></li>
      <li><router-link to="/particles-demo" @click="debugRoute('/particles-demo')">粒子演示</router-link></li>

      <!-- 搜索框 -->
      <li class="search">
        <form class="search-form" @submit.prevent="handleSearch">
          <input 
            type="search" 
            v-model="searchQuery" 
            placeholder="搜索博客或文档..."
          >
          <input type="submit" value="搜索">
        </form>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

// 调试函数
const debugRoute = (path) => {
  console.log(`点击导航链接: ${path}`)
  console.log('当前路由:', router.currentRoute.value.path)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      name: 'search',
      query: { q: searchQuery.value.trim() }
    }).catch(err => {
      console.error('路由跳转失败:', err)
    })
    searchQuery.value = ''
  }
}
</script>

<style scoped>
/* 导航栏样式: 结合Grid定位和Flexbox内部布局 */
.main-nav {
    grid-area: nav;
  background-color: rgba(245, 245, 245, 0.95); /* 添加轻微透明度 */
    border-radius: 5px;
  padding: 20px; /* 统一与Header相同的内边距 */
  border: 3px solid skyblue; /* 减少边框粗细 */
    position: sticky;
  top: 5px;
  z-index: 100; /* 确保导航栏始终在其他内容之上 */
  backdrop-filter: blur(5px); /* 背景模糊效果 */
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); /* 添加阴影 */
  box-sizing: border-box; /* 确保边框包含在宽度计算内 */
  margin: 0; /* 显式重置margin，解决负margin问题 */
  }
  
  /* 导航列表: 使用Flexbox创建水平导航菜单 */
  .main-nav ul {
    list-style: none; /* 列表样式: 移除默认的列表符号 */
    display: flex;
    gap: 20px; /* Flexbox间距: 使用gap属性设置Flex项目间距 */
    flex-wrap: wrap;
  justify-content: space-between; /* 正确位置：在flex容器中设置 */
    align-items: center;
  margin: 0; /* 显式重置margin */
  padding: 0; /* 显式重置padding */
  }

  /* 导航链接: 样式化导航元素 */
  .main-nav ul li a {
  color: rgb(45, 167, 224); /* 使用与Header一致的蓝色 */
    text-decoration: none; /* 文本装饰: 移除链接下划线 */
  padding: 8px 16px; /* 增加内边距 */
  border-radius: 6px; /* 增加圆角 */
  transition: all 0.3s ease; /* 过渡效果: 平滑背景色变化 */
  display: flex;
    justify-content: center;
    align-items: center;
  min-width: 80px; /* 减少最小宽度 */
  font-weight: 500;
  border: 2px solid transparent; /* 添加透明边框为悬停效果预留空间 */
  }

/* 让前面的导航链接形成一组 */
.main-nav ul li:not(.search) {
    display: flex; /* 创建一个flex容器 */
  }

  /* 包含搜索框的列表项 */
.main-nav ul li.search {
    margin-left: auto; /* 自动将此项推到右侧 */
  padding-top: 0; /* 移除额外的padding */
  }
  
  /* 伪类选择器: 定义链接悬停状态的样式 */
  .main-nav ul li a:hover {
  background-color: rgb(45, 167, 224);
  color: white;
  border-color: rgb(45, 167, 224);
  transform: translateY(-1px); /* 轻微上移效果 */
  box-shadow: 0 2px 8px rgba(45, 167, 224, 0.3);
  }

  /* 搜索表单: 使用Flexbox布局搜索框和按钮 */
  .search-form {
    display: flex;
  gap: 8px;
  align-items: center;
  }
  
  /* 属性选择器: 选择特定type属性值的input元素 */
  .search-form input[type="search"] {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
  min-width: 150px;
}

.search-form input[type="search"]:focus {
  outline: none;
  border-color: skyblue;
  }
  
  .search-form input[type="submit"] {
    background-color: skyblue;
    color: white;
    border: none;
  padding: 8px 12px;
  border-radius: 4px;
    cursor: pointer; /* 光标样式: 指示可点击元素 */
  font-size: 0.9rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.search-form input[type="submit"]:hover {
  background-color: rgb(45, 167, 224);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 167, 224, 0.3);
  }

/* 响应式设计 */
@media (max-width: 768px) {
  .main-nav {
    padding: 15px;
  }

  .main-nav ul {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .main-nav ul li:not(.search) {
    width: 100%;
  }

  .main-nav ul li a {
    width: 100%;
    min-width: auto;
    text-align: center;
  }

  .main-nav ul li.search {
    margin-left: 0;
    width: 100%;
  }

  .search-form {
    width: 100%;
  }

  .search-form input[type="search"] {
    flex: 1;
    min-width: auto;
  }
}
</style>
