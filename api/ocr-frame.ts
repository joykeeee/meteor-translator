import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOcrFrame } from '../server/geminiHandlers.js';

// Vision calls plus model-fallback retries can run long.
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const result = await handleOcrFrame(req.body || {});
  res.status(result.status).json(result.body);
}
