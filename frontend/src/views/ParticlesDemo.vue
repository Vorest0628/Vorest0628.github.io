<template>
  <div class="particles-demo">
    <div class="demo-content">
      <h1 class="demo-title">🌬️ 蒲公英粒子效果演示</h1>
      <div class="demo-description">
        <p>背景中的粒子效果模拟了蒲公英种子在风中飘散的自然场景</p>
        <p>粒子特点：</p>
        <ul>
          <li>✨ 总数量控制在65个以下</li>
          <li>🎨 蓝白渐变色调</li>
          <li>💨 缓慢向右上角飘散</li>
          <li>🔄 透明度和大小动态变化</li>
          <li>🖱️ 鼠标悬停有气泡效果</li>
          <li>👆 点击增加新粒子</li>
        </ul>
      </div>
      
      <div class="interaction-guide">
        <h3>🎮 交互指南</h3>
        <div class="interaction-item">
          <span class="icon">🖱️</span>
          <span>将鼠标悬停在粒子上，观察气泡效果</span>
        </div>
        <div class="interaction-item">
          <span class="icon">👆</span>
          <span>点击屏幕任意位置，增加新的粒子</span>
        </div>
        <div class="interaction-item">
          <span class="icon">📱</span>
          <span>在移动设备上触摸屏幕体验效果</span>
        </div>
      </div>

      <div class="tech-info">
        <h3>🔧 技术信息</h3>
        <p>使用 <code>particles.js</code> 库实现，配置优化用于网站背景效果</p>
      </div>

      <div class="debug-info" v-if="debugInfo.length > 0">
        <h3>🐛 调试信息</h3>
        <ul>
          <li v-for="(info, index) in debugInfo" :key="index">{{ info }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const debugInfo = ref([])

onMounted(() => {
  console.log('粒子演示页面已加载')
  
  // 调试粒子状态
  const checkParticles = () => {
    const info = []
    
    // 检查粒子容器
    const container = document.getElementById('particles-js')
    info.push(`粒子容器: ${container ? '✅ 找到' : '❌ 未找到'}`)
    
    // 检查canvas
    const canvas = container ? container.querySelector('canvas') : null
    info.push(`Canvas元素: ${canvas ? '✅ 找到' : '❌ 未找到'}`)
    
    if (canvas) {
      info.push(`Canvas尺寸: ${canvas.width}x${canvas.height}`)
    }
    
    // 检查particles.js库
    info.push(`Particles.js库: ${window.particlesJS ? '✅ 已加载' : '❌ 未加载'}`)
    
    // 检查粒子实例
    info.push(`粒子实例数量: ${window.pJSDom ? window.pJSDom.length : 0}`)
    
    debugInfo.value = info
  }
  
  // 立即检查一次
  checkParticles()
  
  // 3秒后再检查一次
  setTimeout(checkParticles, 3000)
})
</script>

<style scoped>
.particles-demo {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.demo-content {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  max-width: 800px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.demo-title {
  text-align: center;
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.demo-description {
  font-size: 1.1rem;
  color: #34495e;
  line-height: 1.8;
  margin-bottom: 2rem;
}

.demo-description ul {
  margin-top: 1rem;
  padding-left: 1.5rem;
}

.demo-description li {
  margin-bottom: 0.5rem;
}

.interaction-guide {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 2rem;
}

.interaction-guide h3 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.interaction-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.interaction-item .icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  width: 2rem;
}

.tech-info {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.tech-info h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.tech-info code {
  background: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #e83e8c;
}

.debug-info {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 1.5rem;
  border-radius: 10px;
  margin-top: 1rem;
}

.debug-info h3 {
  color: #856404;
  margin-bottom: 1rem;
}

.debug-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.debug-info li {
  margin-bottom: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .particles-demo {
    padding: 1rem;
  }
  
  .demo-content {
    padding: 2rem;
  }
  
  .demo-title {
    font-size: 2rem;
  }
  
  .demo-description {
    font-size: 1rem;
  }
  
  .interaction-item {
    flex-direction: column;
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .interaction-item .icon {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style> 