// CrisisNexus Emergency Management System
// Trial management disabled for emergency operations
import { Request, Response } from "express";

export async function checkTrialStatus(req: Request, res: Response) {
  res.json({ message: "Emergency access managed through clearance system" });
}

export async function resetUserTrial(req: Request, res: Response) {
  res.json({ message: "Emergency access controlled by administrators" });
}