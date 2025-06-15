import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerRoutes } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startProductionServer() {
  const app = express();
  const port = process.env.PORT || 5000;

  // Serve static files from build output
  app.use(express.static(join(__dirname, '../client')));

  // API routes
  const server = await registerRoutes(app);

  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/index.html'));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 VoiceText Pro running on port ${port}`);
  });
}

startProductionServer().catch(console.error);