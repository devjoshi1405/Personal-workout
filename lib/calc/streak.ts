export interface StreakDayStatus {
  date: string; // YYYY-MM-DD
  isWorkoutDay: boolean;
  workoutCompleted: boolean;
}

/**
 * Checks whether a given day of week is a scheduled workout day.
 * Default 4-day Upper/Lower split:
 * Mon (1) = UA, Tue (2) = LA, Thu (4) = UB, Fri (5) = LB.
 * Wed (3), Sat (6), Sun (0) = Rest days.
 */
export function isScheduledWorkoutDay(dateStr: string): boolean {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5;
}

/**
 * Calculates current active streak and all-time longest streak.
 * - Scheduled workout days require a completed workout to maintain streak.
 * - Scheduled rest days count automatically as active days provided streak is unbroken.
 */
export function calculateStreak(
  history: { date: string; workoutCompleted: boolean }[],
  referenceDate: string | Date = new Date()
): { currentStreak: number; bestStreak: number } {
  if (!history || history.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Create lookup map by date string
  const dateMap = new Map<string, boolean>();
  for (const item of history) {
    dateMap.set(item.date, item.workoutCompleted);
  }

  // Sort unique dates ascending
  const uniqueDates = Array.from(new Set(history.map((h) => h.date))).sort();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 0;
  let runningStreak = 0;

  // Process day by day from earliest date up to referenceDate
  const current = new Date(uniqueDates[0]);
  const end = new Date(referenceDate);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const isWODay = isScheduledWorkoutDay(dateStr);
    const completed = dateMap.get(dateStr) ?? false;

    if (isWODay) {
      if (completed) {
        runningStreak++;
      } else {
        // Today could still be in progress if it's the reference date
        const isToday = dateStr === (typeof referenceDate === "string" ? referenceDate : referenceDate.toISOString().split("T")[0]);
        if (!isToday) {
          runningStreak = 0;
        }
      }
    } else {
      // Rest day counts automatically if streak is already active
      if (runningStreak > 0) {
        runningStreak++;
      }
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    currentStreak: runningStreak,
    bestStreak,
  };
}
