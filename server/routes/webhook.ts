// CrisisNexus Emergency Management System
// Webhook functionality disabled for emergency operations
import express from "express";

const router = express.Router();

// Webhook routes disabled for emergency management system
router.post("/paypal", async (req, res) => {
  res.json({ message: "Payment processing not applicable for emergency management system" });
});

export default router;