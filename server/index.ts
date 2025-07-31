import express, { type Request, Response, NextFunction } from "express";
import "express-async-errors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ModuleManager } from "./moduleManager";

interface IModule {
  name: string;
  inputSchema: any;
  outputSchema: any;
  process: (input: any) => Promise<any>;
}

const app = express();

// Initialize module manager
const moduleManager = new ModuleManager();

// Register test module
const testModule: IModule = {
  name: "testModule",
  inputSchema: { data: "string" },
  outputSchema: { result: "string" },
  async process(input: any) {
    console.log(`[DEBUG] Processing input: ${input.data}`);
    return { result: `Processed: ${input.data}` };
  }
};

moduleManager.registerModule(testModule);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log API requests on completion
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

// Health check endpoints for Cloud Run deployment  
app.get("/health", (req, res) => {
  try {
    res.status(200).json({ 
      status: "healthy",
      service: "CrisisNexus Emergency Management System",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      ready: true
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ status: "error", message: "Health check failed" });
  }
});

// Alternative health check endpoint
app.get("/healthz", (req, res) => {
  try {
    res.status(200).json({ 
      status: "healthy",
      service: "CrisisNexus",
      ready: true
    });
  } catch (error) {
    console.error("Healthz error:", error);
    res.status(500).json({ status: "error" });
  }
});

// Root health check endpoint
app.get("/", (req, res) => {
  try {
    res.status(200).json({ 
      status: "CrisisNexus Emergency Management System",
      version: "1.0.0",
      ready: true,
      health: "/health"
    });
  } catch (error) {
    console.error("Root endpoint error:", error);
    res.status(500).json({ status: "error" });
  }
});

// Test endpoint for module manager
app.get("/api/module/test", async (req, res) => {
  try {
    const result = await moduleManager.runModule("testModule", { data: "hello" });
    console.log("[DEBUG] Module test result:", result);
    res.json({ message: "Module test successful", result });
  } catch (error) {
    console.error("[ERROR] Module test failed:", error);
    res.status(500).json({ error: "Module test failed" });
  }
});

(async () => {
  try {
    // Verify environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
      process.exit(1);
    }

    // Verify database connection (non-blocking for faster startup)
    const dbVerification = async () => {
      try {
        const { db } = await import("../db");
        const { disasterUsers } = await import("../db/schema");
        await db.select().from(disasterUsers).limit(1);
        console.log("Database connection verified");
      } catch (error) {
        console.log("Database connection will be established on first request");
      }
    };
    
    // Start database verification in background
    dbVerification();

    // Register all API routes and create HTTP server
    console.log("Registering routes...");
    const server = registerRoutes(app);
    console.log("Routes registered successfully");

    // Global error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log error but don't crash server
      console.error("Server error:", err);
      res.status(status).json({ message });
    });

    // Setup development/production server
    if (app.get("env") === "development") {
      await setupVite(app, server); // Development: Vite dev server
    } else {
      serveStatic(app); // Production: Static file serving
    }

    // Cloud Run compatible server configuration
    const PORT = parseInt(process.env.PORT || '5000', 10);
    const HOST = '0.0.0.0'; // Bind to all interfaces for Cloud Run
    
    server.listen(PORT, HOST, () => {
      log(`CrisisNexus Emergency Management System serving on port ${PORT}`);
      log(`Health check available at http://${HOST}:${PORT}/health`);
      log(`Root health check at http://${HOST}:${PORT}/`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();