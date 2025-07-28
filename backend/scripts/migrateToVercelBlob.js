// 条件导入 Vercel Blob
let put;
try {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobModule = require('@vercel/blob');
    put = blobModule.put;
  } else {
    console.error('❌ BLOB_READ_WRITE_TOKEN 环境变量未设置');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 无法加载 @vercel/blob:', error.message);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../setting.env' });

// 导入模型
const Document = require('../models/Document');
const Gallery = require('../models/Gallery');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 已连接到MongoDB');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    process.exit(1);
  }
}

async function migrateDocuments() {
  console.log('🔄 开始迁移文档文件...');
  
  const documents = await Document.find({
    filePath: { $regex: '^/?(uploads/|documents/)' } // 匹配本地路径
  });

  console.log(`📄 找到 ${documents.length} 个需要迁移的文档`);

  for (const doc of documents) {
    try {
      const localPath = path.join(__dirname, '..', doc.filePath.replace(/^\//, ''));
      
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️ 文件不存在，跳过: ${localPath}`);
        continue;
      }

      console.log(`📤 正在迁移: ${doc.title}`);
      
      const fileBuffer = fs.readFileSync(localPath);
      const fileName = path.basename(doc.filePath);
      
      // 上传到 Vercel Blob
      const blob = await put(`documents/${Date.now()}-${fileName}`, fileBuffer, {
        access: 'public',
      });

      // 更新数据库记录
      doc.filePath = blob.url;
      doc.downloadUrl = blob.url;
      await doc.save();

      console.log(`✅ 迁移成功: ${doc.title} -> ${blob.url}`);
      
    } catch (error) {
      console.error(`❌ 迁移失败: ${doc.title}`, error.message);
    }
  }
}

async function migrateGalleryImages() {
  console.log('🔄 开始迁移图库图片...');
  
  const images = await Gallery.find({
    $or: [
      { fullSize: { $regex: '^/?(uploads/)' } },
      { thumbnail: { $regex: '^/?(uploads/)' } }
    ]
  });

  console.log(`🖼️ 找到 ${images.length} 个需要迁移的图片`);

  for (const img of images) {
    try {
      console.log(`📤 正在迁移图片: ${img.title}`);
      
      // 迁移全尺寸图片
      if (img.fullSize && img.fullSize.includes('uploads/')) {
        const fullSizePath = path.join(__dirname, '..', img.fullSize.replace(/^\//, ''));
        if (fs.existsSync(fullSizePath)) {
          const fullSizeBuffer = fs.readFileSync(fullSizePath);
          const fullSizeBlob = await put(`gallery/full/${Date.now()}-${path.basename(img.fullSize)}`, fullSizeBuffer, {
            access: 'public',
          });
          img.fullSize = fullSizeBlob.url;
        }
      }

      // 迁移缩略图
      if (img.thumbnail && img.thumbnail.includes('uploads/')) {
        const thumbnailPath = path.join(__dirname, '..', img.thumbnail.replace(/^\//, ''));
        if (fs.existsSync(thumbnailPath)) {
          const thumbnailBuffer = fs.readFileSync(thumbnailPath);
          const thumbnailBlob = await put(`gallery/thumbnails/${Date.now()}-${path.basename(img.thumbnail)}`, thumbnailBuffer, {
            access: 'public',
          });
          img.thumbnail = thumbnailBlob.url;
        }
      }

      await img.save();
      console.log(`✅ 图片迁移成功: ${img.title}`);
      
    } catch (error) {
      console.error(`❌ 图片迁移失败: ${img.title}`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 开始文件迁移到 Vercel Blob');
  console.log('='.repeat(50));

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ 请在环境变量中设置 BLOB_READ_WRITE_TOKEN');
    process.exit(1);
  }

  await connectDB();

  try {
    await migrateDocuments();
    await migrateGalleryImages();
    
    console.log('='.repeat(50));
    console.log('✅ 文件迁移完成！');
    console.log('现在你的文件都存储在 Vercel Blob 中，版本更新时不会丢失。');
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// 只在直接运行脚本时执行
if (require.main === module) {
  main();
}

module.exports = { migrateDocuments, migrateGalleryImages }; 