<template>
  <Teleport to="body">
    <nav
      ref="navElement"
      class="main-nav"
    >
      <div class="nav-top">
        <router-link
          to="/"
          class="site-brand"
          @click="handleRouteClick"
        >
          <span class="brand-orb" />
          <span class="brand-text">Main Website</span>
        </router-link>

        <button
          class="mobile-toggle"
          type="button"
          :aria-label="mobileMenuOpen ? '收起菜单' : '展开菜单'"
          @click="toggleMobileMenu"
        >
          <i :class="mobileMenuOpen ? 'fas fa-xmark' : 'fas fa-bars'" />
        </button>
      </div>

      <div
        class="nav-content"
        :class="{ open: mobileMenuOpen }"
      >
        <ul class="nav-menu">
          <li>
            <router-link
              to="/"
              @click="handleRouteClick"
            >
              主页
            </router-link>
          </li>
          <li>
            <router-link
              to="/blog"
              @click="handleRouteClick"
            >
              博客
            </router-link>
          </li>

          <li>
            <button
              class="nav-link-btn toolbox-btn"
              type="button"
              @click="handleToolbox"
            >
              工具箱
            </button>
          </li>

          <li
            class="dropdown"
            @mouseenter="setDesktopDropdown('resources', true)"
            @mouseleave="setDesktopDropdown('resources', false)"
          >
            <button
              class="dropdown-toggle"
              type="button"
              @click="toggleDropdown('resources')"
            >
              资源库
              <i class="fas fa-angle-down" />
            </button>
            <transition name="dropdown">
              <ul
                v-show="showResourcesDropdown"
                class="dropdown-menu"
              >
                <li>
                  <router-link
                    to="/gallery"
                    @click="handleRouteClick"
                  >
                    图库
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="/documents"
                    @click="handleRouteClick"
                  >
                    文档库
                  </router-link>
                </li>
              </ul>
            </transition>
          </li>

          <li
            class="dropdown"
            @mouseenter="setDesktopDropdown('others', true)"
            @mouseleave="setDesktopDropdown('others', false)"
          >
            <button
              class="dropdown-toggle"
              type="button"
              @click="toggleDropdown('others')"
            >
              其他
              <i class="fas fa-angle-down" />
            </button>
            <transition name="dropdown">
              <ul
                v-show="showOthersDropdown"
                class="dropdown-menu"
              >
                <li>
                  <router-link
                    to="/comments"
                    @click="handleRouteClick"
                  >
                    评论
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="/friends"
                    @click="handleRouteClick"
                  >
                    友情链接
                  </router-link>
                </li>
                <li>
                  <router-link
                    to="/about"
                    @click="handleRouteClick"
                  >
                    关于我
                  </router-link>
                </li>
              </ul>
            </transition>
          </li>
        </ul>

        <div class="user-actions">
          <template v-if="authStore.isAuthenticated">
            <button
              type="button"
              class="user-panel-btn"
              :title="authStore.isAdmin ? '管理员控制台' : '用户面板'"
              @click="goToUserPanel"
            >
              <i class="fas fa-sliders" />
              {{ authStore.isAdmin ? '控制台' : '用户面板' }}
            </button>
            <button
              type="button"
              class="logout-btn"
              title="退出登录"
              @click="handleLogout"
            >
              <i class="fas fa-right-from-bracket" />
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="login-btn"
              title="用户登录"
              @click="handleShowLogin"
            >
              <i class="fas fa-user" />
              登录
            </button>
          </template>

          <form
            class="search-form"
            @submit.prevent="handleSearch"
          >
            <input
              v-model="searchQuery"
              type="search"
              placeholder="搜索博客或文档..."
            >
            <button type="submit">
              <i class="fas fa-magnifying-glass" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  </Teleport>

  <div
    class="nav-placeholder"
    :style="{ height: `${navHeight}px` }"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const authStore = useAuthStore()

const searchQuery = ref('')
const showResourcesDropdown = ref(false)
const showOthersDropdown = ref(false)
const mobileMenuOpen = ref(false)
const navElement = ref(null)
const navHeight = ref(88)

const isMobileViewport = () => window.innerWidth <= 980

const handleToolbox = () => {
  alert('工具箱功能开发中，敬请期待。')
}

const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) return

  router.push({
    name: 'search',
    query: { q: query }
  }).catch((err) => {
    console.error('Route navigation failed:', err)
  })
  searchQuery.value = ''
  handleRouteClick()
}

const goToUserPanel = () => {
  if (authStore.isAdmin) {
    router.push('/admin/dashboard')
    return
  }
  router.push('/user/panel')
}

const handleLogout = () => {
  if (!confirm('确定要退出登录吗？')) return
  authStore.logout()
  if (router.currentRoute.value.path.startsWith('/admin') || router.currentRoute.value.path.startsWith('/user')) {
    router.push('/')
  }
}

const handleShowLogin = () => {
  window.dispatchEvent(new Event('show-login'))
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (!mobileMenuOpen.value) {
    showResourcesDropdown.value = false
    showOthersDropdown.value = false
  }
  nextTick(updateNavHeight)
}

const handleRouteClick = () => {
  mobileMenuOpen.value = false
  showResourcesDropdown.value = false
  showOthersDropdown.value = false
  nextTick(updateNavHeight)
}

const setDesktopDropdown = (type, visible) => {
  if (isMobileViewport()) return
  if (type === 'resources') {
    showResourcesDropdown.value = visible
    return
  }
  showOthersDropdown.value = visible
}

const toggleDropdown = (type) => {
  if (!isMobileViewport()) return

  if (type === 'resources') {
    showResourcesDropdown.value = !showResourcesDropdown.value
    if (showResourcesDropdown.value) showOthersDropdown.value = false
  } else {
    showOthersDropdown.value = !showOthersDropdown.value
    if (showOthersDropdown.value) showResourcesDropdown.value = false
  }

  nextTick(updateNavHeight)
}

const updateNavHeight = () => {
  window.requestAnimationFrame(() => {
    if (!navElement.value) return
    navHeight.value = Math.ceil(navElement.value.getBoundingClientRect().height + 8)
  })
}

const handleResize = () => {
  if (!isMobileViewport()) {
    mobileMenuOpen.value = false
  }
  showResourcesDropdown.value = false
  showOthersDropdown.value = false
  updateNavHeight()
}

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    handleRouteClick()
  }
)

onMounted(async () => {
  await authStore.initAuth()
  updateNavHeight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.nav-placeholder {
  grid-area: nav;
  transition: height 0.3s ease;
}

.main-nav {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  width: min(1480px, calc(100% - 20px));
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.84), rgba(223, 247, 255, 0.76)),
    radial-gradient(circle at right top, rgba(126, 210, 255, 0.25), transparent 60%);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 38px rgba(32, 94, 137, 0.18);
  padding: 0.78rem 1rem;
  display: grid;
  gap: 0.78rem;
}

.nav-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: #2d85da;
  text-decoration: none;
}

.brand-orb {
  width: 0.92rem;
  height: 0.92rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #80d7ff, #3196ed);
  box-shadow: 0 0 0 4px rgba(115, 201, 255, 0.26);
}

.brand-text {
  font-family: var(--summer-font-display);
  font-size: 1.38rem;
  letter-spacing: 0.02em;
}

.mobile-toggle {
  display: none;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  border: 1px solid rgba(94, 180, 241, 0.45);
  background: rgba(255, 255, 255, 0.84);
  color: #2f84d7;
  cursor: pointer;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 0.46rem;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
}

.nav-menu a,
.dropdown-toggle,
.nav-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.16rem;
  padding: 0 0.9rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #2f7ec9;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.24s ease;
}

.nav-menu a:hover,
.dropdown-toggle:hover,
.nav-link-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(82, 177, 241, 0.45);
  background: rgba(234, 249, 255, 0.9);
  color: #1f6fb8;
}

.nav-menu a.router-link-active {
  background: linear-gradient(135deg, #2f8ce2, #58beff);
  color: #fff;
  box-shadow: 0 10px 20px rgba(47, 140, 226, 0.24);
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  min-width: 150px;
  padding: 0.35rem;
  list-style: none;
  margin: 0;
  border-radius: 14px;
  border: 1px solid rgba(126, 197, 240, 0.5);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 28px rgba(48, 104, 144, 0.2);
}

.dropdown-menu a {
  width: 100%;
  justify-content: flex-start;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.42rem;
}

.login-btn,
.logout-btn,
.user-panel-btn {
  border: 1px solid rgba(86, 174, 239, 0.55);
  border-radius: 999px;
  height: 2.16rem;
  padding: 0 0.84rem;
  background: rgba(255, 255, 255, 0.86);
  color: #2f7ec9;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background-color 0.24s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.user-panel-btn {
  background: linear-gradient(135deg, #ff96ae, #ffa3ba 40%, #7eceff);
  border-color: transparent;
  color: #fff;
}

.login-btn:hover,
.logout-btn:hover,
.user-panel-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(48, 121, 174, 0.2);
}

.search-form {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.search-form input {
  width: 200px;
  height: 2.16rem;
  border-radius: 999px;
  border: 1px solid rgba(110, 190, 246, 0.5);
  background: rgba(255, 255, 255, 0.92);
  color: #275d8d;
  padding: 0 0.86rem;
}

.search-form input:focus {
  outline: none;
  border-color: #3a9ef2;
  box-shadow: 0 0 0 3px rgba(110, 195, 250, 0.28);
}

.search-form button {
  width: 2.16rem;
  height: 2.16rem;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #41a4f5, #5cc2ff);
  color: #fff;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.search-form button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(62, 157, 232, 0.3);
}

@media (max-width: 1220px) {
  .main-nav {
    border-radius: 18px;
  }

  .search-form input {
    width: 160px;
  }
}

@media (max-width: 980px) {
  .main-nav {
    width: calc(100% - 14px);
    top: 6px;
    padding: 0.68rem 0.72rem;
    border-radius: 16px;
  }

  .mobile-toggle {
    display: inline-grid;
    place-items: center;
  }

  .nav-content {
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
  }

  .nav-content.open {
    display: flex;
  }

  .nav-menu {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-menu a,
  .dropdown-toggle,
  .nav-link-btn {
    width: 100%;
    justify-content: space-between;
    border-radius: 12px;
    height: 2.4rem;
  }

  .dropdown-menu {
    position: static;
    margin-top: 0.35rem;
    width: 100%;
    box-shadow: none;
    border-radius: 12px;
  }

  .user-actions {
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .search-form {
    width: 100%;
  }

  .search-form input {
    width: 100%;
    flex: 1;
  }
}
</style>
