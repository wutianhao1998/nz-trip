// ================================
// Vercel Serverless 函数入口
// 将 Express 应用以标准 handler 签名暴露给 Vercel
// 路径：api/index.ts  ->  匹配 /api/*
// ================================
import type { IncomingMessage, ServerResponse } from 'http'
import app from '../server/index'

/**
 * 标准 Vercel Serverless Function 签名：
 *   (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
 * Express app 本身就是兼容的处理函数，以调用模式转发即可。
 */
export default function handler(
  req: IncomingMessage,
  res: ServerResponse
): void | Promise<void> {
  return app(req, res)
}
