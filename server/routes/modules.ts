// CrisisNexus Emergency Management System
// Emergency module management
import { Router } from "express";

const router = Router();

// Emergency module endpoints
router.get("/", (req, res) => {
  res.json({ 
    modules: [
      { id: 1, name: "Incident Management", active: true },
      { id: 2, name: "Emergency Alerts", active: true },
      { id: 3, name: "Resource Deployment", active: true },
      { id: 4, name: "Communication Center", active: true },
      { id: 5, name: "Forensic Dashboard", active: true },
      { id: 6, name: "Clearance Management", active: true },
      { id: 9, name: "Emergency Operations", active: true }
    ]
  });
});

export default router;
export { router as modulesRouter };