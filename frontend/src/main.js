import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@fortawesome/fontawesome-free/css/all.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
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
  
  // 过滤浏览器扩展相关的错误
  if (error && error.stack && (
    error.stack.includes('content_scripts') ||
    error.stack.includes('extension://') ||
    error.stack.includes('chrome-extension://')
  )) {
    event.preventDefault()
    return false
  }
  
  // 处理Vue-Office相关错误
  if (error && error.message && (
    error.message.includes('Cannot read properties of undefined') ||
    error.message.includes('vue-office') ||
    error.message.includes('VueOfficePptx')
  )) {
    console.warn('Vue-Office组件错误已捕获:', error.message)
    event.preventDefault()
    return false
  }
})

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')