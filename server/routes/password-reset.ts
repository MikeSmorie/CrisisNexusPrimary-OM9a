// CrisisNexus Emergency Management System
// Password reset functionality disabled for emergency operations
import express from "express";

const router = express.Router();

// Password reset routes disabled for emergency management system
router.post("/request", async (req, res) => {
  res.json({ message: "Emergency credential management handled through secure channels" });
});

router.post("/reset", async (req, res) => {
  res.json({ message: "Emergency credential reset requires administrator approval" });
});

export default router;
export { router as passwordResetRouter };