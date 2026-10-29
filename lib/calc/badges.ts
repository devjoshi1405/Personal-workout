import { GoalType } from "./plan";

export interface UserStatsForBadges {
  totalSessions: number;
  bestStreak: number;
  hasPersonalRecord: boolean;
  startWeightKg: number;
  currentWeightKg: number;
  goal: GoalType;
  daysHitProteinTarget: number;
  totalWeighIns: number;
  currentlyEarnedBadgeKeys: string[];
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  category: "workout" | "streak" | "nutrition" | "progress" | "consistency";
}

export const ALL_BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_workout",
    name: "First Session",
    description: "Completed your first dumbbell workout.",
    category: "workout",
  },
  {
    key: "sessions_10",
    name: "10 Sessions Strong",
    description: "Completed 10 dumbbell workout sessions.",
    category: "workout",
  },
  {
    key: "sessions_25",
    name: "25 Club",
    description: "Completed 25 workout sessions.",
    category: "workout",
  },
  {
    key: "streak_7",
    name: "7-Day Streak",
    description: "Maintained workout and rest habits for 7 consecutive days.",
    category: "streak",
  },
  {
    key: "streak_30",
    name: "30-Day Streak",
    description: "Built an unbroken 30-day discipline habit.",
    category: "streak",
  },
  {
    key: "first_pr",
    name: "First Personal Best",
    description: "Set your first estimated 1RM personal record.",
    category: "workout",
  },
  {
    key: "progress_1kg",
    name: "1 kg Progress",
    description: "Achieved 1 kg of progress toward your target weight.",
    category: "progress",
  },
  {
    key: "progress_5kg",
    name: "5 kg Milestone",
    description: "Reached 5 kg of progress toward your target weight.",
    category: "progress",
  },
  {
    key: "protein_7",
    name: "Protein Master",
    description: "Hit your daily protein target on 7 days.",
    category: "nutrition",
  },
  {
    key: "weighins_14",
    name: "Scale Discipline",
    description: "Logged 14 morning weigh-ins.",
    category: "consistency",
  },
];

/**
 * Pure function evaluating all badge criteria against user stats,
 * returning newly unlocked badges and all unlocked badges.
 */
export function evaluateBadges(stats: UserStatsForBadges): {
  allEarnedKeys: string[];
  newlyEarnedBadges: BadgeDefinition[];
} {
  const {
    totalSessions,
    bestStreak,
    hasPersonalRecord,
    startWeightKg,
    currentWeightKg,
    goal,
    daysHitProteinTarget,
    totalWeighIns,
    currentlyEarnedBadgeKeys = [],
  } = stats;

  const earnedSet = new Set<string>();

  // 1. Session counts
  if (totalSessions >= 1) earnedSet.add("first_workout");
  if (totalSessions >= 10) earnedSet.add("sessions_10");
  if (totalSessions >= 25) earnedSet.add("sessions_25");

  // 2. Streaks
  if (bestStreak >= 7) earnedSet.add("streak_7");
  if (bestStreak >= 30) earnedSet.add("streak_30");

  // 3. PR
  if (hasPersonalRecord) earnedSet.add("first_pr");

  // 4. Weight Progress (1kg and 5kg in target direction)
  let weightDeltaInGoalDirection = 0;
  if (goal === "lose") {
    weightDeltaInGoalDirection = startWeightKg - currentWeightKg;
  } else if (goal === "gain") {
    weightDeltaInGoalDirection = currentWeightKg - startWeightKg;
  }

  if (weightDeltaInGoalDirection >= 1.0) earnedSet.add("progress_1kg");
  if (weightDeltaInGoalDirection >= 5.0) earnedSet.add("progress_5kg");

  // 5. Nutrition & Consistency
  if (daysHitProteinTarget >= 7) earnedSet.add("protein_7");
  if (totalWeighIns >= 14) earnedSet.add("weighins_14");

  const newlyEarnedBadges: BadgeDefinition[] = [];
  for (const badge of ALL_BADGE_DEFINITIONS) {
    if (earnedSet.has(badge.key) && !currentlyEarnedBadgeKeys.includes(badge.key)) {
      newlyEarnedBadges.push(badge);
    }
  }

  return {
    allEarnedKeys: Array.from(earnedSet),
    newlyEarnedBadges,
  };
}
