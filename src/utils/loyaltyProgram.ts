/**
 * Loyalty program — mirrors MaSoVa core-service CustomerService defaults:
 *   MaSoVa.customer.loyalty.tier-thresholds.silver/gold/platinum
 *   MaSoVa.customer.loyalty.tier-multipliers.*
 *
 * Thresholds are not invented in the UI; progress is derived from these
 * platform defaults (and can be overridden if a future config API exists).
 */

import { LoyaltyInfo, OrderStats, PointTransaction } from '../types';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TierThreshold {
  tier: LoyaltyTier;
  /** Minimum points to reach this tier (platform updateLoyaltyTier) */
  minPoints: number;
  label: string;
  color: string;
  multiplier: number;
}

/** Platform defaults from CustomerService @Value properties */
export const LOYALTY_TIERS: TierThreshold[] = [
  { tier: 'BRONZE', minPoints: 0, label: 'Bronze', color: '#CD7F32', multiplier: 1.0 },
  { tier: 'SILVER', minPoints: 1000, label: 'Silver', color: '#9E9E9E', multiplier: 1.25 },
  { tier: 'GOLD', minPoints: 5000, label: 'Gold', color: '#F59E0B', multiplier: 1.5 },
  { tier: 'PLATINUM', minPoints: 10000, label: 'Platinum', color: '#8E24AA', multiplier: 2.0 },
];

export function normalizeTier(raw?: string | null): LoyaltyTier {
  const t = (raw || 'BRONZE').toUpperCase();
  if (t === 'SILVER' || t === 'GOLD' || t === 'PLATINUM' || t === 'BRONZE') return t;
  return 'BRONZE';
}

export function getTierMeta(tier?: string | null): TierThreshold {
  const t = normalizeTier(tier);
  return LOYALTY_TIERS.find((x) => x.tier === t) || LOYALTY_TIERS[0];
}

export function getTierColor(tier?: string | null): string {
  return getTierMeta(tier).color;
}

/** Next tier on the ladder, or null at Platinum */
export function getNextTier(tier?: string | null): TierThreshold | null {
  const t = normalizeTier(tier);
  const idx = LOYALTY_TIERS.findIndex((x) => x.tier === t);
  if (idx < 0 || idx >= LOYALTY_TIERS.length - 1) return null;
  return LOYALTY_TIERS[idx + 1];
}

export interface LoyaltyProgress {
  points: number;
  tier: LoyaltyTier;
  tierLabel: string;
  tierColor: string;
  nextTier: TierThreshold | null;
  /** 0–1 progress within current band toward next tier */
  progressPercent: number;
  /** Points still needed for next tier */
  pointsToNext: number;
  progressLabel: string;
  /** Overall 0–1 against highest tier threshold (for full-track bar) */
  overallPercent: number;
  milestones: { tier: LoyaltyTier; label: string; minPoints: number; color: string }[];
  multiplier: number;
}

export function computeLoyaltyProgress(
  loyalty?: LoyaltyInfo | null,
  locale = 'de-DE'
): LoyaltyProgress {
  const points = Math.max(0, Number(loyalty?.totalPoints ?? 0) || 0);
  // Prefer backend tier; recompute if missing
  let tier = normalizeTier(loyalty?.tier);
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (points >= LOYALTY_TIERS[i].minPoints) {
      // Backend is source of truth when present; only fill if empty/inconsistent upward
      if (!loyalty?.tier) tier = LOYALTY_TIERS[i].tier;
      break;
    }
  }
  // If backend tier lags points, show tier implied by points (same as server would upgrade)
  const byPoints = [...LOYALTY_TIERS].reverse().find((t) => points >= t.minPoints)?.tier || 'BRONZE';
  if (
    LOYALTY_TIERS.findIndex((t) => t.tier === byPoints) >
    LOYALTY_TIERS.findIndex((t) => t.tier === tier)
  ) {
    tier = byPoints;
  }

  const meta = getTierMeta(tier);
  const next = getNextTier(tier);
  const maxPoints = LOYALTY_TIERS[LOYALTY_TIERS.length - 1].minPoints;

  let progressPercent = 1;
  let pointsToNext = 0;
  let progressLabel = 'Highest tier unlocked';

  if (next) {
    const floor = meta.minPoints;
    const ceiling = next.minPoints;
    const span = Math.max(1, ceiling - floor);
    progressPercent = Math.min(1, Math.max(0, (points - floor) / span));
    pointsToNext = Math.max(0, ceiling - points);
    progressLabel = `${pointsToNext.toLocaleString(locale)} pts to ${next.label}`;
  }

  return {
    points,
    tier,
    tierLabel: meta.label,
    tierColor: meta.color,
    nextTier: next,
    progressPercent,
    pointsToNext,
    progressLabel,
    overallPercent: Math.min(1, points / maxPoints),
    milestones: LOYALTY_TIERS.map((t) => ({
      tier: t.tier,
      label: t.label,
      minPoints: t.minPoints,
      color: t.color,
    })),
    multiplier: meta.multiplier,
  };
}

/** Normalize loyalty blob from heterogeneous API payloads */
export function normalizeLoyaltyInfo(raw: any): LoyaltyInfo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const historyRaw = raw.pointHistory || raw.point_history || raw.history;
  const history: PointTransaction[] | undefined = Array.isArray(historyRaw)
    ? historyRaw.map((tx: any, i: number) => ({
        id: tx.id || `tx-${i}`,
        points: Number(tx.points ?? 0),
        type: (tx.type || 'EARNED') as PointTransaction['type'],
        description: tx.description || '',
        orderId: tx.orderId || tx.order_id,
        timestamp: tx.timestamp || tx.createdAt || tx.created_at || new Date().toISOString(),
      }))
    : undefined;

  let totalPoints = Number(
    raw.totalPoints ?? raw.total_points ?? raw.points ?? raw.balance ?? 0
  );
  let pointsEarned = Number(raw.pointsEarned ?? raw.points_earned ?? 0);
  let pointsRedeemed = Number(raw.pointsRedeemed ?? raw.points_redeemed ?? 0);

  // If totals are zero/missing but history exists, recompute from ledger
  if (history && history.length > 0) {
    let earned = 0;
    let redeemed = 0;
    for (const tx of history) {
      const p = Math.abs(Number(tx.points) || 0);
      if (tx.type === 'REDEEMED' || tx.type === 'EXPIRED') redeemed += p;
      else earned += p;
    }
    if (!pointsEarned) pointsEarned = earned;
    if (!pointsRedeemed) pointsRedeemed = redeemed;
    if (!totalPoints) totalPoints = Math.max(0, earned - redeemed);
  }

  if (Number.isNaN(totalPoints)) totalPoints = 0;
  if (Number.isNaN(pointsEarned)) pointsEarned = 0;
  if (Number.isNaN(pointsRedeemed)) pointsRedeemed = 0;

  return {
    totalPoints,
    pointsEarned,
    pointsRedeemed,
    tier: normalizeTier(raw.tier),
    tierExpiryDate: raw.tierExpiryDate || raw.tier_expiry_date,
    lastPointsUpdate: raw.lastPointsUpdate || raw.last_points_update,
    pointHistory: history,
  };
}

export function normalizeOrderStats(raw: any): OrderStats | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return {
    totalOrders: Number(raw.totalOrders ?? raw.total_orders ?? 0) || 0,
    completedOrders: Number(raw.completedOrders ?? raw.completed_orders ?? 0) || 0,
    cancelledOrders: Number(raw.cancelledOrders ?? raw.cancelled_orders ?? 0) || 0,
    totalSpent: Number(raw.totalSpent ?? raw.total_spent ?? 0) || 0,
    averageOrderValue: Number(raw.averageOrderValue ?? raw.average_order_value ?? 0) || 0,
    favoriteOrderType: raw.favoriteOrderType || raw.favorite_order_type,
  };
}
