/*
documentController.js函数一览：
getDocuments 获取文档列表
getDocumentById 获取单个文档详情
createDocument 创建新文档
updateDocument 更新文档
deleteDocument 删除文档
getCategories 获取所有分类和标签
getTags 获取所有标签
getCategoryStats 按分类获取文档统计
getPopularDocuments 获取热门文档
getDocumentContent 获取文档内容用于预览
previewDocument 预览文档
downloadDocument 下载文档
recordView 记录文档访问
toggleDocumentPublic 切换文档公开状态
uploadDocument 上传文档
*/

const Document = require('../models/Document')
const { ApiError, catchAsync } = require('../utils/error')
const { documentUpload } = require('../utils/fileUpload')
const { uploadBuffer, deleteStoredFile } = require('../utils/storage')

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
    if (document.filePath) {
      await deleteStoredFile(document.filePath);
      console.log('✅ 已删除文档存储文件:', document.filePath);
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

// 获取文档内容用于预览
exports.getDocumentContent = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
    if (!document) {
      throw new ApiError(404, '文档不存在')
    }
    
    // 检查用户权限
    const isAdmin = req.user && req.user.role === 'admin'
    if (!isAdmin && (document.status !== 'published')) {
      throw new ApiError(403, '您没有权限预览此文档')
    }
    
    // 检查是否是Vercel Blob URL
    if (document.filePath.startsWith('https://')) {
      // 对于Vercel Blob存储，直接返回重定向
      return res.redirect(document.filePath)
    }
    
    // 本地文件处理
    const path = require('path')
    const fs = require('fs')
    const filePath = path.join(__dirname, '..', document.filePath)
    
    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, '文件不存在')
    }
    
    // 设置正确的Content-Type
    const contentType = getContentType(document.type)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="${document.title}"`)
    
    // 流式传输文件
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
    
  } catch (error) {
    next(error)
  }
}

// 获取文件Content-Type
const getContentType = (fileType) => {
  const typeMap = {
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'pdf': 'application/pdf',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'md': 'text/markdown; charset=utf-8',
    'txt': 'text/plain; charset=utf-8'
  }
  return typeMap[fileType?.toLowerCase()] || 'application/octet-stream'
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
    
    // 检查是否是Vercel Blob URL
    if (document.filePath.startsWith('https://')) {
      console.log('📁 文档存储在Vercel Blob:', document.filePath)
      
      // 对于Vercel Blob存储的文档，检查文件类型并处理
      const fileExtension = path.extname(document.filePath).toLowerCase()
      
      // 根据文件类型设置响应头
      switch (fileExtension) {
        case '.pdf':
          res.setHeader('Content-Type', 'application/pdf')
          return res.redirect(document.filePath)
          
        case '.txt':
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          return res.redirect(document.filePath)
          
        case '.md':
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
          return res.redirect(document.filePath)
          
        case '.docx':
          // 对于DOCX文件，直接返回文件内容供前端mammoth.js处理
          try {
            console.log('🔍 DOCX文件预览 - 返回原始文件供前端处理:', document.title)
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            return res.redirect(document.filePath)
          } catch (error) {
            console.error('DOCX文件预览失败:', error)
            throw new ApiError(500, 'DOCX文档预览失败，请尝试下载文档查看')
          }
          
        case '.pptx':
          // 对于PPTX文件，使用Office Online预览或返回提示
          try {
            console.log('🔍 PPTX文件预览 - 使用Office Online方案:', document.title)
            
            // 创建预览页面，使用多种预览方案
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>${document.title} - PowerPoint预览</title>
                <style>
                  body {
                    font-family: 'Microsoft YaHei', Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: #f5f5f5;
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 1.8rem;
                  }
                  .header .meta {
                    margin-top: 10px;
                    opacity: 0.9;
                    font-size: 0.9rem;
                  }
                  .preview-options {
                    max-width: 800px;
                    margin: 30px auto;
                    padding: 20px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .option-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 15px;
                    transition: all 0.3s ease;
                  }
                  .option-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
                  }
                  .option-title {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                  }
                  .option-desc {
                    color: #666;
                    margin-bottom: 15px;
                    line-height: 1.6;
                  }
                  .option-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    transition: all 0.3s ease;
                  }
                  .option-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                  }
                  .download-section {
                    text-align: center;
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                  }
                  .iframe-container {
                    margin-top: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                    display: none;
                  }
                  .iframe-container.active {
                    display: block;
                  }
                  iframe {
                    width: 100%;
                    height: 600px;
                    border: none;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${document.title}</h1>
                  <div class="meta">
                    文档类型: PowerPoint | 作者: ${document.author} | 大小: ${document.formattedSize || '未知'}
                  </div>
                </div>
                
                <div class="preview-options">
                  <div class="option-card">
                    <div class="option-title">🌐 Office Online 预览</div>
                    <div class="option-desc">使用微软官方的Office Online服务预览PowerPoint文档，支持完整的格式和动画效果。</div>
                    <button class="option-btn" onclick="previewWithOfficeOnline()">
                      打开Office Online预览
                    </button>
                  </div>
                  
                  <div class="option-card">
                    <div class="option-title">📱 Google Docs 预览</div>
                    <div class="option-desc">使用Google Docs查看器预览文档，适合快速浏览文档内容。</div>
                    <button class="option-btn" onclick="previewWithGoogleDocs()">
                      打开Google Docs预览
                    </button>
                  </div>
                  
                  <div class="iframe-container" id="previewFrame"></div>
                  
                  <div class="download-section">
                    <p style="color: #666; margin-bottom: 15px;">如果在线预览不可用，您可以下载文档到本地查看完整内容</p>
                    <a href="/api/documents/${document._id}/download" class="option-btn">
                      📥 下载完整文档
                    </a>
                  </div>
                </div>
                
                <script>
                  const fileUrl = encodeURIComponent('${document.filePath}');
                  
                  function previewWithOfficeOnline() {
                    const viewerUrl = \`https://view.officeapps.live.com/op/embed.aspx?src=\${fileUrl}\`;
                    showPreview(viewerUrl);
                  }
                  
                  function previewWithGoogleDocs() {
                    const viewerUrl = \`https://docs.google.com/gview?url=\${fileUrl}&embedded=true\`;
                    showPreview(viewerUrl);
                  }
                  
                  function showPreview(url) {
                    const container = document.getElementById('previewFrame');
                    container.innerHTML = \`<iframe src="\${url}" title="文档预览"></iframe>\`;
                    container.classList.add('active');
                    container.scrollIntoView({ behavior: 'smooth' });
                  }
                </script>
              </body>
              </html>
            `
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            return res.send(htmlContent)
          } catch (error) {
            console.error('PPTX预览失败:', error)
            throw new ApiError(500, 'PowerPoint文档预览失败，请尝试下载文档查看')
          }
          
        default:
          res.setHeader('Content-Type', 'application/octet-stream')
          return res.redirect(document.filePath)
      }
    }
    
    // 本地文件处理（向后兼容）
    let filePath
    if (document.filePath.startsWith('/uploads/')) {
      filePath = path.join(__dirname, '..', document.filePath.substring(1))
    } else if (document.filePath.startsWith('uploads/')) {
      filePath = path.join(__dirname, '..', document.filePath)
    } else {
      filePath = path.join(__dirname, '..', 'uploads', 'documents', document.filePath)
    }
    
    console.log('📁 本地文档文件路径:', document.filePath)
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
        console.log('🔍 本地DOCX文档预览:', document.title);
        // 对于本地DOCX文件，直接返回文件供前端mammoth.js处理
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      case '.pptx':
      case '.ppt':
        console.log('🔍 本地PPTX文档预览:', document.title);
        // 对于本地PPTX文件，返回提示页面
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${document.title} - PowerPoint预览</title>
            <style>
              body {
                font-family: 'Microsoft YaHei', Arial, sans-serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .preview-container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 600px;
                width: 100%;
              }
              .icon {
                font-size: 4rem;
                margin-bottom: 20px;
              }
              h1 {
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 1.8rem;
              }
              .message {
                color: #666;
                line-height: 1.6;
                margin-bottom: 30px;
                font-size: 1.1rem;
              }
              .download-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: transform 0.3s ease;
              }
              .download-btn:hover {
                transform: translateY(-2px);
              }
              .dev-note {
                background: #e8f4fd;
                border: 1px solid #3498db;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
                color: #2c3e50;
                font-size: 0.9rem;
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <div class="icon">📄</div>
              <h1>${document.title}</h1>
              <div class="message">
                PowerPoint文档建议下载到本地使用Microsoft PowerPoint或兼容软件查看，以获得最佳的预览体验。
              </div>
              <a href="/api/documents/${document._id}/download" class="download-btn">
                📥 下载文档
              </a>
              <div class="dev-note">
                <strong>提示：</strong>本地环境下，可以考虑集成LibreOffice进行服务器端转换预览。
              </div>
            </div>
          </body>
          </html>
        `
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.send(htmlContent)
      default:
        throw new ApiError(400, '不支持预览此文件类型')
    }

    console.log('📤 准备发送响应:');
    console.log('  - 文件路径:', finalPath);
    console.log('  - 内容类型:', contentType);
    console.log('  - 文件存在:', require('fs').existsSync(finalPath));
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
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

  // 如果文档存储在远程URL中，直接重定向到该URL
  if (document.filePath && document.filePath.startsWith('http')) {
    console.log('📦 重定向到远程存储:', document.filePath);
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

      // 上传文件到统一存储（本地/Blob）
      const storedFile = await uploadBuffer(`documents/${Date.now()}-${originalName}`, fileBuffer, {
        contentType: req.file.mimetype
      });

      // 创建文档记录
      const document = await Document.create({
        title: title.trim(),
        description: description?.trim() || '',
        filePath: storedFile.url, // 使用统一存储URL
        downloadUrl: storedFile.url, // 添加下载URL
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
