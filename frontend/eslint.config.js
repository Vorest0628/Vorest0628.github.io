import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  // GitHub Pages 部署配置
  base: '/my-website/',  // 替换为你的仓库名
  
  // 构建优化
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离第三方库
          vendor: ['vue', 'vue-router', 'pinia'],
          particles: ['particles.js'],
          ui: ['element-plus']
        }
      }
    }
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})