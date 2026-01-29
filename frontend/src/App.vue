<template>
  <div>
    <!-- 自定义鼠标组件 -->
    <CustomCursor 
      :dot-size="20"
      :expanded-size="40"
      dot-color="snow"
      ring-color="rgba(0, 117, 176, 0.9)"
      :transition-duration="200"
      :smooth-follow="false"
      :smooth-factor="0.95"
      :opacity="0.5"
    />
    
    <router-view />
  </div>
</template>

<script setup>
import CustomCursor from '@/components/style/CustomCursor.vue'
</script>
<style>
/* 全局样式 */
html {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 16px;
  background: 
    linear-gradient(to bottom, rgba(125, 185, 232, 0.7), rgba(30, 87, 153, 0.7)),
    url('/background-bottom.jpg') no-repeat bottom center fixed;
  background-size: 100% 100%, 100% auto;
  background-attachment: fixed;
  min-height: 100vh;
}

body {
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

/* 全局链接样式 */
a {
  text-decoration: none;
  color: skyblue;
}

a:hover {
  color: #66b1ff;
}

/* 全局按钮样式 */
button {
  cursor: pointer;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

/* 全局输入框样式 */
input {
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: skyblue;
}

header {
  line-height: 1.5;
  max-height: 100vh;
  padding: 1rem;
  background-color: var(--color-background-soft);
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

.wrapper {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

nav {
  width: 100%;
  font-size: 1rem;
  text-align: center;
  margin-top: 1rem;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
  color: var(--color-text);
  text-decoration: none;
  transition: color 0.3s;
}

nav a:first-of-type {
  border: 0;
}

nav a:hover {
  color: var(--color-primary);
}

nav a.router-link-active {
  color: var(--color-primary);
  font-weight: bold;
}

main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

/* 自定义鼠标相关样式已移至 CustomCursor.vue 组件 */

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
