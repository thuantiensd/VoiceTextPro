import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { passport } from "./oauth.js";

const app = express();

// CORS configuration for cross-origin requests with credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Express session for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'voicetextpro-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration time on each request
  name: 'vtp.session.id', // Custom session name
  cookie: {
    secure: false, // Always false for localhost development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Always lax for development with multiple origins
    path: '/' // Ensure cookie is available for all paths
  }
}));

// Passport OAuth setup
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ Đã sửa lại: dùng listen(port) thay vì listen({ host: "0.0.0.0" })
  const port = 3001;
  server.listen(port, () => {
    log(`✅ Server is listening on http://localhost:${port}`);
  });
})();
