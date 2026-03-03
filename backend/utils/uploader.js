// backend/utils/uploader.js
const { uploadBuffer, deleteStoredFile } = require('./storage')

async function uploadBufferToBlob(key, buffer, contentType, allowOverwrite = false) {
  // Retain compatibility with existing call sites.
  const result = await uploadBuffer(key, buffer, {
    contentType,
    allowOverwrite
  })

  return result.url
}

async function deleteFromStorage(urlOrPath) {
  return deleteStoredFile(urlOrPath)
}

module.exports = {
  uploadBufferToBlob,
  deleteFromStorage
}
