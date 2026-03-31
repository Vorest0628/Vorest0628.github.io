const jwt = require('jsonwebtoken')
const { ApiError } = require('./error')

const DEV_FALLBACK_JWT_SECRET = 'local-dev-jwt-secret-change-me'

let hasWarnedAboutFallbackSecret = false

const getConfiguredJwtSecret = () => {
  return typeof process.env.JWT_SECRET === 'string' ? process.env.JWT_SECRET.trim() : ''
}

const isLocalDevelopment = () => {
  return process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1'
}

const resolveJwtSecret = () => {
  const configuredSecret = getConfiguredJwtSecret()
  if (configuredSecret) {
    return configuredSecret
  }

  if (isLocalDevelopment()) {
    if (!hasWarnedAboutFallbackSecret) {
      console.warn('⚠️ JWT_SECRET 未配置，当前使用仅限本地开发的回退密钥。请尽快在 backend/setting.env 或 backend/.env 中补充 JWT_SECRET。')
      hasWarnedAboutFallbackSecret = true
    }

    return DEV_FALLBACK_JWT_SECRET
  }

  throw new ApiError(503, '服务端缺少 JWT_SECRET 配置，请联系管理员。')
}

const signToken = (payload, options = {}) => {
  return jwt.sign(payload, resolveJwtSecret(), options)
}

const verifyToken = (token, options = {}) => {
  return jwt.verify(token, resolveJwtSecret(), options)
}

module.exports = {
  getConfiguredJwtSecret,
  resolveJwtSecret,
  signToken,
  verifyToken
}
