<!-- 
  Footer组件
  功能：
  1. 显示页脚导航
  2. 显示版权信息
  3. 响应式设计
-->
<template>
  <footer class="main-footer">
    <div class="footer-content">
      <!-- 页脚导航 -->
      <div class="footer-nav">
        <ul>
          <li><router-link to="/about">关于</router-link></li>
          <li><router-link to="/gallery">图库</router-link></li>
          <li><router-link to="/documents">文档库</router-link></li>
        </ul>
      </div>

      <div class="footer-nav">
        <p>
          <a href="https://icp.gov.moe/?keyword=20257889" target="_blank">萌ICP备20257889号</a>
        </p>
      </div>
      
      <!-- 版权信息 -->
      <div class="copyright">
        <p>© {{ currentYear }} Vorest0628. All rights reserved.</p>
      </div>

      <!-- 社交媒体链接 -->
      <div class="social-links">
        <p>
        <a href="https://github.com/Vorest0628" target="_blank" rel="noopener">
          <i class="fab fa-github"></i>
        </a>
        <span> | </span>
        <a href="https://space.bilibili.com/276555959" target="_blank" rel="noopener">
          <i class="fab fa-bilibili"></i>
        </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* 页脚样式: 设置在Grid布局中的footer区域 */
.main-footer {
  grid-area: footer;
  background-color: rgba(255, 255, 255, 0.95); /* 添加轻微透明度 */
  color: rgb(45, 167, 224); /* 使用主题蓝色 */
  padding: 20px;
  border-radius: 5px;
  text-align: center; /* 文本对齐: 居中对齐页脚内容 */
  box-shadow: 0 2px 15px rgba(0,0,0,0.1); /* 增强阴影效果 */
  backdrop-filter: blur(5px); /* 背景模糊效果 */
  border: 1px solid rgba(135, 206, 235, 0.3); /* 添加轻微边框 */
  margin-top: auto; /* 确保页脚在底部 */
}

/* 页脚导航: 使用Flexbox创建水平居中的链接列表 */
.footer-nav ul {
  list-style: none;
  display: flex;
  justify-content: center; /* Flex对齐: 水平居中对齐 */
  gap: 30px; /* 增加间距 */
  margin-bottom: 10px;
  flex-wrap: wrap; /* 允许换行 */
}

.footer-nav ul li a {
  color: rgb(45, 167, 224); /* 使用主题蓝色 */
  text-decoration: none;
  padding: 8px 16px; /* 增加内边距 */
  border-radius: 6px;
  transition: all 0.3s ease; /* 过渡效果: 平滑背景色变化 */
  border: 2px solid transparent;
  font-weight: 500;
}

.footer-nav ul li a:hover {
  background-color: rgb(45, 167, 224);
  color: white;
  border-color: rgb(45, 167, 224);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 167, 224, 0.3);
}

.copyright {
  margin: 5px;
  color: #666;
  font-size: 1rem;
}

.social-links {
  font-size: 120%;
  color: #666;
}

.social-links a:visited i {
  color:inherit;
}

/* 版权信息 */
.footer-content {
  max-width: 600px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-footer {
    padding: 15px;
  }
  
  .footer-nav ul {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
  
  .footer-nav ul li a {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .footer-content p {
    font-size: 0.8rem;
  }
}
</style>