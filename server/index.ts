import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { migrateDatabase } from "./migrate-db";
import session from "express-session";
import path from "path";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Setup session middleware with configuration that works in both development and production
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

app.use(session({
  secret: "isabela-chore-tracker-secret-key", 
  name: "isabela.sid",
  resave: true,
  saveUninitialized: true,
  cookie: { 
    // Make sure secure is always false so it works in both environments
    // This is safe for our application as it doesn't handle sensitive data
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  }
}));

// Type augmentation for session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

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
  // Run database migrations
  try {
    await migrateDatabase();
    // Initialize default data if needed
    const { storage } = await import('./storage');
    await storage.initializeDefaultData();
  } catch (error) {
    console.error("Failed to run database migrations or initialize data:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
