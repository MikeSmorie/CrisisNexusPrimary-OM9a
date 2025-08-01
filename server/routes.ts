import type { Express } from "express";
import { createServer } from "http";
import { setupAuth } from "./auth";
import cors from "cors";
import express from "express";
import subscriptionRoutes from "./routes/subscription";
import webhookRoutes from "./routes/webhook";
import aiRoutes from "./routes/ai";
import { aiProvidersRouter } from "./routes/ai-providers";
import { aiRoutingRouter } from "./routes/ai-routing";
import { aiDemoRouter } from "./routes/ai-demo";
import { aiRouterTestRouter } from "./routes/ai-router-test";
import { modulesTestRouter } from "./routes/modules-test";
import { supportAgentRouter } from "./routes/support-agent";
import { passwordResetRouter } from "./routes/password-reset";
import { emailVerificationRouter } from "./routes/email-verification";
import { sessionManagementRouter } from "./routes/session-management";
import featureRoutes from "./routes/features";
import messagesRoutes from "./routes/announcements";
import adminLogsRoutes from "./routes/admin-logs";
import paymentRoutes from "./routes/payment";
import logsRoutes from "./routes/logs";
import { registerSupergodRoutes } from "./routes/supergod";
import auditRoutes from "./routes/admin/audit";
import { modulesRouter } from "./routes/modules";
import { checkTrialStatus, resetUserTrial } from "./routes/trial";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { logError } from "./utils/logger";
import { requireRole, requireSupergod } from "./middleware/rbac";
import { getTokenBalance, consumeTokens, giftTokens, modifyTokens, getAllTokenBalances } from "./routes/tokens";
import referralRouter from "../modules/3.ReferralEngine/api";
import { registerAnalyticsRoutes } from "./routes/analytics";
import disasterApiRouter from "./routes/disaster-api";
import disasterAIRoutes from "./routes/disaster-ai";
import disasterModules from "./routes/disaster-modules";
import aiIncidentRouter from "./routes/ai-incident";
import analyzeThreatRouter from "./routes/analyze-threat";
import translationRouter from "./routes/translation";
import { db } from "../db";
import { disasterUsers } from "../db/schema";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";
import { logEvent } from "../lib/logs";

// Simple auth checks using passport
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && (req.user.role === "admin" || req.user.role === "supergod")) return next();
  res.status(403).json({ message: "Not authorized" });
};

// Global error handler
const errorHandler = async (err: any, req: any, res: any, next: any) => {
  await logError(
    "ERROR",
    err.message,
    `${req.method} ${req.path}`,
    err.stack
  );

  res.status(500).json({
    message: "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? undefined : err.message
  });
};

export function registerRoutes(app: Express) {
  try {
    console.log("Setting up CORS...");
    
    // Basic CORS setup - Allow Replit domains in production  
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://disaster-mng-1-om-9-michaelsthewrit.replit.app', 'https://replit.com']
        : '*',
      credentials: true
    }));
    
    console.log("CORS setup complete");

  // Form data parser
  app.use(express.urlencoded({ 
    extended: true,
    limit: '50mb'
  }));

  // Health check middleware - only for automated deployment health checks via specific endpoints
  // Root path "/" is handled by frontend app in production

  // Setup auth
  setupAuth(app);

  /**
   * AUTHENTICATION ROUTES
   * Auth: None required for registration/login
   * POST /api/register - User registration
   * POST /api/login - User login
   * POST /api/logout - User logout
   * POST /api/register-admin - Admin registration (requires secret key)
   * POST /api/register-supergod - Supergod registration (requires secret key)
   */

  /**
   * SUBSCRIPTION ROUTES
   * Auth: Required
   * Role: User/Admin/Supergod (Admin/Supergod bypass restrictions)
   */
  app.use("/api/subscription", subscriptionRoutes);

  /**
   * WEBHOOK ROUTES
   * Auth: None (external payment providers)
   * Security: Webhook signature verification
   */
  app.use("/api/webhook", webhookRoutes);

  /**
   * DISASTER MANAGEMENT ROUTES
   * Auth: Required for disaster management system
   * Role: Emergency responders, commanders, admin
   * DisasterMng-1-OM9 specific endpoints
   */
  app.use("/api/disaster", requireAuth, disasterApiRouter);
  
  // Emergency AI Processing Hub
  app.use("/api/disaster/ai", requireAuth, disasterAIRoutes);

  // Emergency Response Modules
  app.use("/api/disaster/modules", requireAuth, disasterModules);
  
  // AI Incident Assessment
  app.use("/api/ai/incident", requireAuth, aiIncidentRouter);
  
  // Import forensic routes dynamically
  import("./routes/simple-forensic").then((module) => {
    app.use("/api/forensic", requireAuth, module.default);
  }).catch((error) => {
    console.error("Failed to load forensic routes:", error);
  });

  // Import clearance routes dynamically
  import("./routes/clearance").then((module) => {
    app.use("/api/clearance", requireAuth, module.default);
  }).catch((error) => {
    console.error("Failed to load clearance routes:", error);
  });

  // Import demo admin routes dynamically
  import("./routes/demo-admin").then((module) => {
    app.use("/api/demo-admin", requireAuth, module.default);
  }).catch((error) => {
    console.error("Failed to load demo admin routes:", error);
  });

  // Import communication routes dynamically
  import("./routes/communication").then((module) => {
    app.use("/api/communication", requireAuth, module.default);
  }).catch((error) => {
    console.error("Failed to load communication routes:", error);
  });

  /**
   * AI ASSISTANT ROUTES
   * Auth: Required
   * Role: User/Admin/Supergod
   * POST /api/ai/query - Send query to AI assistant
   * POST /api/ai/feedback - Submit feedback on AI response
   */
  app.use("/api/ai", aiRoutes);

  /**
   * AI PROVIDERS ROUTES (OmegaAIR)
   * Auth: Required for admin functions
   * Role: Admin/Supergod for provider management
   * GET /api/ai/providers/status - Get provider statuses
   * POST /api/ai/providers/test/:provider - Test specific provider
   * POST /api/ai/providers/generate - Generate with fallback
   */
  app.use("/api/ai/providers", aiProvidersRouter);

  /**
   * AI ROUTING CONFIGURATION
   * Auth: Required
   * Role: Supergod only
   * GET /api/admin/ai-routing/config - Get routing configuration
   * POST /api/admin/ai-routing/config - Save routing configuration
   * GET /api/admin/ai-routing/preferences - Get routing preferences
   */
  app.use("/api/admin/ai-routing", requireSupergod, aiRoutingRouter);

  /**
   * AI DEMO UTILITIES
   * Auth: Required
   * Role: User/Admin/Supergod
   * POST /api/ai-demo/generate - Generate using best available model
   * GET /api/ai-demo/status - Get current AI system status
   * GET /api/ai-demo/health - Health check for AI router
   */
  app.use("/api/ai-demo", requireAuth, aiDemoRouter);

  /**
   * AI ROUTER TEST UTILITIES
   * Auth: None (public testing endpoints)
   * Role: Public access for testing
   * POST /api/ai-router-test/demo - Test OmegaAIR utilities
   * GET /api/ai-router-test/test-utilities - Test all utility functions
   */
  app.use("/api/ai-router-test", aiRouterTestRouter);

  /**
   * TRANSLATION ROUTES
   * Auth: None (public access for emergency translation)
   * Role: Public access for emergency response
   * POST /api/translate-to-english - Translate any language to English
   * POST /api/translate-from-english - Translate English to target language
   */
  app.use("/api", translationRouter);

  /**
   * MODULE REFACTORING TESTS
   * Auth: None (public testing endpoints)
   * Role: Public access for testing refactored modules
   * POST /api/modules-test/content - Test content generation
   * POST /api/modules-test/analyze - Test data analysis
   * POST /api/modules-test/review - Test code review
   * GET /api/modules-test/test-all - Test all refactored modules
   */
  app.use("/api/modules-test", modulesTestRouter);

  /**
   * GPT SUPPORT AGENT
   * Auth: Required (logged-in users only)
   * Role: All authenticated users
   * POST /api/support-agent/chat - Chat with AI support assistant
   * GET /api/support-agent/status - Get support agent availability status
   */
  app.use("/api/support-agent", requireAuth, supportAgentRouter);

  /**
   * PASSWORD RESET ROUTES
   * Auth: None (public access for password reset)
   * Role: Public access
   * POST /api/auth/forgot-password - Request password reset
   * POST /api/auth/reset-password - Reset password with token
   * GET /api/auth/validate-token/:token - Validate reset token
   */
  app.use("/api/auth", passwordResetRouter);

  /**
   * EMAIL VERIFICATION ROUTES
   * Auth: None (public access for email verification)
   * Role: Public access
   * POST /api/auth/send-verification - Send verification email
   * GET /api/auth/verify-email - Verify email with token
   * GET /api/auth/status/:email - Check verification status
   * GET /api/auth/validate-verification-token/:token - Validate verification token
   * GET /api/auth/bypass-status - Check bypass availability and environment info
   */
  app.use("/api/auth", emailVerificationRouter);

  // Email verification bypass status endpoint
  app.get("/api/auth/bypass-status", (req, res) => {
    // Multiple bypass conditions for development/testing environments
    const nodeEnv = process.env.NODE_ENV;
    const replitHost = process.env.REPLIT_DOMAINS || process.env.REPL_DOMAIN;
    const isDevelopment = !nodeEnv || nodeEnv !== 'production' || !!replitHost;
    
    // Force bypass enabled in sandbox environments
    const bypassEnabled = isDevelopment || 
                          process.env.FORCE_EMAIL_BYPASS === 'true' ||
                          process.env.ALLOW_EMAIL_VERIFICATION_BYPASS === 'true';
    const environment = nodeEnv || 'development';
    const dbName = process.env.PGDATABASE || 'omega9';
    
    console.log('[DEBUG] Bypass check:', { 
      isDevelopment, 
      bypassEnabled, 
      environment,
      nodeEnv,
      replitHost: !!replitHost,
      forceBypass: process.env.FORCE_EMAIL_BYPASS 
    });
    
    res.json({
      bypassEnabled,
      envInfo: {
        env: environment,
        dbName: dbName.includes('omega') || dbName.includes('neon') ? 'Omega9' : dbName
      }
    });
  });

  /**
   * SESSION MANAGEMENT ROUTES
   * Auth: Required (JWT with supergod role)
   * Role: Supergod only
   * POST /api/admin/users/:id/invalidate-sessions - Invalidate all sessions for user
   * GET /api/admin/users/:id/token-version - Get user's token version
   * POST /api/admin/bulk-invalidate-sessions - Bulk invalidate sessions
   */
  app.use("/api/admin", sessionManagementRouter);

  /**
   * FEATURE ACCESS ROUTES
   * Auth: Required for all
   * Role: Check routes (User/Admin/Supergod), Admin routes (Admin/Supergod only)
   */
  app.use("/api/features/check", requireAuth, featureRoutes); // Public feature check route
  app.use("/api/features/admin", requireAdmin, featureRoutes); // Admin-only routes

  /**
   * MESSAGING/ANNOUNCEMENTS ROUTES
   * Auth: Required
   * Role: Mixed (some admin-only, some user-accessible)
   */
  app.use("/api/messages", messagesRoutes);

  /**
   * ADMIN USER MANAGEMENT ROUTES
   * Auth: Required
   * Role: Admin/Supergod only
   */
  // Get all users with search and filtering
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { 
        q, 
        status, 
        role, 
        minTokens, 
        maxTokens, 
        page = '1', 
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeSubscriptions
      } = req.query;

      // Build where conditions
      const conditions = [];
      
      // Search by username or email
      if (q && typeof q === 'string') {
        const searchTerm = `%${q.toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${users.username}) LIKE ${searchTerm}`,
            sql`LOWER(${users.email}) LIKE ${searchTerm}`
          )
        );
      }

      // Filter by status
      if (status && typeof status === 'string' && status !== 'all') {
        if (status === 'active') {
          conditions.push(or(
            eq(users.status, 'active'),
            sql`${users.status} IS NULL`
          ));
        } else {
          conditions.push(eq(users.status, status));
        }
      }

      // Filter by role
      if (role && typeof role === 'string' && role !== 'all') {
        conditions.push(eq(users.role, role));
      }

      // Filter by token range
      if (minTokens && typeof minTokens === 'string') {
        const min = parseInt(minTokens);
        if (!isNaN(min)) {
          conditions.push(sql`${users.tokens} >= ${min}`);
        }
      }

      if (maxTokens && typeof maxTokens === 'string') {
        const max = parseInt(maxTokens);
        if (!isNaN(max)) {
          conditions.push(sql`${users.tokens} <= ${max}`);
        }
      }

      // Combine conditions
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Determine sort column and order
      const sortColumn = sortBy === 'username' ? users.username :
                        sortBy === 'email' ? users.email :
                        sortBy === 'role' ? users.role :
                        sortBy === 'tokens' ? users.tokens :
                        sortBy === 'lastLogin' ? users.lastLogin :
                        users.createdAt;

      const sortDirection = sortOrder === 'asc' ? asc : desc;

      // Calculate pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;

      // Get total count for pagination
      const [totalResult] = await db
        .select({ count: sql`COUNT(*)` })
        .from(users)
        .where(whereClause);

      const total = Number(totalResult.count);

      // Get filtered and paginated users
      const filteredUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          status: sql`COALESCE(${users.status}, 'active')`.as('status'),
          tokens: users.tokens,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt,
          trialActive: users.trialActive,
          trialExpiresAt: users.trialExpiresAt
        })
        .from(users)
        .where(whereClause)
        .orderBy(sortDirection(sortColumn))
        .limit(limitNum)
        .offset(offset);

      res.json({
        users: filteredUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Suspend user
  app.post("/api/admin/users/:id/suspend", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Use raw SQL for status update since column may not be in schema
      await db.execute(sql`UPDATE users SET status = 'suspended' WHERE id = ${userId}`);

      res.json({ message: 'User suspended successfully' });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ message: 'Failed to suspend user' });
    }
  });

  // Ban user
  app.post("/api/admin/users/:id/ban", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Use raw SQL for status update since column may not be in schema
      await db.execute(sql`UPDATE users SET status = 'banned' WHERE id = ${userId}`);

      res.json({ message: 'User banned successfully' });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: 'Failed to ban user' });
    }
  });

  // Add credits to user
  app.post("/api/admin/users/:id/credits", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;

      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: 'Invalid credit amount' });
      }

      await db
        .update(users)
        .set({ tokens: sql`${users.tokens} + ${amount}` })
        .where(eq(users.id, userId));

      res.json({ message: 'Credits added successfully' });
    } catch (error) {
      console.error('Error adding credits:', error);
      res.status(500).json({ message: 'Failed to add credits' });
    }
  });

  // Change user role
  app.post("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!['user', 'admin', 'supergod'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId));

      await logEvent('user_action', `Role changed to ${role} for user ID ${userId}`, {
        userId: req.user?.id,
        userRole: req.user?.role,
        endpoint: `/api/admin/users/${userId}/role`,
        metadata: { targetUserId: userId, newRole: role }
      });

      res.json({ message: 'Role updated successfully' });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  // Update user notes and test account flag
  app.post("/api/admin/users/:id/label", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { notes, isTestAccount } = req.body;

      await db.execute(sql`
        UPDATE users 
        SET notes = ${notes}, is_test_account = ${isTestAccount}
        WHERE id = ${userId}
      `);

      res.json({ message: 'User data updated successfully' });
    } catch (error) {
      console.error('Error updating user data:', error);
      res.status(500).json({ message: 'Failed to update user data' });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      await db.delete(users).where(eq(users.id, userId));

      await logEvent('user_action', `User ID ${userId} deleted`, {
        userId: req.user?.id,
        userRole: req.user?.role,
        endpoint: `/api/admin/users/${userId}`,
        metadata: { deletedUserId: userId }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Get user statistics (for individual users)
  app.get("/api/admin/users/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Get referral counts for all users
      const referralStats = await db.execute(sql`
        SELECT r.referrer_id as userId, COUNT(*) as referralCount
        FROM referrals r
        GROUP BY r.referrer_id
      `);

      // Get total requests from activity logs
      const requestStats = await db.execute(sql`
        SELECT al.user_id as userId, COUNT(*) as totalRequests
        FROM activity_logs al
        WHERE al.user_id IS NOT NULL
        GROUP BY al.user_id
      `);

      // Combine stats
      const statsMap: Record<number, any> = {};
      
      (referralStats.rows as any[]).forEach(stat => {
        if (!statsMap[stat.userId]) statsMap[stat.userId] = {};
        statsMap[stat.userId].referralCount = Number(stat.referralCount);
      });

      (requestStats.rows as any[]).forEach(stat => {
        if (!statsMap[stat.userId]) statsMap[stat.userId] = {};
        statsMap[stat.userId].totalRequests = Number(stat.totalRequests);
      });

      res.json(statsMap);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch user stats' });
    }
  });

  // Get aggregate statistics for SuperGod dashboard
  app.get("/api/admin/users/aggregate-stats", requireAuth, requireSupergod, async (req, res) => {
    try {
      // Get total users
      const [totalUsersResult] = await db
        .select({ count: sql`COUNT(*)` })
        .from(users);

      // Get active users (status is null or 'active')
      const [activeUsersResult] = await db
        .select({ count: sql`COUNT(*)` })
        .from(users)
        .where(or(
          eq(users.status, 'active'),
          sql`${users.status} IS NULL`
        ));

      // Get banned users
      const [bannedUsersResult] = await db
        .select({ count: sql`COUNT(*)` })
        .from(users)
        .where(eq(users.status, 'banned'));

      // Get total tokens issued (sum of all user tokens)
      const [totalTokensResult] = await db
        .select({ total: sql`SUM(${users.tokens})` })
        .from(users);

      // Get total tokens used from transactions
      const tokensUsedResult = await db.execute(sql`
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_used
        FROM transactions 
        WHERE transaction_type = 'payment' AND status = 'completed'
      `);

      const aggregateStats = {
        totalUsers: Number(totalUsersResult.count),
        activeUsers: Number(activeUsersResult.count),
        bannedUsers: Number(bannedUsersResult.count),
        totalTokensIssued: Number(totalTokensResult.total) || 0,
        totalTokensUsed: Number((tokensUsedResult.rows?.[0] as any)?.total_used) || 0
      };

      res.json(aggregateStats);
    } catch (error) {
      console.error('Error fetching aggregate stats:', error);
      res.status(500).json({ message: 'Failed to fetch aggregate stats' });
    }
  });

  /**
   * ADMIN ROUTES
   * Auth: Required
   * Role: Admin/Supergod only
   */
  app.use("/api/admin", requireAdmin, adminLogsRoutes);
  app.use("/api/admin/logs", logsRoutes);
  app.use("/api/admin/audit-logs", auditRoutes);

  /**
   * PAYMENT ROUTES
   * Auth: Required
   * Role: User/Admin/Supergod (Admin/Supergod bypass payment restrictions)
   */
  app.use("/api/payment", paymentRoutes);

  /**
   * REFERRAL ROUTES
   * Auth: Required
   * Role: User/Admin/Supergod
   */
  app.use("/api/referrals", referralRouter);

  // User profile export route
  app.get("/api/user/export", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userRecord = {
        id: user.id,
        username: user.username,
        email: user.email || '',
        role: user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscriptionPlan: 'free',
        twoFactorEnabled: false
      };

      const { generateUserPdf } = await import("./utils/pdf");
      const pdfBuffer = await generateUserPdf(userRecord);
      
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=omega-user-profile.txt");
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating user profile export:", error);
      res.status(500).json({ message: "Failed to generate user profile export" });
    }
  });

  // Subscription management routes
  app.post("/api/subscription/change", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Mock subscription change - log a fake payment record
      const mockPayment = {
        userId,
        method: "paypal", // Default to PayPal for upgrades
        status: "pending",
        reference: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      // In a real implementation, you would:
      // 1. Update user's subscription plan in database
      // 2. Create actual payment record
      // 3. Handle payment processing

      console.log(`[MOCK] Subscription change request: User ${userId} -> Plan ${planId}`);
      console.log(`[MOCK] Payment record:`, mockPayment);

      res.json({
        success: true,
        message: "Subscription change request submitted",
        paymentReference: mockPayment.reference
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user's payment history
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Mock payment history - in real implementation, query database
      const mockPayments = [
        {
          id: 1,
          method: "paypal",
          status: "completed",
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          reference: `PAY-${Date.now() - 30 * 24 * 60 * 60 * 1000}-ABCD1234`
        },
        {
          id: 2,
          method: "stablecoin",
          status: "pending",
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          reference: `USDC-${Date.now() - 7 * 24 * 60 * 60 * 1000}-XYZ9876`
        }
      ];

      res.json(mockPayments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Save wallet address
  app.post("/api/user/wallet", requireAuth, async (req, res) => {
    try {
      const { walletAddress } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: "Valid wallet address required" });
      }

      // Mock wallet address save - in real implementation, update database
      console.log(`[MOCK] Saving wallet address for user ${userId}: ${walletAddress}`);

      res.json({
        success: true,
        message: "Wallet address saved successfully"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PayPal routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Trial management routes
  app.post("/api/trial/check-status", requireAuth, checkTrialStatus);
  app.post("/api/admin/reset-trial/:userId", requireAdmin, resetUserTrial);

  // Admin route to get all user subscriptions
  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        with: {
          subscriptions: {
            with: {
              plan: true
            }
          }
        }
      });

      const subscriptionsData = allUsers.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        walletAddress: user.walletAddress,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        lastPaymentStatus: user.subscriptions?.[0] ? "active" : null,
        lastPaymentDate: user.subscriptions?.[0]?.startDate || null
      }));

      res.json(subscriptionsData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * TOKEN MANAGEMENT ROUTES
   * Auth: Required for all
   * Role: Basic routes (User/Admin/Supergod), Admin routes (Admin/Supergod only)
   * GET /api/tokens/balance - Get user token balance
   * POST /api/tokens/consume - Consume tokens for feature usage
   * POST /api/admin/tokens/gift - Gift tokens to users (Admin/Supergod only)
   * POST /api/admin/tokens/modify - Modify user token balance (Admin/Supergod only)
   * GET /api/admin/tokens/all - Get all user token balances (Admin/Supergod only)
   */
  app.get("/api/tokens/balance", requireAuth, getTokenBalance);
  app.post("/api/tokens/consume", requireAuth, consumeTokens);
  app.post("/api/admin/tokens/gift", requireAdmin, giftTokens);
  app.post("/api/admin/tokens/modify", requireAdmin, modifyTokens);
  app.get("/api/admin/tokens/all", requireAdmin, getAllTokenBalances);

  // Get emergency personnel for admin management
  app.get("/api/users/with-subscriptions", requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.query.disasterUsers.findMany();

      const usersData = allUsers.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        status: user.status
      }));

      res.json(usersData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 2FA management routes
  app.get("/api/2fa/status", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // DisasterMng-1-OM9: Skip 2FA for disaster management system
      // Return default disabled state since 2FA fields don't exist in disaster schema
      const response = {
        enabled: false,
        secret: undefined
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/2fa/enable", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Generate TOTP secret for this user
      const totpSecret = "JBSWY3DPEHPK3PXP" + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Update database to enable 2FA and store secret
      await db.update(users)
        .set({ 
          twoFactorEnabled: true,
          twoFactorSecret: totpSecret 
        })
        .where(eq(users.id, userId));

      console.log(`[2FA] Enabled for user ${userId}`);

      res.json({
        success: true,
        message: "2FA enabled successfully",
        secret: totpSecret
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/2fa/disable", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Update database to disable 2FA and clear secret
      await db.update(users)
        .set({ 
          twoFactorEnabled: false,
          twoFactorSecret: null 
        })
        .where(eq(users.id, userId));

      console.log(`[2FA] Disabled for user ${userId}`);

      res.json({
        success: true,
        message: "2FA disabled successfully"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Client error logging endpoint
  app.post("/api/logs/client-error", async (req, res) => {
    try {
      const { message, stack, componentStack, timestamp, userAgent, url } = req.body;
      const user = (req as any).user;

      await logEvent("error_boundary", `Client error: ${message}`, {
        userId: user?.id,
        userRole: user?.role || "anonymous",
        endpoint: url,
        severity: "error",
        stackTrace: stack,
        metadata: {
          componentStack,
          timestamp,
          userAgent,
          url
        }
      });

      res.json({ success: true, message: "Error logged successfully" });
    } catch (error: any) {
      console.error("Failed to log client error:", error);
      res.status(500).json({ message: "Failed to log error" });
    }
  });

  /**
   * PAYPAL INTEGRATION ROUTES
   * Auth: Required for order creation/capture
   * Role: User/Admin/Supergod (Admin/Supergod bypass payment restrictions)
   * GET /paypal/setup - Get PayPal client token
   * POST /paypal/order - Create PayPal order
   * POST /paypal/order/:orderID/capture - Capture PayPal payment
   */
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  /**
   * TRIAL MANAGEMENT ROUTES
   * Auth: Required
   * Role: User (Admin/Supergod bypass trial logic entirely)
   * POST /api/trial/check - Check trial status
   * POST /api/trial/reset - Reset trial (Admin/Supergod only)
   */
  app.post("/api/trial/check", requireAuth, checkTrialStatus);
  app.post("/api/trial/reset", requireAdmin, resetUserTrial);

  /**
   * MODULE SYSTEM ROUTES
   * Auth: Required
   * Role: User/Admin/Supergod with tier-based access control
   * GET /api/modules - List available modules
   * POST /api/modules/run - Execute module
   */
  app.use("/api/modules", modulesRouter);

  /**
   * SUPERGOD ROUTES
   * Auth: Required
   * Role: Supergod only
   * System configuration, admin management, platform control
   */
  registerSupergodRoutes(app);

  /**
   * ANALYTICS ROUTES
   * Auth: Required
   * Role: Supergod only
   * AI output tracking and admin insights
   */
  registerAnalyticsRoutes(app); // These routes have their own middleware checks

  // Translation API routes for real GPT translation
  app.post("/api/translate-to-english", async (req, res) => {
    try {
      const { input } = req.body;
      if (!process.env.OPENAI_API_KEY) {
        return res.json({ translated: `[Simulated English]: ${input}` });
      }
      
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: 'Translate any language to English clearly and concisely for emergency response. Focus on extracting key emergency information.' },
          { role: 'user', content: input },
        ],
      });

      res.json({ translated: completion.choices[0].message.content });
    } catch (error: any) {
      console.error('Translation error:', error);
      res.json({ translated: `[Translation Error]: ${error.message}` });
    }
  });

  app.post("/api/translate-from-english", async (req, res) => {
    try {
      const { input, targetLanguage } = req.body;
      if (!process.env.OPENAI_API_KEY) {
        return res.json({ translated: `[${targetLanguage} Simulated]: ${input}` });
      }
      
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: `Translate the following emergency message into ${targetLanguage} in a calm, clear tone suitable for emergency responders. Do not include any English.`,
          },
          { role: 'user', content: input },
        ],
      });

      res.json({ translated: completion.choices[0].message.content });
    } catch (error: any) {
      console.error('Translation error:', error);
      res.json({ translated: `[Translation Error]: ${error.message}` });
    }
  });

    // Error handler must be last
    app.use(errorHandler);

    console.log("All routes registered successfully");
    return createServer(app);
    
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}