import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'

// 懒加载页面组件，添加错误处理
const Home = () => import('../views/Home.vue').catch(err => {
  console.error('Home组件加载失败:', err)
  return import('../views/Home.vue')
})

const About = () => import('../views/About.vue').catch(err => {
  console.error('About组件加载失败:', err)
  return import('../views/About.vue')
})

const Blog = () => import('../views/Blog.vue').catch(err => {
  console.error('Blog组件加载失败:', err)
  return import('../views/Blog.vue')
})

const BlogDetail = () => import('../views/BlogDetail.vue').catch(err => {
  console.error('BlogDetail组件加载失败:', err)
  return import('../views/BlogDetail.vue')
})

const Gallery = () => import('../views/Gallery.vue').catch(err => {
  console.error('Gallery组件加载失败:', err)
  return import('../views/Gallery.vue')
})

const Comments = () => import('../views/Comments.vue').catch(err => {
  console.error('Comments组件加载失败:', err)
  return import('../views/Comments.vue')
})

const DocumentLibrary = () => import('../views/DocumentLibrary.vue').catch(err => {
  console.error('DocumentLibrary组件加载失败:', err)
  return import('../views/DocumentLibrary.vue')
})

const FriendLinks = () => import('../views/FriendLinks.vue').catch(err => {
  console.error('FriendLinks组件加载失败:', err)
  return import('../views/FriendLinks.vue')
})

const NotFound = () => import('../views/NotFound.vue').catch(err => {
  console.error('NotFound组件加载失败:', err)
  return import('../views/NotFound.vue')
})

const ParticlesDemo = () => import('../views/ParticlesDemo.vue').catch(err => {
  console.error('ParticlesDemo组件加载失败:', err)
  return import('../views/ParticlesDemo.vue')
})



const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: Home,
        meta: {
          title: '首页',
          keepAlive: true
        }
      },
      {
        path: '/about',
        name: 'about',
        component: About,
        meta: {
          title: '关于我',
          keepAlive: false
        }
      },
      {
        path: '/blog',
        name: 'blog',
        component: Blog,
        meta: {
          title: '博客',
          keepAlive: true
        }
      },
      {
        path: '/blog/:id',
        name: 'blog-detail',
        component: BlogDetail,
        meta: {
          title: '博客详情',
          keepAlive: false
        }
      },
      {
        path: '/gallery',
        name: 'gallery',
        component: Gallery,
        meta: {
          title: '图库',
          keepAlive: true
        }
      },
      {
        path: '/comments',
        name: 'comments',
        component: Comments,
        meta: {
          title: '评论',
          keepAlive: false
        }
      },
      {
        path: '/documents',
        name: 'documents',
        component: DocumentLibrary,
        meta: {
          title: '文档库',
          keepAlive: true
        }
      },
      {
        path: '/document',
        redirect: '/documents'
      },
      {
        path: '/friends',
        name: 'friends',
        component: FriendLinks,
        meta: {
          title: '友情链接',
          keepAlive: true
        }
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('../views/SearchView.vue'),
        meta: {
          title: '搜索结果',
          keepAlive: false
        }
      },
      {
        path: '/particles-demo',
        name: 'particles-demo',
        component: ParticlesDemo,
        meta: {
          title: '粒子效果演示',
          keepAlive: false
        }
      },
      // 管理员面板 - 使用MainLayout
      {
        path: '/admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/Admin/AdminPanel.vue'),
        meta: { 
          requiresAuth: true, 
          requiresAdmin: true, 
          title: '管理员控制台',
          keepAlive: false
        }
      },
      // 用户面板 - 使用MainLayout
      {
        path: '/user/panel',
        name: 'UserPanel',
        component: () => import('../views/User/UserPanel.vue'),
        meta: { 
          requiresAuth: true, 
          title: '用户管理面板',
          keepAlive: false
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 路由切换时滚动到顶部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  // 调试信息
  console.log(`路由导航: ${from.path} -> ${to.path}`)
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Vorest's Website` : "Vorest's Website"
  
  // 检查是否需要认证
  if (to.meta.requiresAuth || to.meta.requiresAdmin) {
    const { authStorage } = await import('../utils/auth')
    const { token, user } = authStorage.getAuth()
    
    // 检查是否已登录
    if (!token || !user) {
      console.log('未登录，重定向到首页进行登录')
      alert(to.meta.requiresAdmin ? '请先登录后再访问管理员面板' : '请先登录后再访问此页面')
      next('/')
      return
    }
    
    // 检查是否需要管理员权限
    if (to.meta.requiresAdmin) {
      // 检查是否有管理员权限
      if (user.role !== 'admin') {
        console.log('权限不足，重定向到首页')
        alert('您没有管理员权限')
        next('/')
        return
      }
      
      // 验证管理员token是否有效
      try {
        const { adminApi } = await import('../api/admin')
        await adminApi.verifyAdmin()
      } catch (error) {
        console.log('管理员Token无效，清除认证信息并重定向到首页')
        authStorage.clearAuth()
        alert('登录已过期，请重新登录')
        next('/')
        return
      }
    } else {
      // 对于普通用户，验证token是否有效
      try {
        const { authApi } = await import('../api/auth')
        await authApi.getCurrentUser()
      } catch (error) {
        console.log('用户Token无效，清除认证信息并重定向到首页')
        authStorage.clearAuth()
        alert('登录已过期，请重新登录')
        next('/')
        return
      }
    }
  }
  
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

// 添加路由后置守卫
router.afterEach((to, from) => {
  console.log(`路由完成: ${from.path} -> ${to.path}`)
})

export default router