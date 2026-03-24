<template>
  <div
    id="particles-js"
    class="particles-container"
  />
</template>

<script setup>
import { onMounted, onUnmounted, nextTick } from 'vue'

let isInitialized = false
let particlesInstance = null

onMounted(async () => {
  await nextTick()
  
  if (isInitialized) {
    return
  }
  
  // 延迟初始化，确保DOM完全渲染
  setTimeout(() => {
    loadParticlesJS()
  }, 100)
})

const loadParticlesJS = () => {
  // 检查是否已存在粒子脚本
  if (document.querySelector('script[src*="particles"]')) {
    initParticles()
    return
  }
  
  // 动态加载particles.js
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
  script.async = true
  script.onload = () => {
    console.log('✅ Particles.js 脚本加载成功')
    // 等待一点时间确保脚本完全初始化
    setTimeout(initParticles, 50)
  }
  script.onerror = () => {
    console.warn('❌ CDN加载失败，尝试备用方案')
    // 备用方案：尝试其他CDN
    loadBackupParticles()
  }
  document.head.appendChild(script)
}

const loadBackupParticles = () => {
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/particles.js@2.0.0/particles.min.js'
  script.async = true
  script.onload = () => {
    console.log('✅ 备用Particles.js 脚本加载成功')
    setTimeout(initParticles, 50)
  }
  script.onerror = () => {
    console.error('❌ 所有CDN都加载失败')
  }
  document.head.appendChild(script)
}

const initParticles = () => {
  if (isInitialized || !window.particlesJS) {
    return
  }
  
  const container = document.getElementById('particles-js')
  if (!container) {
    console.warn('❌ 粒子容器未找到')
    return
  }
  
  try {
    console.log('🚀 开始初始化粒子效果...')
    
    particlesInstance = window.particlesJS('particles-js', {
      particles: {
        number: {
          value: 60,
          density: {
            enable: true,
            value_area: 1000
          }
        },
        color: {
          value: '#ffffff'
        },
        shape: {
          type: 'circle'
        },
        opacity: {
          value: 0.7,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.2,
            sync: false
          }
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 0.5,
            sync: false
          }
        },
        line_linked: {
          enable: false
        },
        move: {
          enable: true,
          speed: 1.5,
          direction: 'top-right',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'bubble'
          },
          onclick: {
            enable: true,
            mode: 'push'
          },
          resize: true
        },
        modes: {
          bubble: {
            distance: 200,
            size: 6,
            duration: 2,
            opacity: 1,
            speed: 3
          },
          push: {
            particles_nb: 4
          }
        }
      },
      retina_detect: true
    })
    
    isInitialized = true
    console.log('🌬️ 粒子效果初始化完成！')
    
    // 验证粒子是否真的在运行
    setTimeout(() => {
      const canvas = container.querySelector('canvas')
      if (canvas) {
        console.log('✅ 粒子Canvas已创建，尺寸:', canvas.width + 'x' + canvas.height)
      } else {
        console.warn('❌ 未找到粒子Canvas')
      }
    }, 1000)
    
  } catch (error) {
    console.error('❌ 粒子初始化失败:', error)
  }
}

onUnmounted(() => {
  // 清理粒子实例
  if (window.pJSDom && window.pJSDom.length > 0) {
    window.pJSDom.forEach(pjs => {
      if (pjs && pjs.pJS && pjs.pJS.fn && pjs.pJS.fn.vendors) {
        pjs.pJS.fn.vendors.destroypJS()
      }
    })
    window.pJSDom = []
  }
  isInitialized = false
  console.log('🧹 粒子效果已清理')
})
</script>

<style scoped>
.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
}

/* 确保canvas元素正确定位 */
:deep(canvas) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}
</style> 