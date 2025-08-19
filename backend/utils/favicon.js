const axios = require('axios')
const { URL } = require('url')

/**
 * 获取网站的favicon
 * 支持多种方式：Google Favicon API、直接获取、默认路径
 */

/*
favicon.js函数一览：
getGoogleFavicon 获取Google Favicon API的URL
getCommonFaviconPaths 获取常见的favicon路径
extractDomain 解析URL获取域名
checkUrlAccessibility 检查URL是否可访问
getFavicon 获取网站favicon
getBatchFavicons 批量获取多个网站的favicon
*/

// Google Favicon API - 最可靠的方案
const getGoogleFavicon = (domain) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

// 备用方案：尝试常见的favicon路径
const getCommonFaviconPaths = (baseUrl) => {
  return [
    `${baseUrl}/favicon.ico`,
    `${baseUrl}/favicon.png`,
    `${baseUrl}/apple-touch-icon.png`,
    `${baseUrl}/apple-touch-icon-precomposed.png`
  ]
}

// 解析URL获取域名
const extractDomain = (url) => {
  try {
    // 确保URL有协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (error) {
    console.error('URL解析失败:', error)
    return null
  }
}

// 检查URL是否可访问
const checkUrlAccessibility = async (url, timeout = 5000) => {
  try {
    const response = await axios.head(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    return response.status === 200
  } catch (error) {
    return false
  }
}

// 主要函数：获取网站favicon
const getFavicon = async (websiteUrl) => {
  try {
    const domain = extractDomain(websiteUrl)
    if (!domain) {
      throw new Error('无效的网站地址')
    }

    console.log(`🔍 正在获取网站 ${domain} 的favicon...`)

    // 方案1: 使用Google Favicon API（最推荐）
    const googleFaviconUrl = getGoogleFavicon(domain)
    
    // 验证Google API是否返回有效图标
    const isGoogleFaviconValid = await checkUrlAccessibility(googleFaviconUrl)
    
    if (isGoogleFaviconValid) {
      console.log(`✅ 通过Google API获取到favicon: ${googleFaviconUrl}`)
      return {
        success: true,
        faviconUrl: googleFaviconUrl,
        method: 'google-api',
        domain
      }
    }

    // 方案2: 尝试网站自身的favicon路径
    const baseUrl = `https://${domain}`
    const commonPaths = getCommonFaviconPaths(baseUrl)
    
    for (const faviconPath of commonPaths) {
      const isAccessible = await checkUrlAccessibility(faviconPath)
      if (isAccessible) {
        console.log(`✅ 通过直接路径获取到favicon: ${faviconPath}`)
        return {
          success: true,
          faviconUrl: faviconPath,
          method: 'direct-path',
          domain
        }
      }
    }

    // 方案3: 降级到Google API（即使检查失败，Google通常也会返回一个通用图标）
    console.log(`⚠️ 未找到直接favicon，使用Google API作为备选`)
    return {
      success: true,
      faviconUrl: googleFaviconUrl,
      method: 'google-fallback',
      domain
    }

  } catch (error) {
    console.error('❌ 获取favicon失败:', error)
    
    // 完全失败时返回默认图标
    return {
      success: false,
      faviconUrl: '/uploads/avatars/default.png',
      method: 'default',
      error: error.message,
      domain: extractDomain(websiteUrl)
    }
  }
}

// 批量获取多个网站的favicon
const getBatchFavicons = async (urls) => {
  const results = []
  
  for (const url of urls) {
    const result = await getFavicon(url)
    results.push({
      originalUrl: url,
      ...result
    })
  }
  
  return results
}

module.exports = {
  getFavicon,
  getBatchFavicons,
  extractDomain,
  getGoogleFavicon
} 