// CrisisNexus Emergency Management System
// Payment processing disabled for emergency operations
import express from "express";

const router = express.Router();

// Payment routes disabled for emergency management system
router.post("/process", async (req, res) => {
  res.json({ message: "Emergency funding managed through government channels" });
});

export default router;