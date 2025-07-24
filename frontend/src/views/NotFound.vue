<template>
    <div class="not-found">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在。</p>
      <router-link to="/" class="home-link">返回首页</router-link>
    </div>
  </template>
  
  <script setup>
  // 404页面组件
  </script>
  
  <style scoped>
  .not-found {
    text-align: center;
    padding: 50px 20px;
    color: #2c3e50;
  }
  
  .not-found h1 {
    font-size: 6rem;
    margin: 0;
    color: #42b983;
  }
  
  .not-found h2 {
    font-size: 2rem;
    margin: 20px 0;
  }
  
  .not-found p {
    font-size: 1.2rem;
    margin-bottom: 30px;
  }
  
  .home-link {
    display: inline-block;
    padding: 10px 20px;
    background-color: #42b983;
    color: white;
    border-radius: 4px;
    text-decoration: none;
    transition: background-color 0.3s;
  }
  
  .home-link:hover {
    background-color: #3aa876;
  }
  </style>