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
}

.main-content {
  grid-area: main;
  min-height: 420px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(247, 252, 255, 0.74);
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 42px rgba(35, 103, 150, 0.16);
  overflow: hidden;
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
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&family=ZCOOL+KuaiLe&display=swap');

:root {
  --summer-font-main: 'M PLUS Rounded 1c', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --summer-font-display: 'ZCOOL KuaiLe', 'M PLUS Rounded 1c', 'Noto Sans SC', cursive;
  --summer-text-main: #245d88;
  --summer-text-subtle: #4e7d9f;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100vh;
  font-family: var(--summer-font-main);
  font-size: 16px;
  background:
    linear-gradient(
      180deg,
      rgba(60, 173, 250, 0.98) 0%,
      rgba(138, 229, 255, 0.92) 34%,
      rgba(212, 247, 255, 0.8) 52%,
      rgba(122, 233, 216, 0.84) 66%,
      rgba(152, 239, 224, 0.9) 100%
    );
  background-attachment: fixed;
}

html.with-background-image {
  background:
    linear-gradient(
      180deg,
      rgba(64, 176, 251, 0.92) 0%,
      rgba(142, 232, 255, 0.9) 34%,
      rgba(209, 248, 255, 0.72) 54%,
      rgba(127, 233, 216, 0.82) 72%,
      rgba(157, 240, 225, 0.86) 100%
    ),
    var(--summer-bg-image, none) center bottom / cover no-repeat;
  background-attachment: fixed;
}

body {
  margin: 0;
  background: transparent;
  color: var(--summer-text-main);
  line-height: 1.6;
}
</style>
