const Blog = require('../models/Blog')
const { ApiError } = require('../utils/error')

/**
 * 博客控制器
 * 处理所有与博客相关的请求
 */

/**
 * 获取博客列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 * 
 * 查询参数：
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认10
 * - status: 博客状态，默认published
 * - category: 博客分类
 * - tag: 标签
 * - search: 搜索关键词
 */
exports.getBlogs = async (req, res, next) => {
  try {
    // 解析分页参数
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const status = req.query.status

    // 构建查询条件
    const query = {}
    
    // 如果指定了状态，则查询指定状态；否则查询已发布和置顶的文章
    if (status) {
      query.status = status
    } else {
      query.status = { $in: ['published', 'pinned'] }
    }
    
    if (req.query.category) {
      query.category = req.query.category
    }
    if (req.query.tag) {
      query.tags = req.query.tag
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search }
    }

    // 构建排序条件：置顶文章优先（按pinnedPriority降序），然后按创建时间降序
    const sortQuery = {}
    if (!status || status === 'published' || status === 'pinned') {
      // 如果查询已发布或置顶状态，则按置顶优先级和时间排序
      sortQuery.pinnedPriority = -1
      sortQuery.createdAt = -1
    } else {
      // 其他状态只按时间排序
      sortQuery.createdAt = -1
    }

    // 并行执行查询和计数
    const [blogs, total] = await Promise.all([
      // 查询博客列表
      Blog.find(query)
        .sort(sortQuery) // 使用新的排序逻辑
        .skip((page - 1) * pageSize) // 跳过前面的数据
        .limit(pageSize), // 限制返回数量
      // 获取总数
      Blog.countDocuments(query)
    ])

    // 转换数据格式以匹配前端期望
    const transformedBlogs = blogs.map(blog => ({
      id: blog._id,
      title: blog.title,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: blog.tags,
      status: blog.status, // 添加状态字段
      date: blog.date
    }))

    // 返回分页数据
    res.json({
      success: true,
      data: transformedBlogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取博客详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.getBlogById = async (req, res, next) => {
  try {
    // 查找博客
    const blog = await Blog.findById(req.params.id)
    
    // 检查博客是否存在
    if (!blog) {
      throw new ApiError(404, '博客不存在')
    }

    // 增加浏览次数
    blog.viewCount += 1
    await blog.save()

    // 转换数据格式
    const transformedBlog = {
      id: blog._id,
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      tags: blog.tags,
      date: blog.date,
      viewCount: blog.viewCount,
      likeCount: blog.likeCount,
      commentCount: blog.commentCount
    }

    res.json({ success: true, data: transformedBlog })
  } catch (error) {
    next(error)
  }
}

/**
 * 创建博客
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 * 
 * 请求体：
 * - title: 博客标题
 * - excerpt: 博客摘要
 * - content: 博客内容
 * - category: 博客分类
 * - tags: 标签数组
 * - status: 博客状态
 */
exports.createBlog = async (req, res, next) => {
  try {
    // 构建博客数据
    const status = req.body.status || 'draft'
    const blogData = {
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      category: req.body.category,
      tags: req.body.tags || [],
      status,
      pinnedPriority: status === 'pinned' ? 1 : 0,
      author: req.user.id
    }

    // 创建博客
    const blog = await Blog.create(blogData)

    // 转换数据格式
    const transformedBlog = {
      id: blog._id,
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      tags: blog.tags,
      status: blog.status,
      date: blog.date
    }

    // 返回创建成功的博客
    res.status(201).json({ success: true, data: transformedBlog })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新博客
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 查找现有的博客
    const existingBlog = await Blog.findById(id)
    if (!existingBlog) {
      throw new ApiError(404, '博客不存在')
    }

    // 检查权限：只有管理员可以修改
    if (req.user.role !== 'admin') {
      throw new ApiError(403, '没有权限修改此博客')
    }

    // 处理置顶优先级
    if (updateData.status) {
      updateData.pinnedPriority = updateData.status === 'pinned' ? 1 : 0
    }

    // 将更新数据合并到现有博客对象
    Object.assign(existingBlog, updateData)

    // 保存博客
    const updatedBlog = await existingBlog.save()

    if (!updatedBlog) {
      // 理论上，如果前面的 findById 成功，这里不应该失败
      throw new ApiError(404, '更新博客失败，未找到博客')
    }

    // 转换数据格式以匹配前端期望
    const transformedBlog = {
      id: updatedBlog._id,
      title: updatedBlog.title,
      excerpt: updatedBlog.excerpt,
      content: updatedBlog.content,
      category: updatedBlog.category,
      tags: updatedBlog.tags,
      date: updatedBlog.date
    }

    res.json({ success: true, data: transformedBlog })
  } catch (error) {
    next(error)
  }
}

/**
 * 删除博客
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.deleteBlog = async (req, res, next) => {
  try {
    // 查找博客
    const blog = await Blog.findById(req.params.id)
    
    // 检查博客是否存在
    if (!blog) {
      throw new ApiError(404, '博客不存在')
    }

    // 检查权限：只有管理员可以删除
    if (req.user.role !== 'admin') {
      throw new ApiError(403, '没有权限删除此博客')
    }

    // 删除博客
    await blog.deleteOne()

    res.json({ success: true, message: '博客已删除' })
  } catch (error) {
    next(error)
  }
}

/**
 * 点赞博客
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.likeBlog = async (req, res, next) => {
  try {
    // 查找博客
    const blog = await Blog.findById(req.params.id)
    
    // 检查博客是否存在
    if (!blog) {
      throw new ApiError(404, '博客不存在')
    }

    // TODO: 检查用户是否已经点赞过
    // 增加点赞数
    blog.likeCount += 1
    await blog.save()

    res.json({ data: blog })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取博客分类列表
 */
exports.getCategories = async (req, res, next) => {
  try {
    // 从已发布和置顶的博客中获取所有唯一的分类
    const categories = await Blog.distinct('category', { 
      status: { $in: ['published', 'pinned'] } 
    })
    
    // 如果没有分类，使用默认分类
    if (categories.length === 0) {
      categories.push('前端开发', 'AI技术', '游戏', '音乐')
    }
    
    // 对分类进行排序
    categories.sort()
    
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

/**
 * 管理员获取所有博客（包括草稿）
 */
exports.getAllBlogsForAdmin = async (req, res, next) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      throw new ApiError(403, '没有管理员权限')
    }

    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10

    // 构建查询条件
    const query = {}
    if (req.query.category) {
      query.category = req.query.category
    }
    if (req.query.status) {
      query.status = req.query.status
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search }
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ pinnedPriority: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      Blog.countDocuments(query)
    ])

    // 转换数据格式
    const transformedBlogs = blogs.map(blog => ({
      _id: blog._id,
      id: blog._id,
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      tags: blog.tags,
      status: blog.status,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      date: blog.date,
      viewCount: blog.viewCount,
      likeCount: blog.likeCount
    }))

    res.json({
      success: true,
      data: {
        blogs: transformedBlogs
      },
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 搜索博客
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 *
 * 查询参数：
 * - q: 搜索关键词
 */
exports.searchBlogs = async (req, res, next) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.json({ success: true, data: [] });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    // 使用文本索引进行搜索
    const query = {
      status: 'published',
      $text: { $search: searchTerm }
    };

    const [blogs, total] = await Promise.all([
      Blog.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      Blog.countDocuments(query)
    ]);

    // 生成搜索结果摘要
    const transformedBlogs = blogs.map(blog => {
      const blogObj = blog.toObject({ virtuals: true });
      
      // 生成包含关键词的摘要
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
        url: `/blog/${blogObj._id}`,
        relevanceScore: blogObj.score || 0
      };
    });

    res.json({
      success: true,
      data: transformedBlogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
};

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
