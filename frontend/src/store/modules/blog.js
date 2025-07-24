import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { blogApi } from '../../api/blog'

/**
 * 博客状态管理模块
 * 使用 Pinia 的 defineStore 创建博客相关的状态管理
 * 管理博客列表、当前博客、分页等信息
 */
export const useBlogStore = defineStore('blog', () => {
  // 状态定义
  const blogs = ref([]) // 博客列表数组
  const currentBlog = ref(null) // 当前选中的博客
  const loading = ref(false) // 加载状态标志
  const total = ref(0) // 博客总数
  const currentPage = ref(1) // 当前页码
  const pageSize = ref(10) // 每页显示数量

  // 计算属性
  const hasMore = computed(() => {
    // 判断是否还有更多博客可以加载
    return blogs.value.length < total.value
  })

  // 方法定义
  /**
   * 获取博客列表
   * @param {number} page - 页码
   * @returns {Promise<void>}
   */
  async function fetchBlogs(page = 1) {
    loading.value = true
    try {
      const response = await blogApi.getBlogs({
        page,
        pageSize: pageSize.value
      })
      blogs.value = response.data
      total.value = response.total
      currentPage.value = page
    } catch (error) {
      console.error('获取博客列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取博客详情
   * @param {number} id - 博客ID
   * @returns {Promise<void>}
   */
  async function fetchBlogById(id) {
    loading.value = true
    try {
      const response = await blogApi.getBlogById(id)
      currentBlog.value = response.data
    } catch (error) {
      console.error('获取博客详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建博客
   * @param {Object} blogData - 博客数据
   * @returns {Promise<void>}
   */
  async function createBlog(blogData) {
    loading.value = true
    try {
      const response = await blogApi.createBlog(blogData)
      blogs.value.unshift(response.data)
      total.value++
    } catch (error) {
      console.error('创建博客失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新博客
   * @param {number} id - 博客ID
   * @param {Object} blogData - 更新的博客数据
   * @returns {Promise<void>}
   */
  async function updateBlog(id, blogData) {
    loading.value = true
    try {
      const response = await blogApi.updateBlog(id, blogData)
      const index = blogs.value.findIndex(blog => blog.id === id)
      if (index !== -1) {
        blogs.value[index] = response.data
      }
      if (currentBlog.value?.id === id) {
        currentBlog.value = response.data
      }
    } catch (error) {
      console.error('更新博客失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除博客
   * @param {number} id - 博客ID
   * @returns {Promise<void>}
   */
  async function deleteBlog(id) {
    loading.value = true
    try {
      await blogApi.deleteBlog(id)
      blogs.value = blogs.value.filter(blog => blog.id !== id)
      total.value--
      if (currentBlog.value?.id === id) {
        currentBlog.value = null
      }
    } catch (error) {
      console.error('删除博客失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除当前博客
   */
  function clearCurrentBlog() {
    currentBlog.value = null
  }

  // 返回状态和方法
  return {
    // 状态
    blogs,
    currentBlog,
    loading,
    total,
    currentPage,
    pageSize,
    // 计算属性
    hasMore,
    // 方法
    fetchBlogs,
    fetchBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    clearCurrentBlog
  }
}) 