// CrisisNexus Emergency Management System
// Feature management disabled for emergency operations
import express from "express";

const router = express.Router();

// Feature routes disabled for emergency management system
router.get("/", async (req, res) => {
  res.json({ message: "Emergency features managed through disaster modules" });
});

export default router;