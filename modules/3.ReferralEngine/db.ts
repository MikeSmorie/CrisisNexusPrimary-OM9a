// CrisisNexus Emergency Management System
// Referral system disabled for emergency operations
import { disasterUsers } from "../../db/schema";

// Emergency personnel referral system stub
export const emergencyReferrals = {
  findAll: () => [],
  create: () => null,
  update: () => null
};

export const awardTokens = () => null;
export const consumeTokens = () => null;
export const getUserTokenBalance = () => 0;
export const createReferralRedemption = () => null;
export const findReferralByCode = () => null;
export const createReferral = () => null;
export const incrementReferralUses = () => null;
export const getOrCreateReferralCode = () => null;
export const getUserCount = () => 0;
export const getUsersWithReferrals = () => [];
export const getReferralHistory = () => [];
export const hasUserRedeemedReferral = () => false;
export const getReferralStats = () => ({ total: 0, redeemed: 0 });
export const getReferralRedemptions = () => [];

export { disasterUsers };