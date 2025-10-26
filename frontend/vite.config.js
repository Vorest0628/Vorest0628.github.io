import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [vue(), viteCompression({
    verbose: true,
    disable: false,
    threshold: 10240,  // 10KB以上才压缩
    algorithm: 'brotli',  // 使用 Brotli 压缩（较gzip优疾）
    ext: '.br'
  })],
    
    // GitHub Pages 部署配置
    base: mode === 'production' ? '/' : '/',
    
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api')
      }
    }
  },
  define: {
    'process.env': {}
    },
    // 确保环境变量被正确加载
    envPrefix: 'VITE_',
    
    // 依赖预优化配置 - 将关键依赖聚集加载，提高首屏加载速度
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'element-plus',
        'axios',
        '@vueuse/core',
        'date-fns',
        'lodash'
      ],
      exclude: ['particles.js']  // 非关键库在使用时才加载
    },
    
    // 构建优化
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true  // 生产环境移除console日志
        }
      },
      cssCodeSplit: true,  // 启用CSS代码分割
      reportCompressedSize: false,  // 跳过压缩大小报告，加快构建速度
      rollupOptions: {
        output: {
          manualChunks: {
            // 细粒度分离第三方库，优化加载性能
            'vue-core': ['vue', 'vue-router', 'pinia'],
            'element-ui': ['element-plus'],
            'particles': ['particles.js'],
            'doc-viewer': ['@vue-office/docx', '@vue-office/excel', '@vue-office/pptx'],
            'pdf-lib': ['pdfjs-dist'],
            'utils': ['axios', 'date-fns', 'lodash']
          }
        }
      }
    }
  }
})