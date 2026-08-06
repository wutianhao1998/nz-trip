// ================================
// Express 应用入口
// 职责：天气 API 跨域中转、健康检查、静态托管（生产）
// ================================
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import weatherRouter from './routes/weather'

// ESModule 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = Number(process.env.PORT) || 3001

// ---- 全局中间件 ----
app.use(cors())
app.use(express.json({ limit: '2mb' })) // 请求体上限 2MB
// 请求日志（开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })
}

// ---- 健康检查 ----
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'NZ Trip Planner API is running',
    timestamp: Date.now(),
    uptime: process.uptime(),
  })
})

// ---- 业务路由 ----
app.use('/api/weather', weatherRouter)

// ---- 生产环境：托管前端 dist 静态资源 ----
const distDir = path.resolve(__dirname, '..', 'dist')
app.use(express.static(distDir))

// SPA 路由兜底
app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
  const indexHtml = path.join(distDir, 'index.html')
  res.sendFile(indexHtml, (err) => {
    if (err) {
      // 若 dist 还没构建，返回友好提示
      res.status(404).json({
        success: false,
        message: '前端未构建，请先执行 npm run build',
      })
    }
  })
})

// ---- 全局错误兜底 ----
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('[Server] 未捕获错误:', err.stack || err.message)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ---- 启动监听（非 Vercel Serverless 模式）----
// Vercel 部署会导出 app，不需要监听
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
    ============================================
     🚀 NZ Trip Planner API 已启动
     📍 服务地址: http://localhost:${PORT}
     🌦️  天气接口: http://localhost:${PORT}/api/weather?city=AKL
     📊 健康检查: http://localhost:${PORT}/api/health
    ============================================
    `)
  })
}

// Vercel 导出
export default app
