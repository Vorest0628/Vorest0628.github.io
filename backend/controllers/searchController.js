const Blog = require('../models/Blog');
const Document = require('../models/Document');
const { ApiError } = require('../utils/error');

/**
 * 统一搜索控制器
 * 提供跨博客和文档的搜索功能
 */

/**
 * 统一搜索接口
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.searchAll = async (req, res, next) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.json({ 
        success: true, 
        data: { blogs: [], documents: [], combined: [] },
        total: 0
      });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const type = req.query.type; // 'blog', 'document', 或不指定表示搜索全部

    let blogResults = [];
    let documentResults = [];

    // 搜索博客（如果需要）
    if (!type || type === 'blog') {
      blogResults = await searchBlogs(searchTerm);
    }

    // 搜索文档（如果需要）
    if (!type || type === 'document') {
      documentResults = await searchDocuments(searchTerm, req.user);
    }

    // 合并结果并按相关性排序
    const combinedResults = [...blogResults, ...documentResults]
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // 分页处理
    const total = combinedResults.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = combinedResults.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      data: {
        blogs: blogResults,
        documents: documentResults,
        combined: paginatedResults
      },
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      searchTerm: searchTerm,
      resultCounts: {
        blogs: blogResults.length,
        documents: documentResults.length,
        total: total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 搜索博客
 * @param {string} searchTerm - 搜索关键词
 * @returns {Array} 博客搜索结果
 */
async function searchBlogs(searchTerm) {
  try {
    const baseQuery = {
      status: 'published'
    };
    
    let blogs = [];
    
    // 首先尝试文本搜索
    try {
      const textSearchQuery = {
        ...baseQuery,
        $text: { $search: searchTerm }
      };
      
      const textResults = await Blog.find(textSearchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(50);
      
      blogs = blogs.concat(textResults);
    } catch (error) {
      console.log('文本搜索失败，使用正则搜索');
    }
    
    // 如果文本搜索结果较少，补充正则搜索
    if (blogs.length < 10) {
      const regexSearchQuery = {
        ...baseQuery,
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { excerpt: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      };
      
      const regexResults = await Blog.find(regexSearchQuery)
        .sort({ createdAt: -1 })
        .limit(50);
      
      // 去重合并
      const existingIds = new Set(blogs.map(b => b._id.toString()));
      const newResults = regexResults.filter(r => !existingIds.has(r._id.toString()));
      blogs = blogs.concat(newResults);
    }

    return blogs.map(blog => {
      const blogObj = blog.toObject({ virtuals: true });
      
      // 计算相关性分数
      let relevanceScore = 0;
      const lowerSearchTerm = searchTerm.toLowerCase();
      const lowerTitle = (blogObj.title || '').toLowerCase();
      const lowerContent = (blogObj.content || '').toLowerCase();
      const lowerExcerpt = (blogObj.excerpt || '').toLowerCase();
      const lowerCategory = (blogObj.category || '').toLowerCase();
      
      // 标题匹配权重最高
      if (lowerTitle.includes(lowerSearchTerm)) relevanceScore += 10;
      // 摘要匹配
      if (lowerExcerpt.includes(lowerSearchTerm)) relevanceScore += 8;
      // 内容匹配
      if (lowerContent.includes(lowerSearchTerm)) relevanceScore += 5;
      // 分类匹配
      if (lowerCategory.includes(lowerSearchTerm)) relevanceScore += 3;
      // 标签匹配
      if (blogObj.tags && blogObj.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) relevanceScore += 2;
      
      const snippet = generateSearchSnippet(blogObj.content || '', searchTerm, 150);
      const highlightedTitle = highlightKeywords(blogObj.title || '', searchTerm);
      const highlightedExcerpt = highlightKeywords(blogObj.excerpt || '', searchTerm);

      return {
        id: blogObj._id,
        title: highlightedTitle,
        originalTitle: blogObj.title,
        excerpt: highlightedExcerpt,
        snippet: snippet,
        category: blogObj.category,
        tags: blogObj.tags || [],
        date: blogObj.date || blogObj.createdAt,
        type: 'blog',
        typeLabel: '博客',
        url: `/blog/${blogObj._id}`,
        relevanceScore: relevanceScore,
        icon: '📝'
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore); // 按相关性排序
  } catch (error) {
    console.error('搜索博客时出错:', error);
    return [];
  }
}

/**
 * 搜索文档
 * @param {string} searchTerm - 搜索关键词
 * @param {Object} user - 当前用户信息
 * @returns {Array} 文档搜索结果
 */
async function searchDocuments(searchTerm, user) {
  try {
    // 基础查询条件
    const baseQuery = {};
    
    // 非管理员只能搜索公开且已发布的文档
    if (!user || user.role !== 'admin') {
      baseQuery.isPublic = true;
      baseQuery.status = 'published';
    }
    
    let documents = [];
    
    // 首先尝试文本搜索
    try {
      const textSearchQuery = {
        ...baseQuery,
        $text: { $search: searchTerm }
      };
      
      const textResults = await Document.find(textSearchQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(50);
      
      documents = documents.concat(textResults);
    } catch (error) {
      console.log('文档文本搜索失败，使用正则搜索');
    }
    
    // 如果文本搜索结果较少，补充正则搜索
    if (documents.length < 10) {
      const regexSearchQuery = {
        ...baseQuery,
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { secondaryTags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      };
      
      const regexResults = await Document.find(regexSearchQuery)
        .sort({ date: -1 })
        .limit(50);
      
      // 去重合并
      const existingIds = new Set(documents.map(d => d._id.toString()));
      const newResults = regexResults.filter(r => !existingIds.has(r._id.toString()));
      documents = documents.concat(newResults);
    }

    return documents.map(doc => {
      const docObj = doc.toObject();
      
      // 计算相关性分数
      let relevanceScore = 0;
      const lowerSearchTerm = searchTerm.toLowerCase();
      const lowerTitle = (docObj.title || '').toLowerCase();
      const lowerDescription = (docObj.description || '').toLowerCase();
      const lowerCategory = (docObj.category || '').toLowerCase();
      
      // 标题匹配权重最高
      if (lowerTitle.includes(lowerSearchTerm)) relevanceScore += 10;
      // 描述匹配
      if (lowerDescription.includes(lowerSearchTerm)) relevanceScore += 5;
      // 分类匹配
      if (lowerCategory.includes(lowerSearchTerm)) relevanceScore += 3;
      // 标签匹配
      if (docObj.secondaryTags && docObj.secondaryTags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) relevanceScore += 2;
      
      // 优先从描述生成摘要，如果描述为空则使用标题
      const contentForSnippet = docObj.description || docObj.title || '';
      const snippet = generateSearchSnippet(contentForSnippet, searchTerm, 150);
      
      const highlightedTitle = highlightKeywords(docObj.title || '', searchTerm);
      const highlightedDescription = highlightKeywords(docObj.description || '', searchTerm);

      return {
        id: docObj._id,
        title: highlightedTitle,
        originalTitle: docObj.title,
        excerpt: highlightedDescription,
        snippet: snippet,
        category: docObj.category,
        tags: docObj.secondaryTags || [],
        date: docObj.date || docObj.createdAt,
        type: 'document',
        typeLabel: '文档',
        url: `/documents?search=${encodeURIComponent(docObj.title)}`,
        fileType: docObj.type,
        fileSize: docObj.fileSize,
        downloadCount: docObj.downloadCount || 0,
        relevanceScore: relevanceScore,
        icon: getDocumentIcon(docObj.type)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore); // 按相关性排序
  } catch (error) {
    console.error('搜索文档时出错:', error);
    return [];
  }
}

/**
 * 获取文档类型图标
 * @param {string} fileType - 文件类型
 * @returns {string} 图标
 */
function getDocumentIcon(fileType) {
  const icons = {
    'PDF': '📄',
    'DOCX': '📝',
    'DOC': '📝',
    'XLSX': '📊',
    'XLS': '📊',
    'PPTX': '📽️',
    'PPT': '📽️',
    'TXT': '📃',
    'MD': '📝'
  };
  return icons[fileType?.toUpperCase()] || '📎';
}

/**
 * 生成搜索摘要片段
 * @param {string} content - 原始内容
 * @param {string} searchTerm - 搜索关键词
 * @param {number} maxLength - 最大长度
 * @returns {string} 包含关键词的摘要片段
 */
function generateSearchSnippet(content, searchTerm, maxLength = 150) {
  if (!content || !searchTerm) return '';
  
  const words = searchTerm.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  
  // 查找第一个关键词出现的位置
  let firstMatchIndex = -1;
  for (const word of words) {
    const index = contentLower.indexOf(word);
    if (index !== -1) {
      firstMatchIndex = index;
      break;
    }
  }
  
  if (firstMatchIndex === -1) {
    // 如果没有找到关键词，返回开头部分
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
  
  // 计算摘要开始位置（尽量让关键词在中间）
  const startPos = Math.max(0, firstMatchIndex - Math.floor(maxLength / 3));
  const endPos = Math.min(content.length, startPos + maxLength);
  
  let snippet = content.substring(startPos, endPos);
  
  // 添加省略号
  if (startPos > 0) snippet = '...' + snippet;
  if (endPos < content.length) snippet = snippet + '...';
  
  // 高亮关键词
  return highlightKeywords(snippet, searchTerm);
}

/**
 * 高亮搜索关键词
 * @param {string} text - 原始文本
 * @param {string} searchTerm - 搜索关键词
 * @returns {string} 高亮后的文本
 */
function highlightKeywords(text, searchTerm) {
  if (!text || !searchTerm) return text;
  
  const words = searchTerm.split(/\s+/).filter(word => word.length > 0);
  let highlightedText = text;
  
  words.forEach(word => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
} 