import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleHealth } from '../server/geminiHandlers.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const result = handleHealth();
  res.status(result.status).json(result.body);
}
