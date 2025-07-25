// CrisisNexus Emergency Management System
// JWT Auth disabled for emergency operations - using session-based auth
import { Request, Response, NextFunction } from "express";

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  // Emergency management system uses session-based authentication
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Emergency credentials required" });
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  return verifyJWT(req, res, next);
}

export function requireSupergod(req: Request, res: Response, next: NextFunction) {
  res.status(403).json({ message: "Emergency admin access required" });
}

export function generateJWT(userId: number): string {
  return "emergency-session-token";
}