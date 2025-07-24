const Gallery = require('../models/Gallery');
const { ApiError, catchAsync } = require('../utils/error');
const { imageUpload } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// PUBLIC: Get image list with filters
exports.getImages = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  let filter = { 
    isPublic: true,
    status: 'published'
  };
  
  if (req.query.category && req.query.category !== '全部') {
    filter.category = req.query.category;
  }
  
  if (req.query.tag && req.query.tag !== '全部') {
    filter.secondaryTags = req.query.tag;
  }
  
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  
  const totalImages = await Gallery.countDocuments(filter);
  const totalPages = Math.ceil(totalImages / limit);
  
  const images = await Gallery.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
  
  res.status(200).json({
    success: true,
    data: {
      images,
      pagination: {
        current: page,
        pageSize: limit,
        total: totalImages,
        pages: totalPages
      }
    }
  });
});

// PUBLIC: Get a single image by ID
exports.getImage = catchAsync(async (req, res) => {
  const image = await Gallery.findById(req.params.id);
  
  if (!image || !image.isPublic) {
    throw new ApiError('找不到该图片或图片未公开', 404);
  }
  
  image.viewCount += 1;
  await image.save();
  
  res.status(200).json({
    success: true,
    data: image
  });
});

// ADMIN: Upload a new image
exports.uploadImage = catchAsync(async (req, res) => {
  const upload = imageUpload.single('image');
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: `上传失败: ${err.message}` });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的图片' });
    }
    
    try {
      const { title, description, category, isPublic, status } = req.body;
      const secondaryTags = req.body.secondaryTags 
        ? JSON.parse(req.body.secondaryTags) // Expecting a JSON string array
        : [];
      
      const imageInfo = await sharp(req.file.path).metadata();
      
      const thumbnailDir = path.join(__dirname, '..', 'uploads', 'gallery', 'thumbnails');
      if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });
      const thumbnailPath = path.join(thumbnailDir, path.basename(req.file.path));
      
      await sharp(req.file.path)
        .resize(400) 
        .toFile(thumbnailPath);
      
      const newImage = await Gallery.create({
        title,
        description,
        thumbnail: `uploads/gallery/thumbnails/${path.basename(req.file.path)}`,
        fullSize: req.file.path,
        category,
        secondaryTags,
        isPublic: isPublic === 'true',
        status: status || 'published',
        width: imageInfo.width,
        height: imageInfo.height,
        date: new Date()
      });
      
      res.status(201).json({ success: true, data: newImage, message: '图片上传成功' });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ success: false, message: `图片处理失败: ${error.message}` });
    }
  });
});

// ADMIN: Update image details
exports.updateImage = catchAsync(async (req, res) => {
  const { title, description, category, secondaryTags, isPublic, status } = req.body;
  
  const image = await Gallery.findById(req.params.id);
  if (!image) throw new ApiError('找不到该图片', 404);

  if (title) image.title = title;
  if (description) image.description = description;
  if (category) image.category = category;
  if (secondaryTags) image.secondaryTags = JSON.parse(secondaryTags);
  if (isPublic !== undefined) image.isPublic = isPublic === 'true';
  if (status) image.status = status;
  
  await image.save();
  
  res.status(200).json({ success: true, data: image, message: '图片信息更新成功' });
});

// ADMIN: Delete an image
exports.deleteImage = catchAsync(async (req, res) => {
  const image = await Gallery.findById(req.params.id);
  if (!image) throw new ApiError('找不到该图片', 404);
  
  try {
    if (image.fullSize && fs.existsSync(image.fullSize)) fs.unlinkSync(image.fullSize);
    const thumbPath = path.join(__dirname, '..', image.thumbnail);
    if (image.thumbnail && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
  } catch (err) {
    console.error('删除文件失败:', err);
  }
  
  await Gallery.findByIdAndDelete(req.params.id);
  
  res.status(200).json({ success: true, message: '图片删除成功' });
});

// PUBLIC: Get all unique tags
exports.getUniqueTags = catchAsync(async (req, res) => {
  const tags = await Gallery.distinct('secondaryTags', { isPublic: true, status: 'published' });
  res.status(200).json({ success: true, data: tags });
});

// PUBLIC: Get filters (categories and tags)
exports.getFilters = catchAsync(async (req, res) => {
  const categories = await Gallery.distinct('category', { isPublic: true, status: 'published' });
  categories.unshift('全部');
  
  res.status(200).json({ success: true, data: { categories } });
});

// ADMIN: Get all images for the admin panel
exports.getAllImages = catchAsync(async (req, res) => {
    const images = await Gallery.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: images });
});

