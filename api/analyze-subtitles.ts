import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAnalyzeSubtitles } from '../server/geminiHandlers';

// Gemini can take a while on a full-script pass, especially with model
// fallback retries; give it more room than the default function timeout.
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const result = await handleAnalyzeSubtitles(req.body || {});
  res.status(result.status).json(result.body);
}
