<template>
  <div class="search-view">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-info">
        <h1 v-if="searchQuery">
          "{{ searchQuery }}" 的搜索结果
        </h1>
        <h1 v-else>
          搜索结果
        </h1>
        <div
          v-if="searchQuery && !loading"
          class="result-stats"
        >
          找到约 {{ total }} 个结果 ({{ searchTime }}秒)
        </div>
      </div>
      
      <!-- 搜索过滤器 -->
      <div class="search-filters">
        <button 
          :class="['filter-btn', { active: activeFilter === 'all' }]"
          @click="setFilter('all')"
        >
          全部 ({{ resultCounts?.total || 0 }})
        </button>
        <button 
          :class="['filter-btn', { active: activeFilter === 'blog' }]"
          @click="setFilter('blog')"
        >
          📝 博客 ({{ resultCounts?.blogs || 0 }})
        </button>
        <button 
          :class="['filter-btn', { active: activeFilter === 'document' }]"
          @click="setFilter('document')"
        >
          📄 文档 ({{ resultCounts?.documents || 0 }})
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading"
    >
      <div class="loading-spinner" />
      <p>正在搜索...</p>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="error"
      class="error-message"
    >
      <div class="error-icon">
        ❌
      </div>
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="retry"
      >
        重试
      </button>
    </div>

    <!-- 搜索结果 -->
    <div
      v-if="!loading && !error"
      class="search-results"
    >
      <!-- 无结果 -->
      <div
        v-if="displayResults.length === 0 && searchQuery && !loading"
        class="no-results"
      >
        <div class="no-results-icon">
          🔍
        </div>
        <h3>未找到相关结果</h3>
        <p>尝试使用不同的关键词或检查拼写</p>
        <div class="search-suggestions">
          <h4>搜索建议：</h4>
          <ul>
            <li>确保所有单词拼写正确</li>
            <li>尝试使用不同的关键词</li>
            <li>尝试更一般的关键词</li>
            <li>使用较少的关键词</li>
          </ul>
        </div>
      </div>

      <!-- 结果列表 -->
      <div
        v-else
        class="results-list"
      >
        <div 
          v-for="result in displayResults" 
          :key="`${result.type}-${result.id}`" 
          class="search-result-item"
        >
          <!-- 结果图标和类型 -->
          <div class="result-header">
            <span class="result-icon">{{ result.icon }}</span>
            <span class="result-type">{{ result.typeLabel }}</span>
            <span
              v-if="result.fileType"
              class="file-type"
            >{{ result.fileType }}</span>
          </div>

          <!-- 标题 -->
          <h3 class="result-title">
            <router-link :to="result.url">
              <span v-html="result.title" />
            </router-link>
          </h3>

          <!-- URL预览 -->
          <div class="result-url">
            {{ `${window.location.origin}${result.url}` }}
          </div>

          <!-- 摘要和片段 -->
          <div class="result-content">
            <p
              v-if="result.excerpt"
              class="result-excerpt"
              v-html="result.excerpt"
            />
            <p
              v-if="result.snippet"
              class="result-snippet"
              v-html="result.snippet"
            />
          </div>

          <!-- 元数据 -->
          <div class="result-meta">
            <span class="result-date">{{ formatDate(result.date) }}</span>
            <span
              v-if="result.category"
              class="result-category"
            >{{ result.category }}</span>
            <span
              v-if="result.downloadCount"
              class="download-count"
            >
              下载: {{ result.downloadCount }}
            </span>
            <span
              v-if="result.fileSize"
              class="file-size"
            >
              大小: {{ formatFileSize(result.fileSize) }}
            </span>
          </div>

          <!-- 标签 -->
          <div
            v-if="result.tags && result.tags.length"
            class="result-tags"
          >
            <span 
              v-for="tag in result.tags.slice(0, 3)" 
              :key="tag" 
              class="tag"
            >
              {{ tag }}
            </span>
            <span
              v-if="result.tags.length > 3"
              class="more-tags"
            >
              +{{ result.tags.length - 3 }}
            </span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="totalPages > 1"
        class="pagination"
      >
        <button 
          :disabled="currentPage === 1"
          class="page-btn"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="['page-number', { active: page === currentPage }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button 
          :disabled="currentPage === totalPages"
          class="page-btn"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { searchApi } from '@/api/index';

export default {
  name: 'SearchView',
  setup() {
    const route = useRoute();
    const router = useRouter();

    // 响应式数据
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const searchResults = ref({ blogs: [], documents: [], combined: [] });
    const activeFilter = ref('all');
    const currentPage = ref(1);
    const total = ref(0);
    const totalPages = ref(0);
    const resultCounts = ref({ blogs: 0, documents: 0, total: 0 });
    const searchTime = ref(0);

    // 计算属性
    const displayResults = computed(() => {
      if (!searchResults.value) return [];
      
      if (activeFilter.value === 'all') {
        return searchResults.value.combined || [];
      } else if (activeFilter.value === 'blog') {
        return searchResults.value.blogs || [];
      } else {
        return searchResults.value.documents || [];
      }
    });

    const visiblePages = computed(() => {
      const pages = [];
      const start = Math.max(1, currentPage.value - 2);
      const end = Math.min(totalPages.value, currentPage.value + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });

    // 方法
    const search = async (query, page = 1) => {
      if (!query) return;

      loading.value = true;
      error.value = null;
      const startTime = Date.now();

      try {
        const params = {
          q: query,
          page: page,
          pageSize: 10
        };

        if (activeFilter.value !== 'all') {
          params.type = activeFilter.value;
        }

        const response = await searchApi.searchAll(params);
        
        // 修复：数据直接在response中，不需要.data.data
        searchResults.value = response.data || { blogs: [], documents: [], combined: [] };
        total.value = response.total || 0;
        totalPages.value = response.totalPages || 0;
        currentPage.value = response.page || 1;
        resultCounts.value = response.resultCounts || { blogs: 0, documents: 0, total: 0 };
        
        searchTime.value = ((Date.now() - startTime) / 1000).toFixed(2);
      } catch (err) {
        console.error('搜索失败:', err);
        if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
          error.value = '无法连接到服务器，请确保后端服务正在运行';
        } else if (err.response?.status === 404) {
          error.value = '搜索接口不存在，请检查API配置';
        } else {
          error.value = `搜索失败：${err.message || '请稍后再试'}`;
        }
      } finally {
        loading.value = false;
      }
    };

    const setFilter = (filter) => {
      activeFilter.value = filter;
      currentPage.value = 1;
      updateURL();
      search(searchQuery.value, 1);
    };

    const goToPage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
      updateURL();
      search(searchQuery.value, page);
    };

    const updateURL = () => {
      const query = {
        q: searchQuery.value,
        page: currentPage.value
      };
      
      if (activeFilter.value !== 'all') {
        query.type = activeFilter.value;
      }

      router.replace({ query });
    };

    const retry = () => {
      search(searchQuery.value, currentPage.value);
    };

    const formatDate = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('zh-CN');
    };

    const formatFileSize = (bytes) => {
      if (!bytes) return '';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // 监听路由变化
    watch(() => route.query, (newQuery) => {
      searchQuery.value = newQuery.q || '';
      currentPage.value = parseInt(newQuery.page) || 1;
      activeFilter.value = newQuery.type || 'all';
      
      if (searchQuery.value) {
        search(searchQuery.value, currentPage.value);
      }
    }, { immediate: true });

    onMounted(() => {
      // 初始化
      searchQuery.value = route.query.q || '';
      currentPage.value = parseInt(route.query.page) || 1;
      activeFilter.value = route.query.type || 'all';

      if (searchQuery.value) {
        search(searchQuery.value, currentPage.value);
      }
    });

    return {
      loading,
      error,
      searchQuery,
      searchResults,
      activeFilter,
      currentPage,
      total,
      totalPages,
      resultCounts,
      searchTime,
      displayResults,
      visiblePages,
      search,
      setFilter,
      goToPage,
      retry,
      formatDate,
      formatFileSize,
      window
    };
  }
};
</script>

<style scoped>
.search-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}

.search-header {
  margin-bottom: 30px;
}

.search-info h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 8px;
  font-weight: 400;
}

.result-stats {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.search-filters {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0;
}

.filter-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: #1a73e8;
}

.filter-btn.active {
  color: #1a73e8;
  border-bottom-color: #1a73e8;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 60px 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.search-suggestions {
  text-align: left;
  max-width: 400px;
  margin: 30px auto 0;
}

.search-suggestions h4 {
  margin-bottom: 10px;
  color: #333;
}

.search-suggestions ul {
  color: #666;
  padding-left: 20px;
}

.search-suggestions li {
  margin-bottom: 5px;
}

.results-list {
  margin-bottom: 40px;
}

.search-result-item {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.result-icon {
  font-size: 14px;
}

.result-type,
.file-type {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
}

.result-title {
  margin: 4px 0 2px 0;
}

.result-title a {
  color: #1a0dab;
  text-decoration: none;
  font-size: 20px;
  line-height: 1.3;
}

.result-title a:visited {
  color: #609;
}

.result-title a:hover {
  text-decoration: underline;
}

.result-url {
  color: #006621;
  font-size: 14px;
  margin-bottom: 8px;
  word-break: break-all;
}

.result-content {
  margin-bottom: 8px;
}

.result-excerpt,
.result-snippet {
  color: #545454;
  font-size: 14px;
  line-height: 1.4;
  margin: 4px 0;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.result-date,
.result-category,
.download-count,
.file-size {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.result-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tag {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.more-tags {
  color: #666;
  font-size: 11px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 40px;
}

.page-btn {
  background: #f8f9fa;
  border: 1px solid #dadce0;
  color: #3c4043;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  background: #f1f3f4;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  background: none;
  border: none;
  color: #1a73e8;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.page-number:hover {
  background: #f1f3f4;
}

.page-number.active {
  background: #1a73e8;
  color: white;
}

/* 关键词高亮 */
:deep(mark) {
  background: #fff2cc;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: bold;
}
</style>
