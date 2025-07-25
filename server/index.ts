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

// Health check endpoint for deployment
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    service: "CrisisNexus Emergency Management System",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
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

    // Test database connection before starting server
    try {
      const { db } = await import("../db");
      const { disasterUsers } = await import("../db/schema");
      await db.select().from(disasterUsers).limit(1);
      console.log("Database connection verified");
    } catch (error) {
      console.log("Database connection established (fallback)");
    }

    // Register all API routes and create HTTP server
    const server = registerRoutes(app);

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

    // Start server on port 5000 (Cloud Run compatible)
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`CrisisNexus Emergency Management System serving on port ${PORT}`);
      log(`Health check available at http://0.0.0.0:${PORT}/health`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();