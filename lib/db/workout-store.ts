import { createClient } from "@/lib/supabase/client";
import {
  Exercise,
  WorkoutTemplate,
  TemplateExercise,
  WorkoutSession,
  SetLog,
  PersonalRecord,
  TemplateKey,
} from "./types";
import { calculateEstimated1RM, detectPersonalRecord, calculateOverloadSuggestion, OverloadSuggestion } from "@/lib/calc/overload";

export interface WarmUpItem {
  name: string;
  duration: string;
  focus: string;
}

export interface CoolDownItem {
  name: string;
  duration: string;
  focus: string;
}

export const UPPER_WARMUP: WarmUpItem[] = [
  { name: "Arm Circles & Cross-body Swings", duration: "60 seconds", focus: "Shoulder joint synovial fluid" },
  { name: "Scapular Push-ups on Bench", duration: "10-12 reps", focus: "Serratus anterior & upper back activation" },
  { name: "Band / Dumbbell External Rotations", duration: "12-15 reps", focus: "Rotator cuff infraspinatus" },
  { name: "Light Dumbbell Overhead Press", duration: "10 light reps", focus: "Movement pattern grooving" },
];

export const LOWER_WARMUP: WarmUpItem[] = [
  { name: "Bodyweight Air Squats", duration: "15 reps", focus: "Hip, knee, ankle joint warm-up" },
  { name: "Glute Bridges (Double Leg)", duration: "12 reps with 2s hold", focus: "Gluteus maximus activation" },
  { name: "Standing Leg Swings (Front & Lateral)", duration: "10 per leg", focus: "Hamstrings and adductors dynamic stretch" },
  { name: "World's Greatest Stretch", duration: "5 per side", focus: "Thoracic spine & hip flexor mobility" },
];

export const UPPER_COOLDOWN: CoolDownItem[] = [
  { name: "Doorway / Bench Chest Stretch", duration: "45 seconds per side", focus: "Pectoralis major & minor" },
  { name: "Cross-body Posterior Shoulder Stretch", duration: "40 seconds per arm", focus: "Rear deltoid & rotator cuff" },
  { name: "Overhead Triceps & Lat Stretch", duration: "40 seconds per side", focus: "Triceps long head & lats" },
  { name: "Wrist Flexor & Extensor Stretch", duration: "30 seconds", focus: "Forearm extensors from dumbbell gripping" },
];

export const LOWER_COOLDOWN: CoolDownItem[] = [
  { name: "Kneeling Hip Flexor Stretch on Mat", duration: "45 seconds per leg", focus: "Psoas & rectus femoris" },
  { name: "Standing / Seated Hamstring Stretch", duration: "45 seconds per side", focus: "Biceps femoris & semitendinosus" },
  { name: "Figure-4 Piriformis / Glute Stretch", duration: "45 seconds per side", focus: "Glute medius & deep rotators" },
  { name: "Wall Calf Stretch (Gastroc & Soleus)", duration: "40 seconds per calf", focus: "Calf muscles & Achilles" },
];

export const FULL_BODY_MOBILITY_REST_DAY = [
  { name: "Cat-Cow Spine Flow", duration: "90 seconds", instruction: "Slow undulating breath with spinal flexion and extension." },
  { name: "Deep Goblet Squat Hold", duration: "60 seconds", instruction: "Sit in bottom of squat, elbows pushing knees out, tall chest." },
  { name: "Child's Pose to Cobra", duration: "2 minutes", instruction: "Extend spine, stretch lats and decompress lower back." },
  { name: "Thoracic Windmills on Mat", duration: "8 per side", instruction: "Open chest toward ceiling with knees pinned to floor." },
  { name: "90/90 Hip Mobility Flow", duration: "2 minutes", instruction: "Internal and external hip rotation transition." },
  { name: "Dead Hang from Sturdy Anchor or Door Frame", duration: "60 seconds", instruction: "Full spinal decompression." },
];

export interface FullTemplateData {
  template: WorkoutTemplate;
  exercises: (TemplateExercise & {
    exercise: Exercise;
    alternatives: Exercise[];
    lastPerformance?: { weight_kg: number; reps: number }[];
    overloadSuggestion: OverloadSuggestion;
    best1RM: number;
  })[];
  warmup: WarmUpItem[];
  cooldown: CoolDownItem[];
}

// In-memory / local fallback storage keys
const SESSIONS_STORAGE_KEY = "bench_and_dal_workout_sessions";
const SETS_STORAGE_KEY = "bench_and_dal_set_logs";
const PRS_STORAGE_KEY = "bench_and_dal_personal_records";
const INJURY_STORAGE_KEY = "bench_and_dal_injury_notes";

/**
 * Loads workout template with full exercises, cues, alternatives, and overload suggestions.
 */
export async function loadWorkoutTemplate(templateKey: TemplateKey): Promise<FullTemplateData | null> {
  const supabase = createClient();

  let template: WorkoutTemplate | null = null;
  let rawTemplateExercises: TemplateExercise[] = [];
  let allExercises: Exercise[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isRealSupabase = supabaseUrl && !supabaseUrl.includes("placeholder-project");

  if (isRealSupabase) {
    try {
      // 1. Fetch Template
      const { data: tmplData } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("key", templateKey)
        .single();

      if (tmplData) {
        template = tmplData as WorkoutTemplate;

        // 2. Fetch Template Exercises
        const { data: teData } = await supabase
          .from("template_exercises")
          .select("*")
          .eq("template_id", template.id)
          .order("position", { ascending: true });

        if (teData) {
          rawTemplateExercises = teData as TemplateExercise[];
        }
      }

      // 3. Fetch Exercises
      const { data: exData } = await supabase
        .from("exercises")
        .select("*");

      if (exData) {
        allExercises = exData as Exercise[];
      }
    } catch (err) {
      console.warn("Supabase template fetch fallback:", err);
    }
  }

  // Fallback defaults if Supabase seed not reached
  if (!template) {
    const titles: Record<TemplateKey, { name: string; sub: string; type: "upper" | "lower" }> = {
      UA: { name: "Upper Body A", sub: "Dumbbell bench, one-arm row, shoulder press, fly, hammer curls, overhead triceps", type: "upper" },
      LA: { name: "Lower Body A", sub: "Goblet squats, RDL, Bulgarian split squats, hip thrusts, calves, plank", type: "lower" },
      UB: { name: "Upper Body B", sub: "Neutral press, chest-supported row, Arnold press, lateral raises, triceps, curls, rear delts", type: "upper" },
      LB: { name: "Lower Body B", sub: "Bench step-ups, sumo squats, single-leg RDL, reverse lunges, glute bridge, calves, leg raise", type: "lower" },
    };
    template = {
      id: `tmpl_${templateKey.toLowerCase()}`,
      key: templateKey,
      name: titles[templateKey].name,
      subtitle: titles[templateKey].sub,
      type: titles[templateKey].type,
      created_at: new Date().toISOString(),
    };
  }

  // Fetch local or user history for overload suggestions
  const userPastSets = getStoredSetLogs();
  const userPRs = getStoredPRs();

  // Build full exercises
  const exercises = getFallbackExercisesForTemplate(templateKey, allExercises).map((item) => {
    // Look up past performance of this exercise
    const pastSets = userPastSets
      .filter((s) => s.exercise_id === item.exercise_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, item.sets)
      .reverse();

    const lastPerformance = pastSets.length > 0 ? pastSets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps })) : undefined;

    const pr = userPRs.find((p) => p.exercise_id === item.exercise_id);
    const best1RM = pr ? pr.est_1rm : 0;

    const overloadSuggestion = calculateOverloadSuggestion({
      lastSessionSets: lastPerformance,
      repMin: item.rep_min,
      repMax: item.rep_max,
      dumbbellStepKg: 2.0,
      unit: item.exercise.unit,
      userHasNextWeight: true,
      previousBest1RM: best1RM,
    });

    return {
      ...item,
      lastPerformance,
      overloadSuggestion,
      best1RM,
    };
  });

  const warmup = template.type === "upper" ? UPPER_WARMUP : LOWER_WARMUP;
  const cooldown = template.type === "upper" ? UPPER_COOLDOWN : LOWER_COOLDOWN;

  return {
    template,
    exercises,
    warmup,
    cooldown,
  };
}

/**
 * Saves a completed workout session with set logs and updates personal records.
 */
export async function saveWorkoutSession(params: {
  templateKey: TemplateKey;
  durationMinutes: number;
  notes?: string;
  sets: {
    exercise_id: string;
    set_number: number;
    weight_kg: number;
    reps: number;
  }[];
}): Promise<{ sessionId: string; newPRs: PersonalRecord[] }> {
  const supabase = createClient();
  const todayStr = new Date().toISOString().split("T")[0];
  const sessionId = `session_${Date.now()}`;
  const newPRs: PersonalRecord[] = [];

  let userId = "demo-user";

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;

      // 1. Insert Workout Session
      const { data: sessionRow } = await supabase
        .from("workout_sessions")
        .upsert({
          user_id: user.id,
          date: todayStr,
          template_key: params.templateKey,
          duration_minutes: params.durationMinutes,
          notes: params.notes || null,
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,date,template_key" })
        .select()
        .single();

      const activeSessionId = sessionRow ? sessionRow.id : sessionId;

      // 2. Insert Set Logs
      if (params.sets.length > 0) {
        const setLogsToInsert = params.sets.map((s) => ({
          session_id: activeSessionId,
          user_id: user.id,
          exercise_id: s.exercise_id,
          set_number: s.set_number,
          weight_kg: s.weight_kg,
          reps: s.reps,
        }));
        await supabase.from("set_logs").insert(setLogsToInsert);
      }
    }
  } catch (err) {
    console.warn("Supabase workout session save fallback:", err);
  }

  // 3. Evaluate Personal Records
  const existingPRs = getStoredPRs();
  const groupedByExercise = new Map<string, { weight_kg: number; reps: number }[]>();

  for (const set of params.sets) {
    if (!groupedByExercise.has(set.exercise_id)) {
      groupedByExercise.set(set.exercise_id, []);
    }
    groupedByExercise.get(set.exercise_id)!.push({ weight_kg: set.weight_kg, reps: set.reps });
  }

  for (const [exerciseId, exerciseSets] of groupedByExercise.entries()) {
    const prevPR = existingPRs.find((p) => p.exercise_id === exerciseId);
    const prEval = detectPersonalRecord(exerciseSets, prevPR ? prevPR.est_1rm : 0);

    if (prEval.isPR) {
      const bestSet = exerciseSets.reduce((prev, curr) =>
        calculateEstimated1RM(curr.weight_kg, curr.reps) > calculateEstimated1RM(prev.weight_kg, prev.reps) ? curr : prev
      );

      const prRecord: PersonalRecord = {
        id: `pr_${Date.now()}_${exerciseId}`,
        user_id: userId,
        exercise_id: exerciseId,
        date: todayStr,
        weight_kg: bestSet.weight_kg,
        reps: bestSet.reps,
        est_1rm: prEval.estimated1RM,
        created_at: new Date().toISOString(),
      };

      newPRs.push(prRecord);
      savePR(prRecord);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("personal_records").upsert(prRecord);
        }
      } catch (err) {
        console.warn("Could not sync PR to Supabase:", err);
      }
    }
  }

  // Save to local storage for offline resiliency
  saveStoredSession({
    id: sessionId,
    user_id: userId,
    date: todayStr,
    template_key: params.templateKey,
    duration_minutes: params.durationMinutes,
    notes: params.notes || null,
    completed_at: new Date().toISOString(),
  });

  const fullSetLogs: SetLog[] = params.sets.map((s, idx) => ({
    id: `set_${sessionId}_${idx}`,
    session_id: sessionId,
    user_id: userId,
    exercise_id: s.exercise_id,
    set_number: s.set_number,
    weight_kg: s.weight_kg,
    reps: s.reps,
    created_at: new Date().toISOString(),
  }));
  saveStoredSetLogs(fullSetLogs);

  return { sessionId, newPRs };
}

/**
 * Loads workout history sessions with set details.
 */
export async function loadWorkoutHistory(): Promise<
  (WorkoutSession & { totalSets: number; totalVolumeKg: number })[]
> {
  const supabase = createClient();
  let sessions: WorkoutSession[] = [];
  let sets: SetLog[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isRealSupabase = supabaseUrl && !supabaseUrl.includes("placeholder-project");

  if (isRealSupabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sessionRows } = await supabase
          .from("workout_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (sessionRows) {
          sessions = sessionRows as WorkoutSession[];
        }

        const { data: setRows } = await supabase
          .from("set_logs")
          .select("*")
          .eq("user_id", user.id);

        if (setRows) {
          sets = setRows as SetLog[];
        }
      }
    } catch (err) {
      console.warn("Supabase history load fallback:", err);
    }
  }

  if (sessions.length === 0) {
    sessions = getStoredSessions();
    sets = getStoredSetLogs();
  }

  return sessions.map((sess) => {
    const sessionSets = sets.filter((s) => s.session_id === sess.id);
    const totalVolumeKg = sessionSets.reduce((sum, curr) => sum + curr.weight_kg * curr.reps, 0);
    return {
      ...sess,
      totalSets: sessionSets.length,
      totalVolumeKg: Math.round(totalVolumeKg),
    };
  });
}

/**
 * Checks if current user is on deload week (every 7th week)
 * or if high soreness and low energy warrants a lighter session.
 */
export function getDeloadRecommendation(weekNumber: number, sorenessScore?: number, energyScore?: number): {
  isDeloadWeek: boolean;
  isFatigued: boolean;
  message: string | null;
} {
  const isDeloadWeek = weekNumber > 0 && weekNumber % 7 === 0;
  const isFatigued = (sorenessScore !== undefined && sorenessScore >= 4) && (energyScore !== undefined && energyScore <= 2);

  if (isDeloadWeek) {
    return {
      isDeloadWeek: true,
      isFatigued,
      message: "Deload Week: Perform 2 sets per exercise at approximately 70% of your regular working weight to allow joints and CNS recovery.",
    };
  }

  if (isFatigued) {
    return {
      isDeloadWeek: false,
      isFatigued: true,
      message: "High soreness and low energy detected from your weekly check-in. Consider an RPE 7 lighter session today.",
    };
  }

  return {
    isDeloadWeek: false,
    isFatigued: false,
    message: null,
  };
}

// -----------------------------------------------------------------------------
// LOCAL STORAGE HELPERS
// -----------------------------------------------------------------------------

function getStoredSessions(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  const s = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

function saveStoredSession(sess: WorkoutSession) {
  if (typeof window === "undefined") return;
  const list = getStoredSessions();
  list.unshift(sess);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
}

function getStoredSetLogs(): SetLog[] {
  if (typeof window === "undefined") return [];
  const s = localStorage.getItem(SETS_STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

function saveStoredSetLogs(newLogs: SetLog[]) {
  if (typeof window === "undefined") return;
  const list = getStoredSetLogs();
  list.push(...newLogs);
  localStorage.setItem(SETS_STORAGE_KEY, JSON.stringify(list));
}

function getStoredPRs(): PersonalRecord[] {
  if (typeof window === "undefined") return [];
  const s = localStorage.getItem(PRS_STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

function savePR(pr: PersonalRecord) {
  if (typeof window === "undefined") return;
  const list = getStoredPRs().filter((p) => p.exercise_id !== pr.exercise_id);
  list.push(pr);
  localStorage.setItem(PRS_STORAGE_KEY, JSON.stringify(list));
}

// -----------------------------------------------------------------------------
// SEED FALLBACK MAPPER FOR OFFLINE / INSTANT DEMO
// -----------------------------------------------------------------------------

function getFallbackExercisesForTemplate(
  key: TemplateKey,
  dbExercises: Exercise[]
): (TemplateExercise & { exercise: Exercise; alternatives: Exercise[] })[] {
  const exMap = new Map<string, Exercise>();
  dbExercises.forEach((e) => exMap.set(e.id, e));

  // Default exercises matching specification
  const fallbackList: Record<
    TemplateKey,
    { id: string; name: string; unit: "reps" | "seconds"; tip: string; muscle: string; sets: number; min: number; max: number; rest: number }[]
  > = {
    UA: [
      { id: "ex_db_bench_press", name: "Flat dumbbell bench press", unit: "reps", tip: "Drive feet into floor, retract shoulder blades, lower dumbbells at ~45-60 deg.", muscle: "Chest", sets: 4, min: 8, max: 12, rest: 120 },
      { id: "ex_db_one_arm_row", name: "One-arm dumbbell row", unit: "reps", tip: "Flat spine, pull elbow toward hip pocket, avoid rotating torso.", muscle: "Back", sets: 4, min: 8, max: 12, rest: 90 },
      { id: "ex_db_seated_shoulder_press", name: "Seated dumbbell shoulder press", unit: "reps", tip: "Press vertically without arching lower back, elbows slightly in front.", muscle: "Shoulders", sets: 3, min: 8, max: 12, rest: 90 },
      { id: "ex_db_flat_fly", name: "Flat dumbbell fly", unit: "reps", tip: "Slight bend in elbows, open until gentle chest stretch, squeeze at top.", muscle: "Chest", sets: 3, min: 12, max: 15, rest: 60 },
      { id: "ex_db_hammer_curl", name: "Hammer curl", unit: "reps", tip: "Neutral palms facing in, elbows pinned to sides.", muscle: "Biceps", sets: 3, min: 10, max: 12, rest: 60 },
      { id: "ex_db_overhead_triceps", name: "Overhead dumbbell triceps extension", unit: "reps", tip: "Keep upper arms close to ears, lower behind head for full stretch.", muscle: "Triceps", sets: 3, min: 10, max: 12, rest: 60 },
    ],
    LA: [
      { id: "ex_db_goblet_squat", name: "Goblet squat", unit: "reps", tip: "Hold one dumbbell vertical at chest, knees track toes, sink below parallel.", muscle: "Quads", sets: 4, min: 10, max: 15, rest: 90 },
      { id: "ex_db_rdl", name: "Dumbbell Romanian deadlift", unit: "reps", tip: "Soft knees, push hips back, weights skimming legs until hamstring stretch.", muscle: "Hamstrings", sets: 4, min: 8, max: 12, rest: 90 },
      { id: "ex_db_bulgarian_split_squat", name: "Bulgarian split squat", unit: "reps", tip: "Back foot laces on bench, drop back knee straight down.", muscle: "Quads & Glutes", sets: 3, min: 8, max: 12, rest: 90 },
      { id: "ex_db_hip_thrust", name: "Dumbbell hip thrust", unit: "reps", tip: "Upper back across flat bench, drive through heels, full glute contraction.", muscle: "Glutes", sets: 3, min: 12, max: 15, rest: 60 },
      { id: "ex_db_standing_calf_raise", name: "Standing calf raise", unit: "reps", tip: "2-second pause at peak contraction and full stretch at bottom.", muscle: "Calves", sets: 4, min: 15, max: 20, rest: 45 },
      { id: "ex_plank", name: "Plank", unit: "seconds", tip: "Brace core, squeeze glutes, straight line from head to heels.", muscle: "Core", sets: 3, min: 30, max: 45, rest: 45 },
    ],
    UB: [
      { id: "ex_db_neutral_press", name: "Neutral-grip dumbbell press", unit: "reps", tip: "Palms facing in, gentle on anterior shoulders, deep chest stretch.", muscle: "Chest", sets: 3, min: 10, max: 12, rest: 90 },
      { id: "ex_db_chest_supported_row", name: "Chest-supported row (face down on bench)", unit: "reps", tip: "Lie prone on flat bench, row dumbbells up squeezing mid-back.", muscle: "Back", sets: 4, min: 10, max: 12, rest: 90 },
      { id: "ex_db_arnold_press", name: "Arnold press", unit: "reps", tip: "Start with palms facing chest, rotate outwards as you press.", muscle: "Shoulders", sets: 3, min: 10, max: 12, rest: 90 },
      { id: "ex_db_lateral_raise", name: "Lateral raise", unit: "reps", tip: "Slight forward torso lean, raise elbows to shoulder height.", muscle: "Shoulders", sets: 3, min: 12, max: 15, rest: 60 },
      { id: "ex_db_lying_triceps", name: "Lying dumbbell triceps extension", unit: "reps", tip: "Lie flat on bench, lower dumbbells toward temples.", muscle: "Triceps", sets: 3, min: 10, max: 12, rest: 60 },
      { id: "ex_db_alt_bicep_curl", name: "Alternating dumbbell curl", unit: "reps", tip: "Supinate wrist on the way up, squeeze bicep at peak.", muscle: "Biceps", sets: 3, min: 10, max: 12, rest: 60 },
      { id: "ex_db_rear_delt_fly", name: "Bent-over rear delt fly", unit: "reps", tip: "Hinge forward, sweep arms wide focusing on rear delts, not traps.", muscle: "Rear Delts", sets: 3, min: 12, max: 15, rest: 60 },
    ],
    LB: [
      { id: "ex_db_step_up", name: "Bench step-up", unit: "reps", tip: "Place full foot on flat bench, drive through front heel without jumping.", muscle: "Quads & Glutes", sets: 3, min: 10, max: 12, rest: 90 },
      { id: "ex_db_sumo_squat", name: "Sumo squat with one dumbbell", unit: "reps", tip: "Wide stance, toes 45 deg out, hold dumbbell vertical.", muscle: "Adductors & Glutes", sets: 4, min: 12, max: 15, rest: 90 },
      { id: "ex_db_single_leg_rdl", name: "Single-leg Romanian deadlift", unit: "reps", tip: "Hinge on standing leg, back leg rises like a lever.", muscle: "Hamstrings", sets: 3, min: 10, max: 12, rest: 60 },
      { id: "ex_db_reverse_lunge", name: "Reverse lunge", unit: "reps", tip: "Step back smoothly, torso tall or slight forward lean for glutes.", muscle: "Quads & Glutes", sets: 3, min: 10, max: 12, rest: 90 },
      { id: "ex_db_single_leg_glute_bridge", name: "Single-leg glute bridge (on bench)", unit: "reps", tip: "Upper back on bench, lift one foot, drive other heel into floor.", muscle: "Glutes", sets: 3, min: 10, max: 12, rest: 60 },
      { id: "ex_db_single_leg_calf_raise", name: "Single-leg calf raise holding dumbbell", unit: "reps", tip: "Slow controlled reps on one leg, 1-sec peak squeeze.", muscle: "Calves", sets: 3, min: 12, max: 15, rest: 45 },
      { id: "ex_db_lying_leg_raise", name: "Lying leg raise on bench", unit: "reps", tip: "Hold bench behind head, raise legs without swinging, control eccentric.", muscle: "Core", sets: 3, min: 10, max: 15, rest: 45 },
    ],
  };

  return fallbackList[key].map((item, index) => {
    const exercise: Exercise = exMap.get(item.id) || {
      id: item.id,
      name: item.name,
      unit: item.unit,
      tip: item.tip,
      muscle_group: item.muscle,
      equipment: "dumbbells_and_flat_bench",
      is_active: true,
      created_at: new Date().toISOString(),
    };

    return {
      id: `te_${key}_${item.id}`,
      template_id: `tmpl_${key.toLowerCase()}`,
      exercise_id: item.id,
      position: index + 1,
      sets: item.sets,
      rep_min: item.min,
      rep_max: item.max,
      rest_seconds: item.rest,
      exercise,
      alternatives: [],
    };
  });
}
