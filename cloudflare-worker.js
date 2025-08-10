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

// 后端 API 源站（主）与回退（备）
// 主：你的 API 子域（可能在某些地区或时段出现 522 超时）
// 备：Vercel 应用域（同路径下提供 /api 服务）
// 注意：PRIMARY_ORIGIN 不能指向当前绑定的自定义域（api.shirakawananase.top），否则会产生自我代理死循环
const PRIMARY_ORIGIN = 'https://vorest0628-github-io.vercel.app'
const FALLBACK_ORIGIN = 'https://vorest0628-github-io.vercel.app'

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
    // 组装目标 URL（主、备）
    const targetPath = `${url.pathname}${url.search}`
    const primaryUrl = `${PRIMARY_ORIGIN}${targetPath}`
    const fallbackUrl = `${FALLBACK_ORIGIN}${targetPath}`

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
    
    // 代理请求初始化
    const proxyInit = {
      method: request.method,
      headers,
      body: request.body
    }

    // 先打到主源，超时/5xx/522/523/524/525/526 回退到备源
    let response
    let originUsed = 'primary'
    try {
      response = await fetchWithTimeout(primaryUrl, proxyInit, 4000)
      if (!response || response.status >= 500 || [520, 522, 523, 524, 525, 526].includes(response.status)) {
        throw new Error(`primary_bad_status_${response ? response.status : 'no_response'}`)
      }
    } catch (_) {
      response = await fetchWithTimeout(fallbackUrl, proxyInit, 8000)
      originUsed = 'fallback'
    }
    
    // 创建响应，添加CORS头部
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    const finalHeaders = new Headers(responseHeaders)
    finalHeaders.set('X-Worker', 'api-proxy')
    finalHeaders.set('X-Worker-Origin', originUsed)
    finalHeaders.set('X-Worker-Target', originUsed === 'primary' ? primaryUrl : fallbackUrl)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders
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