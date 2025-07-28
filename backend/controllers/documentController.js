// 条件导入 Vercel Blob，如果没有配置则使用空函数
let put, del;
try {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobModule = require('@vercel/blob');
    put = blobModule.put;
    del = blobModule.del;
  } else {
    console.warn('⚠️ BLOB_READ_WRITE_TOKEN 未配置，Vercel Blob 功能将被禁用');
    put = async () => { throw new Error('Vercel Blob 未配置'); };
    del = async () => { console.log('Vercel Blob 未配置，跳过删除'); };
  }
} catch (error) {
  console.warn('⚠️ 无法加载 @vercel/blob:', error.message);
  put = async () => { throw new Error('Vercel Blob 不可用'); };
  del = async () => { console.log('Vercel Blob 不可用，跳过删除'); };
}

const Document = require('../models/Document')
const { ApiError, catchAsync } = require('../utils/error')
const { documentUpload } = require('../utils/fileUpload')

// 获取文档列表
exports.getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search, type, status } = req.query
    
    const query = {}

    // 状态过滤 - 如果指定了status参数，则使用它
    if (status) {
      query.status = status
      // 如果不是管理员但查询特定状态，仍需要确保文档是公开的
      if ((!req.user || req.user.role !== 'admin') && (status === 'published' || status === 'pinned')) {
        query.isPublic = true
      }
    } else {
      // 角色访问控制
      // 如果用户不是管理员，则只显示公开的、已发布的或置顶的文档
      if (!req.user || req.user.role !== 'admin') {
        query.isPublic = true
        query.status = { $in: ['published', 'pinned'] }
      }
    }
    
    // 分类过滤
    if (category && category !== '全部') {
      query.category = category
    }
    
    // 类型过滤
    if (type && type !== '全部') {
      query.type = type
    }
    
    // 搜索功能
    if (search) {
      query.$text = { $search: search }
    }

    const documents = await Document.find(query)
      .sort({ pinnedPriority: -1, date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Document.countDocuments(query)

    res.json({
      success: true,
      data: documents,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取单个文档详情
exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      throw new ApiError(404, '文档不存在');
    }

    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && (document.status !== 'published')) {
      throw new ApiError(404, '文档不存在或未发布');
    }

    // 更新下载次数
    document.downloadCount += 1;
    await document.save();

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// 创建新文档
exports.createDocument = async (req, res, next) => {
  try {
    const { title, content, author, category, tags, isPublic = true, status = 'draft' } = req.body

    if (!title || title.trim().length === 0) {
      throw new ApiError(400, '文档标题不能为空')
    }

    if (!content || content.trim().length === 0) {
      throw new ApiError(400, '文档内容不能为空')
    }

    if (!author || author.trim().length === 0) {
      throw new ApiError(400, '作者名称不能为空')
    }

    // 设置置顶优先级
    const pinnedPriority = status === 'pinned' ? 1 : 0

    const document = await Document.create({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      category: category?.trim() || '未分类',
      tags: Array.isArray(tags) ? tags.filter(tag => tag && tag.trim()) : [],
      isPublic,
      status,
      pinnedPriority,
      views: 0
    })

    res.status(201).json({
      success: true,
      data: { document },
      message: '文档创建成功'
    })
  } catch (error) {
    next(error)
  }
}

// 更新文档
exports.updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      throw new ApiError(404, '文档不存在')
    }

    const { title, content, author, category, tags, isPublic, status } = req.body

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new ApiError(400, '文档标题不能为空')
      }
      document.title = title.trim()
    }

    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        throw new ApiError(400, '文档内容不能为空')
      }
      document.content = content.trim()
    }

    if (author !== undefined) {
      if (!author || author.trim().length === 0) {
        throw new ApiError(400, '作者名称不能为空')
      }
      document.author = author.trim()
    }

    if (category !== undefined) {
      document.category = category.trim() || '未分类'
    }

    if (tags !== undefined) {
      document.tags = Array.isArray(tags) ? tags.filter(tag => tag && tag.trim()) : []
    }

    if (isPublic !== undefined) {
      document.isPublic = isPublic
    }

    if (status !== undefined) {
      document.status = status
      // 设置置顶优先级
      document.pinnedPriority = status === 'pinned' ? 1 : 0
    }

    document.updatedAt = new Date()
    await document.save()

    res.json({
      success: true,
      data: { document },
      message: '文档更新成功'
    })
  } catch (error) {
    next(error)
  }
}

// 删除文档
exports.deleteDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ApiError(404, '文档不存在');
  }

  try {
    // 如果文档存储在Vercel Blob中，删除Blob文件
    if (document.filePath && document.filePath.startsWith('https://')) {
      await del(document.filePath);
      console.log('✅ 已删除Vercel Blob文件:', document.filePath);
    }
  } catch (err) {
    // 记录错误但不阻止数据库删除
    console.error('从Vercel Blob删除文件失败:', err);
  }

  await Document.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: '文档删除成功'
  });
});

// 获取所有分类和标签
exports.getCategories = async (req, res, next) => {
  try {
    // 只从已发布的公开文档中获取分类
    const categories = await Document.distinct('category', { 
      isPublic: true, 
      status: 'published' 
    })
    
    // 添加"全部"选项
    categories.unshift('全部')
    
    // 获取所有标签（只从已发布的文档）
    const allTags = await Document.aggregate([
      { $match: { isPublic: true, status: 'published' } },
      { $unwind: '$secondaryTags' },
      { $group: { _id: '$secondaryTags' }},
      { $sort: { _id: 1 }}
    ]).then(results => results.map(item => item._id))
    
    // 按分类获取标签（只从已发布的文档）
    const tagsByCategory = {}
    
    for (const category of categories) {
      if (category === '全部') continue
      
      const tags = await Document.aggregate([
        { $match: { category, isPublic: true, status: 'published' } },
        { $unwind: '$secondaryTags' },
        { $group: { _id: '$secondaryTags' }},
        { $sort: { _id: 1 }}
      ]).then(results => results.map(item => item._id))
      
      tagsByCategory[category] = tags
    }
    
    res.json({
      success: true,
      data: {
        categories,
        allTags,
        tagsByCategory
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取所有标签
exports.getTags = async (req, res, next) => {
  try {
    const allTags = await Document.distinct('tags')
    const filteredTags = allTags.filter(tag => tag && tag.trim().length > 0)

    res.json({
      success: true,
      data: { tags: filteredTags }
    })
  } catch (error) {
    next(error)
  }
}

// 按分类获取文档统计
exports.getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Document.aggregate([
      { $match: { category: { $ne: null, $ne: "" } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    res.json({
      success: true,
      data: { stats }
    })
  } catch (error) {
    next(error)
  }
}

// 获取热门文档（按访问量排序）
exports.getPopularDocuments = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query

    const documents = await Document.find({ isPublic: true })
      .sort({ views: -1 })
      .limit(parseInt(limit))
      .select('title author views createdAt')

    res.json({
      success: true,
      data: { documents }
    })
  } catch (error) {
    next(error)
  }
}

// 预览文档
exports.previewDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      throw new ApiError(404, '文档不存在');
    }

    // 检查用户权限
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && (document.status !== 'published')) {
      throw new ApiError(403, '您没有权限预览此文档');
    }

    const path = require('path')
    const fs = require('fs')
    const documentConverter = require('../utils/documentConverter')
    
    // 构建文件路径
    let filePath
    if (document.filePath.startsWith('/uploads/')) {
      // 如果路径以/uploads/开头，去掉开头的斜杠
      filePath = path.join(__dirname, '..', document.filePath.substring(1))
    } else if (document.filePath.startsWith('uploads/')) {
      // 如果路径以uploads/开头
      filePath = path.join(__dirname, '..', document.filePath)
    } else {
      // 其他情况，假设是相对于uploads目录
      filePath = path.join(__dirname, '..', 'uploads', 'documents', document.filePath)
    }
    
    console.log('📁 文档文件路径:', document.filePath)
    console.log('📁 构建的完整路径:', filePath)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('❌ 文件不存在:', filePath)
      throw new ApiError(404, '文件不存在')
    }

    const fileExtension = path.extname(document.filePath).toLowerCase()
    let finalPath = filePath
    let contentType = 'application/octet-stream'
    
    // 根据文件类型处理
    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.txt':
        contentType = 'text/plain; charset=utf-8'
        break
      case '.md':
        contentType = 'text/markdown; charset=utf-8'
        break
      case '.docx':
        console.log('🔍 开始处理DOCX文档预览:', document.title);
        console.log('📁 原始文件路径:', filePath);
        try {
          // 优先尝试PDF转换
          console.log('🔄 尝试PDF转换...');
          finalPath = await documentConverter.smartConvert(filePath, 'pdf')
          console.log('✅ PDF转换成功:', finalPath);
          contentType = 'application/pdf'
        } catch (convertError) {
          console.error('❌ DOCX PDF转换失败:', convertError.message)
          // 如果PDF转换失败，尝试HTML预览作为备选方案
          try {
            console.log('🔄 尝试HTML转换作为备选方案...');
            const htmlContent = await documentConverter.convertDocxToHtml(filePath)
            console.log('✅ HTML转换成功, 长度:', htmlContent.length);
            // 创建一个简单的HTML文档并作为blob返回
            const htmlDocument = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>${document.title}</title>
                <style>
                  body {
                    font-family: 'Microsoft YaHei', Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                    background-color: #f9f9f9;
                  }
                  .document-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                  }
                  .document-header {
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 15px;
                    margin-bottom: 30px;
                    text-align: center;
                  }
                  .document-header h1 {
                    color: #333;
                    margin: 0 0 10px 0;
                    font-size: 2em;
                  }
                  .document-meta {
                    color: #666;
                    font-size: 0.9em;
                  }
                  .document-content {
                    font-size: 1.1em;
                    color: #333;
                  }
                  .document-content p {
                    margin-bottom: 1em;
                  }
                  .conversion-notice {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    font-size: 0.9em;
                  }
                </style>
              </head>
              <body>
                <div class="document-container">
                  <div class="conversion-notice">
                    📄 此文档以HTML格式预览。LibreOffice转换失败，可能需要检查安装配置。
                  </div>
                  <div class="document-header">
                    <h1>${document.title}</h1>
                    <div class="document-meta">
                      文档类型: ${document.type} | 作者: ${document.author} | 大小: ${document.formattedSize || '未知'}
                    </div>
                  </div>
                  <div class="document-content">
                    ${htmlContent}
                  </div>
                </div>
              </body>
              </html>
            `
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            return res.send(htmlDocument)
          } catch (htmlError) {
            console.error('DOCX HTML转换也失败:', htmlError)
            throw new ApiError(500, 'DOCX文档预览失败：PDF转换和HTML转换都失败了')
          }
        }
        break
      case '.pptx':
      case '.ppt':
        try {
          // 尝试PDF转换
          finalPath = await documentConverter.smartConvert(filePath, 'pdf')
          contentType = 'application/pdf'
        } catch (convertError) {
          console.error('PPTX转换失败:', convertError)
          // PPTX转换失败，返回错误信息而不是HTML页面
          throw new ApiError(500, `PowerPoint文档预览失败：${convertError.message}。请检查LibreOffice配置或下载文档到本地查看。`)
        }
        break
      default:
        throw new ApiError(400, '不支持预览此文件类型')
    }

    console.log('📤 准备发送响应:');
    console.log('  - 文件路径:', finalPath);
    console.log('  - 内容类型:', contentType);
    console.log('  - 文件存在:', require('fs').existsSync(finalPath));
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', 'inline')
    
    // 发送文件
    res.sendFile(finalPath)
  } catch (error) {
    next(error)
  }
}

// 下载文档
exports.downloadDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ApiError(404, '文档不存在');
  }

  // 检查用户权限
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isAdmin && (document.status !== 'published')) {
    throw new ApiError(403, '您没有权限下载此文档');
  }

  // 更新下载次数
  document.downloadCount += 1;
  await document.save();

  // 如果文档存储在Vercel Blob中，直接重定向到Blob URL
  if (document.filePath && document.filePath.startsWith('https://')) {
    console.log('📁 重定向到Vercel Blob:', document.filePath);
    return res.redirect(document.filePath);
  }

  // 兼容旧的本地文件系统路径（如果有的话）
  const path = require('path');
  const fs = require('fs');
  
  let filePath;
  if (document.filePath.startsWith('/uploads/')) {
    filePath = path.join(__dirname, '..', document.filePath.substring(1));
  } else if (document.filePath.startsWith('uploads/')) {
    filePath = path.join(__dirname, '..', document.filePath);
  } else {
    filePath = path.join(__dirname, '..', 'uploads', 'documents', document.filePath);
  }
  
  console.log('📁 下载文档文件路径:', document.filePath);
  console.log('📁 构建的完整路径:', filePath);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error('❌ 文件不存在:', filePath);
    throw new ApiError(404, '文件不存在');
  }

  // 设置下载响应头
  const fileName = `${document.title}.${document.type.toLowerCase()}`;
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  
  // 发送文件
  res.sendFile(filePath);
});

// 记录文档访问
exports.recordView = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      throw new ApiError(404, '文档不存在');
    }

    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && (document.status !== 'published')) {
      throw new ApiError(404, '文档不存在或未发布');
    }

    // 更新访问次数（如果有views字段的话）
    if (document.views !== undefined) {
      document.views += 1;
      await document.save();
    }

    res.json({
      success: true,
      message: '访问记录成功'
    });
  } catch (error) {
    next(error);
  }
};

// 切换文档公开状态
exports.toggleDocumentPublic = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      throw new ApiError(404, '文档不存在')
    }

    document.isPublic = !document.isPublic
    await document.save()

    res.json({
      success: true,
      data: { document },
      message: `文档已${document.isPublic ? '公开' : '隐藏'}`
    })
  } catch (error) {
    next(error)
  }
}

// 上传文档
exports.uploadDocument = catchAsync(async (req, res) => {
  const upload = documentUpload.single('document');

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: `上传失败: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的文件' });
    }

    try {
      const { title, description, category, secondaryTags, type, status = 'draft' } = req.body;
      
      // 验证必填字段
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ success: false, message: '文档标题不能为空' });
      }

      if (!category) {
        return res.status(400).json({ success: false, message: '请选择文档分类' });
      }

      // 处理二级标签
      let parsedSecondaryTags = [];
      if (secondaryTags) {
        try {
          parsedSecondaryTags = typeof secondaryTags === 'string'
            ? JSON.parse(secondaryTags)
            : secondaryTags;
        } catch (e) {
          parsedSecondaryTags = [];
        }
      }

      const fileBuffer = req.file.buffer;
      const originalName = req.file.originalname;
      const fileType = type || originalName.split('.').pop().toUpperCase();

      // 上传文件到 Vercel Blob
      const blob = await put(`documents/${Date.now()}-${originalName}`, fileBuffer, {
        access: 'public',
        contentType: req.file.mimetype,
      });

      // 创建文档记录
      const document = await Document.create({
        title: title.trim(),
        description: description?.trim() || '',
        filePath: blob.url, // 使用 Vercel Blob URL
        downloadUrl: blob.url, // 添加下载URL
        fileSize: req.file.size,
        type: fileType,
        category: category,
        secondaryTags: parsedSecondaryTags,
        author: req.user.username || 'Admin',
        status: status,
        isPublic: true,
        downloadCount: 0,
        views: 0
      });

      console.log('文档上传成功:', {
        id: document._id,
        title: document.title,
        filePath: document.filePath,
        fileSize: document.fileSize,
        type: document.type
      });

      res.status(201).json({
        success: true,
        data: document,
        message: '文档上传成功'
      });
    } catch (error) {
      console.error('Document processing or upload failed:', error);
      res.status(500).json({ success: false, message: `文档处理或上传失败: ${error.message}` });
    }
  });
});
