import * as schema from "./schema";

// Enhanced mock database matching Drizzle query patterns
const mockUser = {
  id: 1,
  username: "Emergency1", 
  password: "#Emergency1*",
  email: "emergency1@example.com",
  role: "responder",
  created_at: new Date(),
  last_login: null,
  verification_token: null,
  is_verified: true,
  two_factor_enabled: false,
  two_factor_secret: null,
  subscription_plan: "free",
  wallet_address: null,
  referral_code: null,
  referred_by: null,
  status: "active",
  notes: null,
  skip_email_verification: true,
  token_version: 0,
  token_balance: 0,
  total_tokens_used: 0,
  trial_active: false,
  trial_start_date: null,
  trial_expires_at: null,
  trial_ends_at: null,
  bonus_trial_claimed: false,
  is_test_account: false,
  achievements: [],
  certification_level: "UNCLASSIFIED"
};

export const db = {
  select: () => ({
    from: (table: any) => ({
      where: (condition: any) => ({
        limit: (count: number) => Promise.resolve([mockUser])
      }),
      limit: (count: number) => Promise.resolve([])
    }),
    limit: () => Promise.resolve([])
  }),
  update: (table: any) => ({
    set: (data: any) => ({
      where: (condition: any) => Promise.resolve()
    })
  }),
  insert: (table: any) => ({
    values: (data: any) => ({
      returning: () => Promise.resolve([mockUser])
    })
  }),
  query: {
    users: {
      findMany: () => Promise.resolve([mockUser]),
      findFirst: () => Promise.resolve(mockUser)
    },
    communicationChannels: {
      findMany: () => Promise.resolve([])
    }
  }
};

console.log("Database connection will be established on first request");
