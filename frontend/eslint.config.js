import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), ['VUE_APP_'])
  
  // 如果存在 setting.env 文件，也加载它
  const settingEnv = loadEnv(mode, process.cwd(), ['VUE_APP_'], 'setting.env')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    envPrefix: 'VUE_APP_',
    server: {
      port: 5173,
      host: true
    },
    define: {
      // 注入环境变量
      ...Object.keys(env).reduce((prev, key) => {
        prev[`process.env.${key}`] = JSON.stringify(env[key])
        return prev
      }, {}),
      ...Object.keys(settingEnv).reduce((prev, key) => {
        prev[`process.env.${key}`] = JSON.stringify(settingEnv[key])
        return prev
      }, {})
    }
  }
})