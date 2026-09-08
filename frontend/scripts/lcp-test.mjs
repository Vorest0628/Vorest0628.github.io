import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const port = Number(process.env.LCP_PORT || 4173)
const budgetMs = Number(process.env.LCP_BUDGET_MS || 2500)
const targetUrl = process.env.LCP_URL || `http://127.0.0.1:${port}/`
const lighthouseBin = process.platform === 'win32'
  ? 'node_modules/.bin/lighthouse.cmd'
  : 'node_modules/.bin/lighthouse'

let previewServer

const waitForServer = async (url) => {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Vite has not started listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Timed out waiting for ${url}`)
}

const stopPreviewServer = async () => {
  if (!previewServer || previewServer.exitCode !== null) return
  previewServer.kill('SIGTERM')
  await once(previewServer, 'exit')
}

try {
  if (!process.env.LCP_URL) {
    previewServer = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
      stdio: 'ignore',
    })
    await waitForServer(targetUrl)
  }

  const { stdout } = await execFileAsync(lighthouseBin, [
    targetUrl,
    '--only-categories=performance',
    '--output=json',
    '--output-path=stdout',
    '--quiet',
    '--chrome-flags=--headless=new --no-sandbox',
  ], { maxBuffer: 25 * 1024 * 1024 })
  const report = JSON.parse(stdout)
  const lcp = report.audits['largest-contentful-paint']
  const lcpMs = lcp?.numericValue
  const lcpElement = report.audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet

  if (!Number.isFinite(lcpMs)) {
    throw new Error('Lighthouse did not return a Largest Contentful Paint value.')
  }

  console.log(`LCP: ${(lcpMs / 1000).toFixed(2)} s (budget: ${(budgetMs / 1000).toFixed(2)} s)`)
  console.log(`LCP element: ${lcpElement || 'unavailable'}`)

  if (lcpMs > budgetMs) {
    throw new Error(`LCP exceeded its ${budgetMs} ms budget: ${Math.round(lcpMs)} ms.`)
  }
} finally {
  await stopPreviewServer()
}
