// CrisisNexus Emergency Management System
// Emergency admin routes
import { Express } from "express";

export function setupSupergodRoutes(app: Express) {
  app.get("/api/admin/emergency", (req, res) => {
    res.json({ message: "Emergency admin system active" });
  });
}

export { setupSupergodRoutes as registerSupergodRoutes };