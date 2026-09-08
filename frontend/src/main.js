import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'katex/dist/katex.min.css'
import AppIcon from './components/AppIcon.vue'
import App from './App.vue'
import router from './router'

// 添加全局错误处理，过滤浏览器扩展错误
window.addEventListener('error', (event) => {
  // 过滤浏览器扩展相关的错误
  if (event.filename && (
    event.filename.includes('content_scripts') ||
    event.filename.includes('extension://') ||
    event.filename.includes('chrome-extension://')
  )) {
    event.preventDefault()
    return false
  }
})

// 处理Promise未捕获的错误
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason
  if (error && error.stack && (
    error.stack.includes('content_scripts') ||
    error.stack.includes('extension://') ||
    error.stack.includes('chrome-extension://')
  )) {
    event.preventDefault()
    return false
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('AppIcon', AppIcon)

app.mount('#app')
