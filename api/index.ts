// ================================
// Vercel Serverless 函数入口
// 将 Express 应用包装为 Vercel 的 Serverless 格式
// 路径：api/index.ts -> 访问 /api/*
// ================================
import app from '../server/index'

// Vercel serverless handler
export default app as unknown as (
  req: unknown,
  res: unknown
) => void
