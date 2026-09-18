import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { handleHealth, handleAnalyzeSubtitles, handleOcrFrame, handleChat } from './server/geminiHandlers.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '25mb' }));

// Route handlers live in server/geminiHandlers.ts, shared with the Vercel
// serverless functions under api/ so local dev and production never drift.

app.get('/api/health', (req, res) => {
  const result = handleHealth();
  res.status(result.status).json(result.body);
});

app.post('/api/analyze-subtitles', async (req, res) => {
  const result = await handleAnalyzeSubtitles(req.body);
  res.status(result.status).json(result.body);
});

app.post('/api/ocr-frame', async (req, res) => {
  const result = await handleOcrFrame(req.body);
  res.status(result.status).json(result.body);
});

app.post('/api/chat', async (req, res) => {
  const result = await handleChat(req.body);
  res.status(result.status).json(result.body);
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Taiwanese Drama Mandarin Subtitle Tutor running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
