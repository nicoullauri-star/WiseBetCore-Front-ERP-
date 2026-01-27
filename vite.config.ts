import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import { exec } from 'child_process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      {
        name: 'local-file-db',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const dbPath = path.resolve(__dirname, 'database.json');
            const logPath = path.resolve(__dirname, 'automation_logs.txt');

            // Set CORS for all local API requests
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
              return;
            }

            if (req.url === '/api/data' && req.method === 'GET') {
              if (fs.existsSync(dbPath)) {
                res.setHeader('Content-Type', 'application/json');
                res.end(fs.readFileSync(dbPath));
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ picks: [], config: {} }));
              }
            } else if (req.url === '/api/data' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                fs.writeFileSync(dbPath, body);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              });
            } else if (req.url?.includes('/api/logs')) {
              // FORZAR NO CACHE EN EL SERVIDOR
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');

              if (fs.existsSync(logPath)) {
                try {
                  const content = fs.readFileSync(logPath, 'utf8');
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                  res.end(content);
                } catch (e) {
                  res.end("Leyendo logs...");
                }
              } else {
                res.end('No hay logs disponibles.');
              }
            } else if (req.url?.startsWith('/api/scrape') && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  const dataRaw = JSON.parse(body);
                  const p = dataRaw.plan || 'ALL';
                  const d = dataRaw.duration || 'ALL';

                  const scraperPath = path.resolve(__dirname, 'scripts', 'scraper.cjs');
                  const cmd = `node "${scraperPath}" --plan=${p} --duration=${d}`;

                  // Resetear log con marca de tiempo única
                  const startMsg = `--- CONTROLADO INICIADO: ${new Date().toISOString()} ---\nSincronizando ${p} modo ${d}...\n`;
                  fs.writeFileSync(logPath, startMsg);

                  exec(cmd, (err, stdout, stderr) => {
                    if (err) console.error(`[SYNC ERR]: ${err.message}`);
                  });

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.end(JSON.stringify({ success: false, error: e.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
