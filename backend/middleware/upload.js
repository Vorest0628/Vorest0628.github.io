const multer = require('multer');
const { ApiError } = require('../utils/error');

/**
 * Middleware to handle errors from Multer.
 * This catches common upload errors, such as file size limits,
 * and translates them into a user-friendly ApiError.
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, '文件大小超出限制'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, '文件数量超出限制'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(400, '意外的文件字段'));
    }
  }
  // For other errors, pass them along
  next(error);
};

module.exports = {
  handleUploadError,
};

