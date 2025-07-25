// CrisisNexus Emergency Management System
// Subscription functionality disabled for emergency operations
import express from "express";

const router = express.Router();

// All subscription routes disabled for emergency management system
router.get("/plans", async (_req, res) => {
  res.json({ message: "Subscription plans not applicable for emergency management system" });
});

router.post("/subscribe", async (req, res) => {
  res.json({ message: "Emergency personnel access managed through clearance system" });
});

router.get("/my-subscription", async (req, res) => {
  res.json({ message: "Emergency access controls managed separately" });
});

export default router;