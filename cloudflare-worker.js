// Cloudflare Worker - API代理
// 用于解决Vercel在大陆访问受限的问题

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 只处理API请求
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request, url)
  }
  
  // 非 /api/ 请求：在边缘直接响应，避免回源
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  return new Response(JSON.stringify({
    success: false,
    message: '仅支持 /api/ 路径'
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// 后端 API 源站（Vercel 部署）
const API_ORIGIN = 'https://vorest0628-github-io.vercel.app'

// 简易超时封装，避免长时间等待导致 522 体验不佳
async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort('timeout'), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function handleApiRequest(request, url) {
  try {
    // 组装目标 URL
    const targetPath = `${url.pathname}${url.search}`
    const targetUrl = `${API_ORIGIN}${targetPath}`

    // 创建新的请求头，移除可能导致问题的头部
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('origin')
    headers.delete('referer')
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      })
    }
    
    // 代理请求到 Vercel
    const response = await fetchWithTimeout(targetUrl, {
      method: request.method,
      headers,
      body: request.body
    }, 8000)
    
    // 创建响应，添加CORS头部
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })
    
  } catch (error) {
    console.error('Worker代理错误:', error)
    
    return new Response(JSON.stringify({
      success: false,
      message: '代理服务器错误',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
} 