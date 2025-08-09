const mongoose = require('mongoose')

const blogAssetSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    default: ''
  },
  blobUrl: {
    type: String,
    required: true
  }
}, { timestamps: true })

blogAssetSchema.index({ blogId: 1, filename: 1 }, { unique: true })

module.exports = mongoose.model('BlogAsset', blogAssetSchema)
