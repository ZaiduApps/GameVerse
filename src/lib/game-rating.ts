export type GameRatingStar = 1 | 2 | 3 | 4 | 5;

export type GameRatingBreakdown = Record<GameRatingStar, number>;

export interface GameRatingInput {
  manualScore?: number | string | null;
  userAverage?: number | string | null;
  ratingCount?: number | string | null;
  ratingBreakdown?: Partial<Record<GameRatingStar, number | string | null>> | null;
  globalAverage?: number;
  priorWeight?: number;
  confidenceZ?: number;
}

export interface GameRatingResult {
  displayScore: number;
  bayesianScore: number;
  confidenceScore: number;
  userAverage: number;
  ratingCount: number;
  manualScore: number | null;
  breakdown: GameRatingBreakdown;
}

const DEFAULT_GLOBAL_AVERAGE = 4.2;
const DEFAULT_PRIOR_WEIGHT = 16;
const DEFAULT_CONFIDENCE_Z = 1.96;
const EMPTY_BREAKDOWN: GameRatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function normalizeToFiveStar(raw: unknown): number | null {
  const value = toNumber(raw);
  if (value === null) return null;
  if (value <= 0) return null;
  if (value <= 5) return clamp(value, 1, 5);
  if (value <= 10) return clamp(value / 2, 1, 5);
  if (value <= 100) return clamp((value / 100) * 5, 1, 5);
  return 5;
}

function normalizeCount(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function normalizeBreakdown(
  input?: Partial<Record<GameRatingStar, number | string | null>> | null,
): GameRatingBreakdown {
  if (!input) return { ...EMPTY_BREAKDOWN };
  return {
    1: normalizeCount(input[1]),
    2: normalizeCount(input[2]),
    3: normalizeCount(input[3]),
    4: normalizeCount(input[4]),
    5: normalizeCount(input[5]),
  };
}

function sumBreakdown(breakdown: GameRatingBreakdown): number {
  return breakdown[1] + breakdown[2] + breakdown[3] + breakdown[4] + breakdown[5];
}

function averageFromBreakdown(breakdown: GameRatingBreakdown): number | null {
  const total = sumBreakdown(breakdown);
  if (total <= 0) return null;
  const score =
    breakdown[1] * 1 +
    breakdown[2] * 2 +
    breakdown[3] * 3 +
    breakdown[4] * 4 +
    breakdown[5] * 5;
  return score / total;
}

function wilsonLowerBound(positive: number, total: number, z = DEFAULT_CONFIDENCE_Z): number {
  if (total <= 0) return 0;
  const p = positive / total;
  const z2 = z * z;
  const base = p + z2 / (2 * total);
  const delta = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  const denominator = 1 + z2 / total;
  return clamp((base - delta) / denominator, 0, 1);
}

export function computeGameRating(input: GameRatingInput = {}): GameRatingResult {
  const manualScore = normalizeToFiveStar(input.manualScore);
  const breakdown = normalizeBreakdown(input.ratingBreakdown);

  const explicitCount = normalizeCount(input.ratingCount);
  const breakdownCount = sumBreakdown(breakdown);
  const ratingCount = Math.max(explicitCount, breakdownCount);

  const globalAverage = clamp(
    normalizeToFiveStar(input.globalAverage) ?? DEFAULT_GLOBAL_AVERAGE,
    1,
    5,
  );
  const priorWeight = Math.max(1, Number(input.priorWeight || DEFAULT_PRIOR_WEIGHT));

  const breakdownAverage = averageFromBreakdown(breakdown);
  const directAverage = normalizeToFiveStar(input.userAverage);
  const userAverage = clamp(
    breakdownAverage ?? directAverage ?? manualScore ?? globalAverage,
    1,
    5,
  );

  const bayesianScore =
    (ratingCount / (ratingCount + priorWeight)) * userAverage +
    (priorWeight / (ratingCount + priorWeight)) * globalAverage;

  const positiveVotes = breakdownCount > 0
    ? breakdown[4] + breakdown[5]
    : Math.round((userAverage / 5) * ratingCount);
  const confidenceRatio = wilsonLowerBound(
    Math.max(0, Math.min(positiveVotes, ratingCount)),
    ratingCount,
    Number(input.confidenceZ || DEFAULT_CONFIDENCE_Z),
  );
  const confidenceScore = clamp(confidenceRatio * 5, 1, 5);

  const penaltyFactor = ratingCount >= 50 ? 0 : (50 - ratingCount) / 50;
  const lowSamplePenalty = penaltyFactor * 0.25;
  const mixedScore = clamp(
    ratingCount > 0
      ? bayesianScore * 0.7 + confidenceScore * 0.3 - lowSamplePenalty
      : manualScore ?? globalAverage,
    1,
    5,
  );

  const manualWeight = manualScore === null
    ? 0
    : clamp((8 - ratingCount) / 8, 0, 1) * 0.45;
  const displayScore = clamp(
    mixedScore * (1 - manualWeight) + (manualScore ?? mixedScore) * manualWeight,
    1,
    5,
  );

  return {
    displayScore: roundTo1(displayScore),
    bayesianScore: roundTo1(bayesianScore),
    confidenceScore: roundTo1(confidenceScore),
    userAverage: roundTo1(userAverage),
    ratingCount,
    manualScore: manualScore === null ? null : roundTo1(manualScore),
    breakdown,
  };
}
