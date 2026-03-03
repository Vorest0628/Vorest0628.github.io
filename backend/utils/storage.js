const fs = require('fs/promises')
const path = require('path')

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads')
const PUBLIC_UPLOAD_PREFIX = '/uploads'

let blobClient = null

function getStorageDriver() {
  return (process.env.STORAGE_DRIVER || 'local').toLowerCase()
}

function sanitizeSegment(segment) {
  return String(segment || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
}

function normalizeStorageKey(key) {
  const raw = String(key || '').replace(/\\/g, '/').replace(/^\/+/, '')
  const parts = raw
    .split('/')
    .filter(Boolean)
    .map(sanitizeSegment)
    .filter(Boolean)

  if (parts.length === 0 || parts.includes('..')) {
    throw new Error('Invalid storage key')
  }

  return parts.join('/')
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

function extractPathname(urlOrPath) {
  const value = String(urlOrPath || '').trim()
  if (!value) return ''

  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).pathname
    } catch {
      return ''
    }
  }

  return value
}

async function getBlobClient() {
  if (!blobClient) {
    try {
      blobClient = require('@vercel/blob')
    } catch (error) {
      throw new Error(`@vercel/blob unavailable: ${error.message}`)
    }
  }

  return blobClient
}

async function uploadBuffer(key, buffer, options = {}) {
  const { contentType, allowOverwrite = false } = options
  const normalizedKey = normalizeStorageKey(key)
  const driver = getStorageDriver()

  if (driver === 'blob') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required when STORAGE_DRIVER=blob')
    }

    const { put } = await getBlobClient()
    const result = await put(normalizedKey, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: !allowOverwrite
    })

    return { url: result.url, key: normalizedKey }
  }

  const absolutePath = path.join(UPLOAD_ROOT, ...normalizedKey.split('/'))
  const rootResolved = path.resolve(UPLOAD_ROOT)
  const fileResolved = path.resolve(absolutePath)

  if (!fileResolved.startsWith(rootResolved)) {
    throw new Error('Resolved upload path is outside upload root')
  }

  await fs.mkdir(path.dirname(fileResolved), { recursive: true })
  await fs.writeFile(fileResolved, buffer)

  const relativePath = toPosixPath(path.relative(UPLOAD_ROOT, fileResolved))
  return {
    url: `${PUBLIC_UPLOAD_PREFIX}/${relativePath}`,
    key: relativePath
  }
}

async function deleteStoredFile(urlOrPath) {
  const pathname = extractPathname(urlOrPath)
  if (!pathname) return false

  const driver = getStorageDriver()
  if (driver === 'blob') {
    if (!/^https?:\/\//i.test(String(urlOrPath || ''))) return false
    const { del } = await getBlobClient()
    await del(String(urlOrPath))
    return true
  }

  if (!pathname.startsWith(`${PUBLIC_UPLOAD_PREFIX}/`)) {
    return false
  }

  const relative = pathname.slice(`${PUBLIC_UPLOAD_PREFIX}/`.length)
  const absolutePath = path.join(UPLOAD_ROOT, ...relative.split('/'))
  const rootResolved = path.resolve(UPLOAD_ROOT)
  const fileResolved = path.resolve(absolutePath)

  if (!fileResolved.startsWith(rootResolved)) {
    return false
  }

  try {
    await fs.unlink(fileResolved)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

module.exports = {
  uploadBuffer,
  deleteStoredFile,
  getStorageDriver
}
