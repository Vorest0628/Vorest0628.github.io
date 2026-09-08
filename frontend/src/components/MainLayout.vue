<template>
  <transition name="initial-load">
    <div
      v-if="isInitialLoading"
      class="initial-loading-overlay"
    >
      <div class="loading-core">
        <div class="sun-ring" />
        <div class="sun-inner" />
      </div>
      <p class="loading-text">
        加载中...
      </p>
    </div>
  </transition>

  <div
    class="app"
    :class="{ 'app-loaded': !isInitialLoading }"
  >
    <!-- Anime Summer Sky Background Layers -->
    <div class="page-bg" />
    <div class="page-bg-overlay" />
    <AnimatedDecorations v-if="showParticles" />
    <ParticlesBackground v-if="showParticles" />

    <div class="container">
      <Navigation />

      <main class="main-content">
        <router-view v-slot="{ Component, route }">
          <transition
            name="page-fade"
            mode="out-in"
          >
            <keep-alive>
              <component
                :is="Component"
                v-if="Component && route.meta.keepAlive"
                :key="route.fullPath"
              />
            </keep-alive>
          </transition>

          <transition
            name="page-fade"
            mode="out-in"
          >
            <component
              :is="Component"
              v-if="Component && !route.meta.keepAlive"
              :key="route.fullPath"
            />
          </transition>

          <transition name="page-fade">
            <div
              v-if="!Component"
              class="loading"
            >
              <div class="loading-spinner-small">
                <div class="spinner-ring-small" />
              </div>
              <p>页面加载中...</p>
            </div>
          </transition>
        </router-view>
      </main>
      <Footer />
    </div>

    <LoginModal
      :visible="showLoginModal"
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import Footer from './Footer.vue'
import Navigation from './Navigation.vue'
import LoginModal from './LoginModal.vue'
import backgroundImageUrl from '../assets/image/background-bottom.jpg?url'

const ParticlesBackground = defineAsyncComponent(() => import('./ParticlesBackground.vue'))
const AnimatedDecorations = defineAsyncComponent(() => import('./AnimatedDecorations.vue'))

const showParticles = ref(false)
const showLoginModal = ref(false)
const authStore = useAuthStore()
const isInitialLoading = ref(true)

const handleLoginSuccess = () => {
  if (authStore.user?.username) {
    console.log('Login success:', authStore.user.username)
  }
}

const handleGlobalLogin = () => {
  showLoginModal.value = true
}

onMounted(() => {
  authStore.initAuth()
  window.addEventListener('show-login', handleGlobalLogin)

  setTimeout(() => {
    isInitialLoading.value = false
  }, 760)

  const enableDecorations = () => {
    showParticles.value = true
    document.documentElement.classList.add('with-background-image')
    document.documentElement.style.setProperty('--summer-bg-image', `url(${backgroundImageUrl})`)
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(enableDecorations, { timeout: 1800 })
  } else {
    setTimeout(enableDecorations, 1200)
  }
})

onUnmounted(() => {
  window.removeEventListener('show-login', handleGlobalLogin)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  position: relative;
  opacity: 0;
  transition: opacity 0.45s ease;
}

.app-loaded {
  opacity: 1;
}

.container {
  max-width: 1460px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: grid;
  grid-template-areas:
    'nav'
    'main'
    'footer';
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  padding: 10px 12px 24px;
  max-width: 1460px;
  margin: 0 auto;
}

.main-content {
  grid-area: main;
  min-height: 420px;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  overflow: visible;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.loading {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #3d6e92;
}

.loading-spinner-small {
  width: 48px;
  height: 48px;
}

.spinner-ring-small {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(121, 204, 255, 0.4);
  border-top-color: #2e8ee5;
  animation: spin 0.95s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.initial-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background:
    linear-gradient(180deg, rgba(51, 169, 247, 0.95), rgba(141, 230, 255, 0.93)),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.18), transparent 45%);
}

.loading-core {
  position: relative;
  width: 88px;
  height: 88px;
}

.sun-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.7);
  animation: spin 2.1s linear infinite;
}

.sun-inner {
  position: absolute;
  inset: 17px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #fffbd3, #ffd17a 72%, #ffb561 100%);
  box-shadow: 0 0 26px rgba(255, 224, 154, 0.8);
}

.loading-text {
  margin: 1rem 0 0;
  color: #fff;
  letter-spacing: 0.09em;
  font-weight: 700;
}

.initial-load-enter-active {
  transition: opacity 0.25s ease;
}

.initial-load-leave-active {
  transition: opacity 0.45s ease;
}

.initial-load-enter-from,
.initial-load-leave-to {
  opacity: 0;
}

@media (max-width: 1080px) {
  .container {
    grid-template-areas:
      'nav'
      'main'
      'footer';
    grid-template-columns: 1fr;
    padding: 8px 8px 18px;
    gap: 14px;
  }

  .main-content {
    border-radius: 20px;
  }
}
</style>

<style>
:root {
  --summer-font-main: 'Nunito', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --summer-font-display: 'Fredoka', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --summer-text-main: #1A3A5C;
  --summer-text-subtle: #3D6B8F;
  --summer-text-muted: #6B9BBF;

  /* ===== Anime Summer Sky Theme ===== */
  --color-primary: #2DB4FF;
  --color-primary-dark: #0099EE;
  --color-primary-light: #5CC8FF;
  --color-secondary: #FFAA33;
  --color-secondary-light: #FFCC66;
  --color-bg-start: #4FC3F7;
  --color-bg-end: #0288D1;
  --color-surface: rgba(255, 255, 255, 0.55);
  --color-surface-solid: rgba(255, 255, 255, 0.88);
  --color-weather-temp: #FF6B35;
  --color-success: #00C853;
  --color-tag-bg: rgba(45, 180, 255, 0.18);
  --color-tag-text: #0088CC;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100vh;
  font-family: var(--summer-font-main);
  font-size: 16px;
  scroll-behavior: smooth;
  background: transparent;
}

body {
  margin: 0;
  background: transparent;
  color: var(--summer-text-main);
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ===== Anime Summer Sky Background Layers ===== */
.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -3;
  background-image: url('/assets/scenery-bg.jpg');
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
}

.page-bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: linear-gradient(
    180deg,
    rgba(79, 195, 247, 0.1) 0%,
    rgba(3, 155, 229, 0.15) 50%,
    rgba(2, 136, 209, 0.25) 100%
  );
}

/* ===== Animations ===== */
@keyframes float {
  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(25px) translateY(-12px); }
}

@keyframes floatSlow {
  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(-15px) translateY(-8px); }
}

@keyframes shimmer {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

@keyframes fly {
  0% { transform: translateX(-100%) translateY(0); }
  25% { transform: translateX(25vw) translateY(-20px); }
  50% { transform: translateX(50vw) translateY(0); }
  75% { transform: translateX(75vw) translateY(20px); }
  100% { transform: translateX(110vw) translateY(0); }
}

@keyframes fall {
  0% { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg) translateX(100px); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(255, 170, 51, 0.5)); }
  50% { filter: drop-shadow(0 0 24px rgba(255, 204, 102, 0.8)); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0.5; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
}

@keyframes cloudDrift1 {
  0% { transform: translateX(-200px); }
  100% { transform: translateX(calc(100vw + 200px)); }
}

@keyframes cloudDrift2 {
  0% { transform: translateX(-250px); }
  100% { transform: translateX(calc(100vw + 250px)); }
}

@keyframes cloudDrift3 {
  0% { transform: translateX(-180px); }
  100% { transform: translateX(calc(100vw + 180px)); }
}

@keyframes cloudDriftSlow {
  0% { transform: translateX(-300px); }
  100% { transform: translateX(calc(100vw + 300px)); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Animation Classes */
.animate-float { animation: float 18s ease-in-out infinite; }
.animate-float-delayed { animation: floatSlow 22s ease-in-out infinite; animation-delay: -5s; }
.animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
.animate-fly { animation: fly 20s linear infinite; }
.animate-fall { animation: fall 10s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
.animate-sparkle { animation: sparkle 2.5s ease-in-out infinite; }
.animate-cloud-1 { animation: cloudDrift1 45s linear infinite; }
.animate-cloud-2 { animation: cloudDrift2 60s linear infinite; animation-delay: -15s; }
.animate-cloud-3 { animation: cloudDrift3 35s linear infinite; animation-delay: -25s; }
.animate-cloud-slow { animation: cloudDriftSlow 80s linear infinite; animation-delay: -40s; }
.animate-fadeInUp { animation: fadeInUp 0.6s ease-out both; }

/* ===== Scrollbar - summer blue theme ===== */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(45, 180, 255, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(45, 180, 255, 0.7);
}

/* Selection color */
::selection {
  background: rgba(45, 180, 255, 0.3);
  color: #1A3A5C;
}

@media (max-width: 768px) {
  .page-bg {
    background-attachment: scroll;
  }
}
</style>
