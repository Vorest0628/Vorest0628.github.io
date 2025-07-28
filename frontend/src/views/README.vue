<template>
  <div class="readme-container">
    <div class="readme-header">
      <h1>📖 网站使用指南</h1>
      <p class="subtitle">欢迎来到 Vorest 的个人网站！这里为您提供详细的使用说明和常见问题解答。</p>
    </div>

    <div class="readme-content">
      <!-- 快速导航 -->
      <div class="quick-nav">
        <h2>🔗 快速导航</h2>
        <div class="nav-grid">
          <div class="nav-item" @click="scrollToSection('getting-started')">
            <span class="nav-icon">🚀</span>
            <span>快速开始</span>
          </div>
          <div class="nav-item" @click="scrollToSection('features')">
            <span class="nav-icon">✨</span>
            <span>功能特色</span>
          </div>
          <div class="nav-item" @click="scrollToSection('faq')">
            <span class="nav-icon">❓</span>
            <span>常见问题</span>
          </div>
          <div class="nav-item" @click="scrollToSection('contact')">
            <span class="nav-icon">📧</span>
            <span>联系我</span>
          </div>
        </div>
      </div>

      <!-- 快速开始 -->
      <section id="getting-started" class="section">
        <h2>🚀 快速开始</h2>
        <div class="content-card">
          <h3>如何开始使用？</h3>
          <ol>
            <li><strong>浏览首页</strong> - 查看最新博客文章和网站动态</li>
            <li><strong>注册账户</strong> - 点击右上角"登录"按钮创建账户</li>
            <li><strong>探索功能</strong> - 浏览博客、图库、文档库等各个板块</li>
            <li><strong>参与互动</strong> - 在博客文章下发表评论，与其他用户交流</li>
          </ol>
        </div>
      </section>

      <!-- 功能特色 -->
      <section id="features" class="section">
        <h2>✨ 功能特色</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3>博客系统</h3>
            <p>主要是技术分享，支持评论互动</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🖼️</div>
            <h3>图库展示</h3>
            <p>浏览个人的图片存档，支持分类查看和搜索</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📄</div>
            <h3>文档库</h3>
            <p>下载和查看各种技术解析，模板资源，生活感悟之类的文档</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>智能搜索</h3>
            <p>快速找到您需要的内容，支持tag/关键字/标题搜索</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>评论系统</h3>
            <p>与作者和其他读者进行互动交流</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <h3>友情链接</h3>
            <p>发现更多优质网站和资源</p>
          </div>
        </div>
      </section>

      <!-- 常见问题 -->
      <section id="faq" class="section">
        <h2>❓ 常见问题</h2>
        <div class="faq-list">
          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(0)">
              <span>如何注册账户？</span>
              <span class="faq-icon">{{ expandedFaq[0] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[0] }">
              <p>点击网站右上角的"登录"按钮，在弹出的登录窗口中点击"注册新账户"，填写用户名、邮箱和密码即可完成注册。</p>
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(1)">
              <span>忘记密码怎么办？</span>
              <span class="faq-icon">{{ expandedFaq[1] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[1] }">
              <p>在登录页面点击"忘记密码"，输入您的注册邮箱，系统会发送重置密码的链接到您的邮箱。</p>
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(2)">
              <span>如何发表评论？</span>
              <span class="faq-icon">{{ expandedFaq[2] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[2] }">
              <p>登录后，在博客文章页面底部找到评论区域，输入您的评论内容，点击"发表评论"即可。您也可以回复其他用户的评论。</p>
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(3)">
              <span>如何搜索内容？</span>
              <span class="faq-icon">{{ expandedFaq[3] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[3] }">
              <p>点击导航栏的"搜索"按钮，输入关键词即可搜索博客文章、文档等内容。搜索结果会按相关度排序显示。</p>
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(4)">
              <span>如何下载文档？</span>
              <span class="faq-icon">{{ expandedFaq[4] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[4] }">
              <p>在文档库中找到您需要的文档，点击"下载"按钮即可。部分文档支持在线预览，您可以先预览再决定是否下载。</p>
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(5)">
              <span>网站加载慢、网络连接错误怎么办？</span>
              <span class="faq-icon">{{ expandedFaq[5] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[5] }">
              <p>由于服务器在国外，大陆访问可能较慢。建议：1. 使用稳定的网络连接（需要用到一些神秘工具） 2. 尝试刷新页面</p>
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-question" @click="toggleFaq(6)">
              <span>在网络错误的情况下我可以浏览哪些内容？</span>
                <span class="faq-icon">{{ expandedFaq[6] ? '−' : '+' }}</span>
            </div>
            <div class="faq-answer" :class="{ expanded: expandedFaq[6] }">
                <p>你可以浏览关于我以及这篇博客（hhh），未来如果有必要，我也会添加一些离线内容</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 联系我-->
      <section id="contact" class="section">
        <h2>📧 联系我/赞助我</h2>
        <div class="content-card">
          <h3>有问题或建议？</h3>
          <p>如果您在使用过程中遇到问题，或有任何建议和反馈，欢迎通过以下方式联系我们：</p>
          <ul>
            <li><strong>邮箱</strong>：georgechen7861@163.com</li>
            <li><strong>GitHub</strong>：<a href="https://github.com/vorest0628" target="_blank">vorest0628</a></li>
            <li><strong>网站反馈</strong>：在任意博客文章下留言</li>
          </ul>
          <p class="note">我会尽快回复您的消息，感谢您的支持！</p>
          <h3>赞助我</h3>
          <p>如果你喜欢，可以赞助我用于调用大模型API以及维护各类项目，欢迎请我喝柠檬茶（</p>
          <ul>
            <img src="@/assets/image/alipay.jpg" alt="支付宝" class="sponsor-qr" style="width: 216px; height: 324px;"></img>
          </ul>
        </div>
      </section>
    </div>

    <!-- 返回顶部 -->
    <div class="back-to-top" @click="scrollToTop" v-show="showBackToTop">
      <span>↑</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const expandedFaq = ref([false, false, false, false, false, false])
const showBackToTop = ref(false)

const toggleFaq = (index) => {
  expandedFaq.value[index] = !expandedFaq.value[index]
}

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.readme-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

.readme-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.readme-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.readme-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section {
  scroll-margin-top: 100px;
}

.section h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 3px solid #3498db;
  display: inline-block;
}

/* 快速导航 */
.quick-nav {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 15px;
  border: 1px solid #e9ecef;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-item:hover {
  transform: translateY(-5px);
  border-color: #3498db;
  box-shadow: 0 5px 20px rgba(52, 152, 219, 0.3);
}

.nav-icon {
  font-size: 1.5rem;
}

/* 内容卡片 */
.content-card {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  border-left: 5px solid #3498db;
}

.content-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.content-card ol, .content-card ul {
  padding-left: 20px;
}

.content-card li {
  margin-bottom: 10px;
}

.note {
  background: #e8f4fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  margin-top: 20px;
}

/* 功能特色 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.feature-card {
  background: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  border: 1px solid #e9ecef;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* FAQ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faq-item {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 600;
  color: #2c3e50;
}

.faq-question:hover {
  background: #e9ecef;
}

.faq-icon {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3498db;
  transition: transform 0.3s ease;
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: white;
}

.faq-answer.expanded {
  max-height: 200px;
}

.faq-answer p {
  padding: 20px 25px;
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* 返回顶部 */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
  z-index: 1000;
}

.back-to-top:hover {
  background: #2980b9;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
}

.back-to-top span {
  font-size: 1.2rem;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .readme-container {
    padding: 15px;
  }
  
  .readme-header h1 {
    font-size: 2rem;
  }
  
  .nav-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .back-to-top {
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
  }
}

/* 链接样式 */
a {
  color: #3498db;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #2980b9;
  text-decoration: underline;
}
</style>
