import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, type SelectUser } from "../db/schema";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  email: z.string().email().optional(),
  skipEmailVerification: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),  
  email: z.string().email().optional(),
  skipEmailVerification: z.boolean().optional(),
});

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

export function setupAuth(app: Express) {
  const sessionSettings = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[DEBUG] Login attempt: { username: '${username}', skipEmailVerification: '${process.env.NODE_ENV}' }`);
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          console.log(`[DEBUG] User not found: ${username}`);
          return done(null, false, { message: "Incorrect username." });
        }

        console.log(`[DEBUG] Password comparison: provided='${password}', stored='${user.password}', match=${password === user.password}`);
        
        // Check if user email is verified with sandbox bypass
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const replitSandbox = process.env.REPLIT_DOMAINS || process.env.REPL_DOMAIN;
        const isSandboxEnvironment = isDevelopment || !!replitSandbox;
        
        if (!user.isVerified && !isSandboxEnvironment) {
          console.log(`[DEBUG] User not verified: ${username}, isDev: ${isDevelopment}, sandbox: ${!!replitSandbox}`);
          return done(null, false, { message: "Please verify your emergency credentials before accessing the system." });
        }

        // Log sandbox bypass for transparency
        if (!user.isVerified && isSandboxEnvironment) {
          console.log(`[SANDBOX BYPASS] Emergency credential verification bypassed for user: ${username} in development environment`);
        }

        console.log(`[DEBUG] Password comparison: provided='${password}', stored='${user.password}', match=${password === user.password}`);
        const isMatch = password === user.password;
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));

        return done(null, user);
      } catch (err) {
        console.error("Login error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const { username, password, skipEmailVerification } = result.data;
      console.log(`[DEBUG] Login attempt: { username: '${username}', skipEmailVerification: '${skipEmailVerification}' }`);

      const cb = async (err: any, user: Express.User, info: IVerifyOptions) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        if (!user) {
          // Check if the error is due to unverified credentials
          if (info.message === "Please verify your emergency credentials before accessing the system.") {
            // Check if bypass is enabled and requested
            const isDevelopment = process.env.NODE_ENV !== 'production';
            if (skipEmailVerification && isDevelopment) {
              console.log("[DEBUG] Bypassing email verification for development");
              // Find user and log them in directly
              try {
                const [foundUser] = await db
                  .select()
                  .from(disasterUsers)
                  .where(eq(disasterUsers.username, username))
                  .limit(1);
                
                if (foundUser) {
                  req.logIn(foundUser, (err) => {
                    if (err) {
                      console.error("Session error:", err);
                      return res.status(500).json({ message: "Session error" });
                    }
                    return res.json({
                      message: "Login successful (bypassed verification)",
                      user: {
                        id: foundUser.id,
                        username: foundUser.username,
                        email: foundUser.email,
                        role: foundUser.role,
                      },
                    });
                  });
                  return;
                }
              } catch (err) {
                console.error("Bypass login error:", err);
              }
            }
            return res.status(401).json({ 
              message: info.message,
              requiresVerification: true
            });
          }
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }

        req.logIn(user, (err) => {
          if (err) {
            console.error("Session error:", err);
            return res.status(500).json({ message: "Session error" });
          }
          return res.json({
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
            },
          });
        });
      };

      passport.authenticate("local", cb)(req, res, next);
    } catch (error) {
      console.error("Login endpoint error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input", 
          errors: result.error.issues,
        });
      }

      const { username, password, email, skipEmailVerification } = result.data;
      console.log(`[DEBUG] Registration data:`, { username, email, skipEmailVerification });

      // Skip verification if explicitly requested and bypass is allowed
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const shouldSkipVerification = skipEmailVerification === true && isDevelopment;
      console.log(`[DEBUG] Should skip verification:`, shouldSkipVerification);

      // Check if username or email already exists
      const existingUser = await db
        .select()
        .from(disasterUsers)
        .where(eq(disasterUsers.username, username))
        .limit(1);
      
      if (existingUser.length > 0) {
        return res.status(400).json({
          message: "Emergency responder username already exists"
        });
      }

      const existingEmailUser = await db
        .select()
        .from(disasterUsers)
        .where(eq(disasterUsers.email, email || ""))
        .limit(1);

      if (existingEmailUser.length > 0) {
        return res.status(400).json({
          message: "Emergency contact email already registered"
        });
      }

      // Generate verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const now = new Date();
      
      const [newUser] = await db
        .insert(disasterUsers)
        .values({
          username,
          email: email || "",
          password: password,
          role: "responder",
          lastLogin: now,
          subscriptionPlan: "emergency",
          department: "General Response",
          certificationLevel: "Basic",
          locationZone: "Unassigned",
          twoFactorEnabled: true,
          status: "active", 
          tokens: 1000,
          createdAt: now,
          isVerified: shouldSkipVerification ? true : false,
          verificationToken: shouldSkipVerification ? null : verificationToken,
          tokenVersion: 0
        })
        .returning();

      if (shouldSkipVerification) {
        // Auto-login if email verification is skipped
        req.logIn(newUser, (err) => {
          if (err) {
            console.error("Auto-login error:", err);
            return res.status(500).json({ message: "Registration successful but login failed" });
          }
          return res.status(201).json({
            message: "Registration and login successful",
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              role: newUser.role,
            },
          });
        });
      } else {
        // TODO: Send verification email
        console.log(`Email verification token for ${email}: ${verificationToken}`);
        console.log(`Verification link: ${req.get('origin') || 'http://localhost:5000'}/verify-email?token=${verificationToken}`);

        res.status(201).json({ 
          message: "User registered successfully. Please check your email to verify your account.",
          requiresVerification: true,
          email: newUser.email,
          // In development, include the token for testing
          ...(process.env.NODE_ENV === 'development' && { 
            verificationToken,
            verificationLink: `${req.get('origin') || 'http://localhost:5000'}/verify-email?token=${verificationToken}`
          })
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.user) {
      res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        tokens: req.user.tokens,
        subscriptionPlan: req.user.subscriptionPlan,
        trialActive: req.user.trialActive,
        trialExpiresAt: req.user.trialExpiresAt,
      });
    } else {
      res.status(401).json({ message: "Not logged in" });
    }
  });
}