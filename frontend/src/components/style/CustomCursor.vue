<!--
  CustomCursor - 自定义鼠标指针组件
  功能：
  1. 鼠标圆点跟随效果，响应跟手性优秀
  2. 跨端支持：PC端鼠标事件、移动端触摸事件
  3. 右键菜单触发时动画过渡消失，取消后恢复
  4. 悬浮在 <a> 链接元素上时圆点放大，显示"瞄准"样式
  5. 性能优化：使用 requestAnimationFrame 和 transform
-->
<template>
  <div 
    v-if="!isMobile"
    class="custom-cursor"
    :class="{ 
      'hidden': !isVisible,
      'expanded': isHoveringLink,
      'cursor-input': cursorType === 'input',
      'cursor-link': cursorType === 'link',
      'cursor-button': cursorType === 'button'
    }"
    :style="cursorStyle"
  >
    <!-- 鼠标圆点 -->
    <div class="cursor-dot"></div>
    
    <!-- 瞄准外圈（悬浮链接时显示） -->
    <div 
      class="cursor-ring" 
      :class="{ 'active': isHoveringLink }"
    ></div>
    
    <!-- 点击波澜效果 -->
    <div 
      v-for="ripple in ripples" 
      :key="ripple.id" 
      class="cursor-ripple"
      :style="{ animationDuration: ripple.duration + 'ms' }"
    ></div>
    
    <!-- 自定义箭头（中心位置） -->
    <div class="cursor-arrow" :class="`arrow-${cursorType}`">
      <!-- 默认箭头（普通状态） -->
      <svg v-if="cursorType === 'default'" class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      
      <!-- 链接箭头（手指样式） -->
      <svg v-else-if="cursorType === 'link'" class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L15 3C16.6569 3 18 4.34315 18 6L18 15C18 16.6569 16.6569 18 15 18L12 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M9 21L9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 13L9 9L12 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      
      <!-- 输入框箭头（I-beam 样式） -->
      <svg v-else-if="cursorType === 'input'" class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 4H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 20H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      
      <!-- 按钮箭头（手指样式） -->
      <svg v-else-if="cursorType === 'button'" class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L15 3C16.6569 3 18 4.34315 18 6L18 15C18 16.6569 16.6569 18 15 18L12 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M9 21L9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 13L9 9L12 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props 定义
const props = defineProps({
  // 鼠标圆点基础大小（像素）
  dotSize: {
    type: Number,
    default: 16
  },
  // 放大后的圆点大小（像素）
  expandedSize: {
    type: Number,
    default: 32
  },
  // 鼠标圆点颜色
  dotColor: {
    type: String,
    default: 'rgba(193, 234, 255, 0.5)'
  },
  // 外圈颜色（瞄准样式）
  ringColor: {
    type: String,
    default: 'rgba(0, 170, 255, 0.5)'
  },
  // 动画过渡时间（毫秒）
  transitionDuration: {
    type: Number,
    default: 200
  },
  // 是否启用平滑跟随
  smoothFollow: {
    type: Boolean,
    default: true
  },
  // 平滑跟随延迟系数（0-1，越小越平滑但越慢）
  smoothFactor: {
    type: Number,
    default: 0.8,
    validator: (value) => value >= 0 && value <= 1
  },
  // 透明度
  opacity: {
    type: Number,
    default: 0.85,
    validator: (value) => value >= 0 && value <= 1
  },
})

// 响应式状态
const x = ref(0)
const y = ref(0)
const targetX = ref(0)
const targetY = ref(0)
const isHoveringLink = ref(false)
const isHoveringInput = ref(false)
const isVisible = ref(true)
const isMobile = ref(false)
const cursorType = ref('default') // 'default', 'link', 'input', 'button'
const ripples = ref([]) // 波澜效果数组

// 波澜 ID 计数器
let rippleIdCounter = 0

// 动画帧 ID
let rafId = null

// 全局样式元素（用于隐藏原生鼠标指针）
let globalStyleElement = null

// 计算属性：鼠标样式
const cursorStyle = computed(() => ({
  transform: `translate3d(${x.value}px, ${y.value}px, 0)`,
  '--dot-size': `${props.dotSize}px`,
  '--expanded-size': `${props.expandedSize}px`,
  '--dot-color': props.dotColor,
  '--ring-color': props.ringColor,
  '--transition-duration': `${props.transitionDuration}ms`,
  opacity: props.opacity
}))

/**
 * 检测是否为移动端设备
 */
const detectMobile = () => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent)
  return isTouchDevice || isMobileUA
}

/**
 * 检测元素是否为可交互链接
 */
const isLinkElement = (target) => {
  if (!target) return false
  
  // 检查元素本身
  if (target.tagName === 'A') return true
  
  // 检查父元素（支持嵌套）
  let parent = target.parentElement
  while (parent) {
    if (parent.tagName === 'A') return true
    parent = parent.parentElement
  }
  
  return false
}

/**
 * 检测元素是否为输入框
 */
const isInputElement = (target) => {
  if (!target) return false
  
  const tagName = target.tagName
  const inputTags = ['INPUT', 'TEXTAREA']
  
  // 检查是否为输入类元素
  if (inputTags.includes(tagName)) {
    // 排除非文本类型的 input（如 button, submit, checkbox 等）
    if (tagName === 'INPUT') {
      const type = target.type?.toLowerCase()
      const textTypes = ['text', 'password', 'email', 'search', 'tel', 'url', 'number']
      return textTypes.includes(type) || !type
    }
    return true
  }
  
  // 检查是否为可编辑内容
  if (target.isContentEditable) return true
  
  return false
}

/**
 * 检测元素是否为按钮
 */
const isButtonElement = (target) => {
  if (!target) return false
  
  const tagName = target.tagName
  if (tagName === 'BUTTON') return true
  if (tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(target.type?.toLowerCase())) return true
  
  // 检查是否有按钮角色
  if (target.getAttribute('role') === 'button') return true
  
  return false
}

/**
 * 处理鼠标移动事件
 */
const handleMouseMove = (event) => {
  targetX.value = event.clientX
  targetY.value = event.clientY
  
  if (!props.smoothFollow) {
    x.value = targetX.value
    y.value = targetY.value
  }
}

/**
 * 处理触摸移动事件（移动端）
 */
const handleTouchMove = (event) => {
  if (event.touches.length > 0) {
    const touch = event.touches[0]
    targetX.value = touch.clientX
    targetY.value = touch.clientY
    
    if (!props.smoothFollow) {
      x.value = targetX.value
      y.value = targetY.value
    }
  }
}

/**
 * 处理鼠标进入事件（检测元素类型）
 */
const handleMouseOver = (event) => {
  const target = event.target
  
  // 按优先级检测元素类型
  if (isInputElement(target)) {
    cursorType.value = 'input'
    isHoveringInput.value = true
    isHoveringLink.value = false
  } else if (isLinkElement(target)) {
    cursorType.value = 'link'
    isHoveringLink.value = true
    isHoveringInput.value = false
  } else if (isButtonElement(target)) {
    cursorType.value = 'button'
    isHoveringLink.value = true // 按钮也显示为可点击
    isHoveringInput.value = false
  } else {
    cursorType.value = 'default'
    isHoveringLink.value = false
    isHoveringInput.value = false
  }
}

/**
 * 处理鼠标离开事件（重置状态）
 */
const handleMouseOut = (event) => {
  cursorType.value = 'default'
  isHoveringLink.value = false
  isHoveringInput.value = false
}

/**
 * 处理右键菜单触发事件
 */
const handleContextMenu = () => {
  isVisible.value = false
}

/**
 * 处理鼠标点击事件（触发波澜效果 + 取消右键菜单后恢复）
 */
const handleClick = () => {
  // 恢复显示（右键菜单取消后）
  if (!isVisible.value) {
    isVisible.value = true
  }
  
  // 创建波澜效果
  const rippleId = ++rippleIdCounter
  const rippleDuration = 600 // 波澜动画时长（毫秒）
  
  ripples.value.push({
    id: rippleId,
    duration: rippleDuration
  })
  
  // 动画结束后移除波澜元素
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== rippleId)
  }, rippleDuration)
}

/**
 * 动画帧更新函数（核心性能优化）
 */
const updateCursorPosition = () => {
  if (props.smoothFollow) {
    // 平滑跟随：插值计算
    x.value += (targetX.value - x.value) * props.smoothFactor
    y.value += (targetY.value - y.value) * props.smoothFactor
  }
  
  // 继续下一帧
  rafId = requestAnimationFrame(updateCursorPosition)
}

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  // 检测设备类型
  isMobile.value = detectMobile()
  
  if (isMobile.value) {
    console.log('🔍 检测到移动端设备，自定义鼠标已禁用')
    return
  }
  
  console.log('✅ 自定义鼠标组件已启用')
  
  // 创建全局样式，隐藏所有元素的原生鼠标指针
  globalStyleElement = document.createElement('style')
  globalStyleElement.id = 'custom-cursor-global-style'
  globalStyleElement.textContent = `
    *, *::before, *::after {
      cursor: none !important;
    }
  `
  document.head.appendChild(globalStyleElement)
  
  // 绑定事件监听器（使用 passive 优化性能）
  document.addEventListener('mousemove', handleMouseMove, { passive: true })
  document.addEventListener('mouseover', handleMouseOver, { passive: true })
  document.addEventListener('mouseout', handleMouseOut, { passive: true })
  document.addEventListener('contextmenu', handleContextMenu, { passive: true })
  document.addEventListener('click', handleClick, { passive: true })
  
  // 启动动画帧循环
  rafId = requestAnimationFrame(updateCursorPosition)
})

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  if (isMobile.value) return
  
  // 移除全局样式，恢复原生鼠标指针
  if (globalStyleElement && globalStyleElement.parentNode) {
    globalStyleElement.parentNode.removeChild(globalStyleElement)
    globalStyleElement = null
  }
  
  // 移除事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseover', handleMouseOver)
  document.removeEventListener('mouseout', handleMouseOut)
  document.removeEventListener('contextmenu', handleContextMenu)
  document.removeEventListener('click', handleClick)
  
  // 取消动画帧
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  
  console.log('🧹 自定义鼠标组件已清理')
})
</script>

<style scoped>
/* ========================================
   基础样式
   ======================================== */
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
  transition: opacity var(--transition-duration) ease,
              transform var(--transition-duration) ease;
  will-change: transform, opacity;
}

/* ========================================
   鼠标圆点样式
   ======================================== */
.cursor-dot {
  width: var(--dot-size);
  height: var(--dot-size);
  background-color: var(--dot-color);
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  transition: width var(--transition-duration) ease,
              height var(--transition-duration) ease,
              background-color var(--transition-duration) ease;
  box-shadow: 0 0 10px rgba(193, 234, 255, 0.5);
}

/* 悬浮链接时放大 */
.custom-cursor.expanded .cursor-dot {
  width: var(--expanded-size);
  height: var(--expanded-size);
  background-color: transparent;
  border: 2px solid var(--dot-color);
}

/* ========================================
   瞄准外圈样式（悬浮链接时显示）
   ======================================== */
.cursor-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid var(--ring-color);
  opacity: 0;
  width: 0;
  height: 0;
  transition: width var(--transition-duration) ease,
              height var(--transition-duration) ease,
              opacity var(--transition-duration) ease;
  pointer-events: none;
}

/* 激活瞄准样式 */
.cursor-ring.active {
  opacity: 1;
  width: calc(var(--expanded-size) + 16px);
  height: calc(var(--expanded-size) + 16px);
}

/* ========================================
   箭头样式（精确对齐）
   ======================================== */
.cursor-arrow {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
  transition: transform var(--transition-duration) ease,
              opacity var(--transition-duration) ease;
}

/* 箭头图标基础样式 */
.arrow-icon {
  width: 20px;
  height: 20px;
  color: var(--ring-color);
  filter: drop-shadow(0 0 2px rgba(0, 117, 176, 0.3));
  transition: all var(--transition-duration) ease;
  display: block;
}

/* 默认箭头样式（普通状态）- 尖端对齐左上角 */
.arrow-default .arrow-icon {
  width: 18px;
  height: 18px;
  color: var(--ring-color);
  transform: translate(-2px, -2px);
}

/* 链接箭头样式（手指）- 居中对齐 */
.cursor-link .cursor-arrow .arrow-icon {
  width: 22px;
  height: 22px;
  color: cyan;
  transform: translate(-11px, -11px) scale(1.1);
}

/* 输入框箭头样式（I-beam）- 居中对齐 */
.cursor-input .cursor-arrow .arrow-icon {
  width: 20px;
  height: 24px;
  color: #00dd88;
  transform: translate(-10px, -12px) scaleY(1.2);
}

/* 按钮箭头样式（手指）- 居中对齐 */
.cursor-button .cursor-arrow .arrow-icon {
  width: 22px;
  height: 22px;
  color: #ff9900;
  transform: translate(-11px, -11px) scale(1.1);
}

/* 悬浮链接时箭头略微缩小（因为圆点放大了） */
.custom-cursor.expanded .cursor-arrow {
  opacity: 0.9;
}

.custom-cursor.expanded.cursor-link .cursor-arrow .arrow-icon,
.custom-cursor.expanded.cursor-button .cursor-arrow .arrow-icon {
  transform: translate(-11px, -11px) scale(0.95);
}

/* ========================================
   右键菜单隐藏状态
   ======================================== */
.custom-cursor.hidden {
  opacity: 0;
  transform: translate3d(var(--cursor-x, 0), var(--cursor-y, 0), 0) scale(0.5);
}

/* ========================================
   移动端隐藏
   ======================================== */
@media (hover: none) and (pointer: coarse) {
  .custom-cursor {
    display: none !important;
  }
}

/* ========================================
   自定义样式区域 - 可根据设计需求调整
   ======================================== */

/* TODO: 以下区域可自定义样式 */

/* 示例：鼠标圆点发光效果 */
.cursor-dot {
  box-shadow: 0 0 20px var(--dot-color),
              0 0 40px var(--dot-color),
              0 0 60px rgba(0, 170, 255, 0.3);
}

/* 示例：外圈旋转动画 */
/*
@keyframes ringRotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.cursor-ring.active {
  animation: ringRotate 2s linear infinite;
  border-style: dashed;
}
*/

/* 示例：点击涟漪效果 */
@keyframes ripple {
  0% {
    width: var(--dot-size);
    height: var(--dot-size);
    opacity: 0.8;
  }
  100% {
    width: calc(var(--dot-size) * 5);
    height: calc(var(--dot-size) * 5);
    opacity: 0;
  }
}

/* 波澜元素样式 */
.cursor-ripple {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid var(--ring-color);
  background: radial-gradient(circle, transparent 30%, var(--dot-color) 100%);
  pointer-events: none;
  animation: ripple 600ms ease-out forwards;
}

/* ======================================== */
</style>
