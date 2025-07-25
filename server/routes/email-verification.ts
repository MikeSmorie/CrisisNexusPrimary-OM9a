// CrisisNexus Emergency Management System  
// Email verification disabled for emergency operations
import express from "express";

const router = express.Router();

// Email verification routes disabled for emergency management system
router.post("/send", async (req, res) => {
  res.json({ message: "Emergency credential verification handled through secure channels" });
});

router.post("/verify", async (req, res) => {
  res.json({ message: "Emergency personnel verification managed by administrators" });
});

export default router;
export { router as emailVerificationRouter };