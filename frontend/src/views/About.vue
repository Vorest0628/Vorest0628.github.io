<!-- 
  About页面组件
  功能：
  1. 展示详细的个人信息
  2. 联系方式
  3. 技能展示
-->
<template>
  <div class="about">
    <h1>关于我</h1>
    <div>
      <img src="../assets/image/about.png" alt="about" class="about-img">
    </div>
    <div class="about-content">
      <div class="personal-info">
        <h2>个人简介</h2>
        <p>
          你好！我是 Vorest，来自上海的一名大学生，专业人工智能就读。
          你也可以叫我白川七濑/白川ななせ，空凛，这是我的别名。
          我热爱电子音乐、ACG，同时也是一名编程爱好者。
        </p>
        
        <h3>兴趣爱好</h3>
        <ul>
          <li><strong>音乐：</strong>金属，摇滚，东方什么的都听，但主要听电子音乐，其中特别喜欢 Trance 等风格</li>
          <li><strong>音游：</strong>主要游玩 Arcaea，BanGDream，Paradigm:Reboot，舞萌DX，O.N.G.E.K.I.</li>
          <li><strong>番剧：</strong>看的10年代的居多，最喜欢《魔法少女小圆》</li>
          <li><strong>编程：</strong>Web开发、AI技术应用</li>
        </ul>
      </div>

      <div class="skills">
        <h2>技能栈</h2>
        <div class="skill-grid">
          <div class="skill-item">
            <h4>前端技术</h4>
            <ul>
              <li>Vue.js</li>
              <li>JavaScript / TypeScript</li>
              <li>HTML5 / CSS3</li>
            </ul>
          </div>
          <div class="skill-item">
            <h4>后端技术</h4>
            <ul>
              <li>Node.js / Express</li>
              <li>Python / Flask / FastAPI</li>
              <li>MySQL / MongoDB</li>
            </ul>
          </div>
          <div class="skill-item">
            <h4>AI 技术</h4>
            <ul>
              <li>MCP</li>
              <li>AI agent</li>
              <li>语音合成，Stable Diffusion什么的都玩过</li>
            </ul>
          </div>
          <div class="skill-item">
            <h4>其他</h4>
            <ul>
              <li>Git,Redis,Docker</li>
              <li>编程语言：
                <ul>
                  <li>Python,JavaScript（熟练）</li>
                  <li>TypeScript,C++（熟悉）</li>
                  <li>Java,C#,Go（了解/在学）</li>
                </ul>   
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="contact">
        <h2>联系我</h2>
        <div class="contact-links">
          <a href="https://github.com/Vorest0628" target="_blank" class="contact-item">
            <i class="fab fa-github"></i>
            <span>GitHub</span>
          </a>
          <a href="https://space.bilibili.com/276555959" target="_blank" class="contact-item">
            <i class="fab fa-bilibili"></i>
            <span>哔哩哔哩</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.about {
  padding: 30px; /* 与Home页面统一 */
  min-height: 600px;
  width: 100%;
  background-color: transparent;
  line-height: 1.6;
}

h1 {
  color: #333; /* 与Home页面的h2统一 */
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem; /* 适中的字体大小 */
}

h2 {
  color: #333;
  margin: 30px 0 15px 0;
  font-size: 1.5rem;
  border-bottom: 2px solid #ddd; /* 简化边框颜色 */
  padding-bottom: 10px;
}

h3 {
  color: #444;
  margin: 20px 0 10px 0;
  font-size: 1.2rem;
}

.about-content {
  line-height: 1.6;
}

.personal-info p {
  font-size: 1rem; /* 统一字体大小 */
  color: #333; /* 与Home页面统一 */
  margin-bottom: 15px;
  text-align: justify;
}

.personal-info ul {
  list-style: disc; /* 使用简单的圆点 */
  padding-left: 20px;
  margin-left: 0;
}

.personal-info ul li {
  margin-bottom: 8px;
  padding: 5px 0; /* 简化padding */
  background-color: transparent; /* 去除背景色 */
  border-radius: 0;
  border-left: none; /* 去除左边框 */
  color: #333;
}

.skills {
  margin-top: 40px;
}

.skill-grid {
  display: block; /* 改为简单的块布局 */
  margin-top: 20px;
}

.skill-item {
  background-color: #f8f8f8; /* 简化背景 */
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px; /* 垂直排列 */
  box-shadow: none; /* 去除阴影 */
  transition: none;
  border: 1px solid #eee;
}

.skill-item:hover {
  transform: none; /* 去除悬停效果 */
}

.skill-item h4 {
  color: #333; /* 统一颜色 */
  margin-bottom: 10px;
  text-align: left; /* 左对齐 */
  font-size: 1.1rem;
}

.skill-item ul {
  list-style: disc;
  padding-left: 20px;
}

.skill-item ul li {
  padding: 2px 0;
  color: #333;
  text-align: left;
}

.contact {
  margin-top: 40px;
}

.contact-links {
  display: block; /* 简化为垂直布局 */
  margin-top: 20px;
}

.contact-item {
  display: inline-block; /* 改为内联块 */
  margin-right: 20px;
  margin-bottom: 10px;
  text-decoration: none;
  color: skyblue; /* 与Home页面链接颜色统一 */
  transition: color 0.3s;
  padding: 5px 10px;
  border-radius: 5px;
  background-color: #f8f8f8;
  border: 1px solid #eee;
  font-weight: bold;
}

.contact-item:hover {
  color: powderblue; /* 与Home页面统一 */
  transform: none;
  box-shadow: none;
}

.contact-item:visited {
  color: rebeccapurple;
}

.contact-item i {
  font-size: 1rem;
  margin-right: 5px;
}

.contact-item span {
  font-weight: normal;
}

.about-img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about {
    padding: 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .skill-grid {
    grid-template-columns: 1fr;
  }
  
  .contact-links {
    flex-direction: column;
    gap: 15px;
  }
  
  .contact-item {
    padding: 15px;
  }
}
</style>
