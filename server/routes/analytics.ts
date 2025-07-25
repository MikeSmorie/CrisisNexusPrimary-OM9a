// CrisisNexus Emergency Management System
// Analytics for emergency operations
import type { Express } from "express";

export function setupAnalyticsRoutes(app: Express) {
  app.get("/api/analytics/emergency", (req, res) => {
    res.json({ 
      message: "Emergency analytics available through disaster dashboard",
      incidents: 0,
      resources: 0,
      active_alerts: 0
    });
  });
}

export { setupAnalyticsRoutes as registerAnalyticsRoutes };