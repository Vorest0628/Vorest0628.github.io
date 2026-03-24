<template>
  <div class="user-app">
    <ParticlesBackground />

    <div class="user-container">
      <Header />
      <Navigation />

      <main class="user-main-content">
        <router-view v-slot="{ Component }">
          <component
            :is="Component"
            v-if="Component"
            :key="$route.fullPath"
          />
          <div
            v-if="!Component"
            class="loading"
          >
            <el-loading-spinner style="margin-right: 10px" />
            <span>用户面板加载中...</span>
          </div>
        </router-view>
      </main>

      <Footer />
    </div>
  </div>
</template>

<script setup>
import { onMounted, defineAsyncComponent } from 'vue'
import Header from './Header.vue'
import Footer from './Footer.vue'
import Navigation from './Navigation.vue'
import backgroundImageUrl from '../assets/image/background-bottom.jpg?url'

const ParticlesBackground = defineAsyncComponent(() => import('./ParticlesBackground.vue'))

onMounted(() => {
  document.documentElement.classList.add('with-background-image')
  document.documentElement.style.setProperty('--summer-bg-image', `url(${backgroundImageUrl})`)
})
</script>

<style scoped>
.user-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  margin: 0;
  padding: 0;
  position: relative;
}

.user-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: grid;
  grid-template-areas:
    'header'
    'nav'
    'user-main'
    'footer';
  grid-template-columns: 1fr;
  gap: 18px;
  padding: 12px;
}

.user-main-content {
  grid-area: user-main;
  min-height: 600px;
  width: 100%;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(247, 252, 255, 0.76);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 34px rgba(44, 111, 154, 0.15);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #5b7c95;
  font-size: 16px;
  gap: 10px;
}

@media (max-width: 768px) {
  .user-container {
    padding: 10px;
    gap: 14px;
  }

  .user-main-content {
    min-height: 500px;
    border-radius: 16px;
  }
}

@media (max-width: 480px) {
  .user-main-content {
    min-height: 420px;
  }
}
</style>
