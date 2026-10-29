-- Bench & Dal Seed Data
-- 100% Flat Bench & Dumbbells Only + Indian Vegetarian & Eggetarian Database

-- ==============================================================================
-- 1. EXERCISES SEED (Flat Bench & Dumbbells Only)
-- ==============================================================================

insert into public.exercises (id, name, unit, tip, muscle_group, equipment) values
-- Upper A
('ex_db_bench_press', 'Flat dumbbell bench press', 'reps', 'Drive feet into floor, retract shoulder blades, lower dumbbells with elbows at ~45-60 degrees.', 'Chest', 'dumbbells_and_flat_bench'),
('ex_db_one_arm_row', 'One-arm dumbbell row (knee and hand on bench)', 'reps', 'Flat spine, pull elbow toward hip pocket, avoid rotating torso.', 'Back', 'dumbbells_and_flat_bench'),
('ex_db_seated_shoulder_press', 'Seated dumbbell shoulder press', 'reps', 'Press vertically without hyperextending lower back, elbows slightly in front of shoulders.', 'Shoulders', 'dumbbells_and_flat_bench'),
('ex_db_flat_fly', 'Flat dumbbell fly', 'reps', 'Slight bend in elbows, open wide until gentle stretch across chest, squeeze together at top.', 'Chest', 'dumbbells_and_flat_bench'),
('ex_db_hammer_curl', 'Hammer curl', 'reps', 'Neutral palms facing each other, keep elbows pinned to sides.', 'Biceps', 'dumbbells_and_flat_bench'),
('ex_db_overhead_triceps', 'Overhead dumbbell triceps extension', 'reps', 'Keep upper arms close to ears, lower behind head, full triceps stretch.', 'Triceps', 'dumbbells_and_flat_bench'),

-- Lower A
('ex_db_goblet_squat', 'Goblet squat', 'reps', 'Hold one dumbbell vertical at chest, knees tracking toes, sink hips below parallel if mobility allows.', 'Quads', 'dumbbells_and_flat_bench'),
('ex_db_rdl', 'Dumbbell Romanian deadlift', 'reps', 'Soft knee bend, push hips back, keep weights skimming legs until deep hamstring stretch.', 'Hamstrings', 'dumbbells_and_flat_bench'),
('ex_db_bulgarian_split_squat', 'Bulgarian split squat (back foot on bench)', 'reps', 'Back laces on bench, drop back knee straight down, keep front heel planted.', 'Quads & Glutes', 'dumbbells_and_flat_bench'),
('ex_db_hip_thrust', 'Dumbbell hip thrust (upper back on bench)', 'reps', 'Upper back across flat bench, dumbbell across hips, drive through heels, full glute squeeze.', 'Glutes', 'dumbbells_and_flat_bench'),
('ex_db_standing_calf_raise', 'Standing calf raise', 'reps', 'Hold dumbbells, slow 2-second pause at the peak contraction and full stretch at bottom.', 'Calves', 'dumbbells_and_flat_bench'),
('ex_plank', 'Plank', 'seconds', 'Brace abs, squeeze glutes, maintain straight line from head to heels.', 'Core', 'flat_bench'),

-- Upper B
('ex_db_neutral_press', 'Neutral-grip dumbbell press', 'reps', 'Palms facing in, easier on front delts, full chest stretch at bottom.', 'Chest', 'dumbbells_and_flat_bench'),
('ex_db_chest_supported_row', 'Chest-supported row (face down on bench)', 'reps', 'Lie prone on flat bench, row dumbbells up squeezing mid-back, zero lower back fatigue.', 'Back', 'dumbbells_and_flat_bench'),
('ex_db_arnold_press', 'Arnold press', 'reps', 'Start with palms facing chest, rotate outward as you press upward.', 'Shoulders', 'dumbbells_and_flat_bench'),
('ex_db_lateral_raise', 'Lateral raise', 'reps', 'Slight forward torso lean, raise elbows to shoulder height with pinkies slightly higher.', 'Shoulders', 'dumbbells_and_flat_bench'),
('ex_db_lying_triceps', 'Lying dumbbell triceps extension', 'reps', 'Lie flat on bench, lower dumbbells toward temples, elbows point up.', 'Triceps', 'dumbbells_and_flat_bench'),
('ex_db_alt_bicep_curl', 'Alternating dumbbell curl', 'reps', 'Supinate wrist on the way up, squeeze bicep at peak.', 'Biceps', 'dumbbells_and_flat_bench'),
('ex_db_rear_delt_fly', 'Bent-over rear delt fly', 'reps', 'Hinge forward, sweep arms wide focusing on rear shoulders, not traps.', 'Rear Delts', 'dumbbells_and_flat_bench'),

-- Lower B
('ex_db_step_up', 'Bench step-up', 'reps', 'Place full foot on flat bench, drive through front leg without jumping off back foot.', 'Quads & Glutes', 'dumbbells_and_flat_bench'),
('ex_db_sumo_squat', 'Sumo squat with one dumbbell', 'reps', 'Wide stance, toes 45 degrees out, hold dumbbell vertical, open hips.', 'Adductors & Glutes', 'dumbbells_and_flat_bench'),
('ex_db_single_leg_rdl', 'Single-leg Romanian deadlift', 'reps', 'Hinge on standing leg, back leg rises straight back like a lever, keep hips square.', 'Hamstrings', 'dumbbells_and_flat_bench'),
('ex_db_reverse_lunge', 'Reverse lunge', 'reps', 'Step back smoothly, torso tall or slightly leaning for glutes, drive back up.', 'Quads & Glutes', 'dumbbells_and_flat_bench'),
('ex_db_single_leg_glute_bridge', 'Single-leg glute bridge (shoulders on bench)', 'reps', 'Upper back on bench, lift one foot, drive other heel into floor.', 'Glutes', 'dumbbells_and_flat_bench'),
('ex_db_single_leg_calf_raise', 'Single-leg calf raise holding a dumbbell', 'reps', 'Slow controlled reps on one leg, 1-sec peak squeeze.', 'Calves', 'dumbbells_and_flat_bench'),
('ex_db_lying_leg_raise', 'Lying leg raise on bench', 'reps', 'Lie flat holding bench behind head, raise legs without swinging, control eccentric.', 'Core', 'flat_bench'),

-- Safe Alternatives for Injuries / Equipment swaps
('ex_db_floor_press', 'Dumbbell floor press', 'reps', 'Upper arms tap floor gently at 90 degrees, relieving shoulder strain.', 'Chest', 'dumbbells_only'),
('ex_db_front_squat', 'Dumbbell front squat', 'reps', 'Dumbbells resting at anterior delts, upright spine.', 'Quads', 'dumbbells_only')
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  tip = excluded.tip,
  muscle_group = excluded.muscle_group;

-- ==============================================================================
-- 2. WORKOUT TEMPLATES SEED
-- ==============================================================================

insert into public.workout_templates (id, key, name, subtitle, type) values
('tmpl_ua', 'UA', 'Upper Body A', 'Dumbbell bench, one-arm row, shoulder press, fly, hammer curls, overhead triceps', 'upper'),
('tmpl_la', 'LA', 'Lower Body A', 'Goblet squats, RDL, Bulgarian split squats, hip thrusts, calves, plank', 'lower'),
('tmpl_ub', 'UB', 'Upper Body B', 'Neutral press, chest-supported row, Arnold press, lateral raises, triceps, curls, rear delts', 'upper'),
('tmpl_lb', 'LB', 'Lower Body B', 'Bench step-ups, sumo squats, single-leg RDL, reverse lunges, glute bridge, calves, leg raise', 'lower')
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  type = excluded.type;

-- ==============================================================================
-- 3. TEMPLATE EXERCISES SEED
-- ==============================================================================

delete from public.template_exercises;

-- Upper A (UA)
insert into public.template_exercises (template_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds) values
('tmpl_ua', 'ex_db_bench_press', 1, 4, 8, 12, 120),
('tmpl_ua', 'ex_db_one_arm_row', 2, 4, 8, 12, 90),
('tmpl_ua', 'ex_db_seated_shoulder_press', 3, 3, 8, 12, 90),
('tmpl_ua', 'ex_db_flat_fly', 4, 3, 12, 15, 60),
('tmpl_ua', 'ex_db_hammer_curl', 5, 3, 10, 12, 60),
('tmpl_ua', 'ex_db_overhead_triceps', 6, 3, 10, 12, 60);

-- Lower A (LA)
insert into public.template_exercises (template_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds) values
('tmpl_la', 'ex_db_goblet_squat', 1, 4, 10, 15, 90),
('tmpl_la', 'ex_db_rdl', 2, 4, 8, 12, 90),
('tmpl_la', 'ex_db_bulgarian_split_squat', 3, 3, 8, 12, 90),
('tmpl_la', 'ex_db_hip_thrust', 4, 3, 12, 15, 60),
('tmpl_la', 'ex_db_standing_calf_raise', 5, 4, 15, 20, 45),
('tmpl_la', 'ex_plank', 6, 3, 30, 45, 45);

-- Upper B (UB)
insert into public.template_exercises (template_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds) values
('tmpl_ub', 'ex_db_neutral_press', 1, 3, 10, 12, 90),
('tmpl_ub', 'ex_db_chest_supported_row', 2, 4, 10, 12, 90),
('tmpl_ub', 'ex_db_arnold_press', 3, 3, 10, 12, 90),
('tmpl_ub', 'ex_db_lateral_raise', 4, 3, 12, 15, 60),
('tmpl_ub', 'ex_db_lying_triceps', 5, 3, 10, 12, 60),
('tmpl_ub', 'ex_db_alt_bicep_curl', 6, 3, 10, 12, 60),
('tmpl_ub', 'ex_db_rear_delt_fly', 7, 3, 12, 15, 60);

-- Lower B (LB)
insert into public.template_exercises (template_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds) values
('tmpl_lb', 'ex_db_step_up', 1, 3, 10, 12, 90),
('tmpl_lb', 'ex_db_sumo_squat', 2, 4, 12, 15, 90),
('tmpl_lb', 'ex_db_single_leg_rdl', 3, 3, 10, 12, 60),
('tmpl_lb', 'ex_db_reverse_lunge', 4, 3, 10, 12, 90),
('tmpl_lb', 'ex_db_single_leg_glute_bridge', 5, 3, 10, 12, 60),
('tmpl_lb', 'ex_db_single_leg_calf_raise', 6, 3, 12, 15, 45),
('tmpl_lb', 'ex_db_lying_leg_raise', 7, 3, 10, 15, 45);

-- ==============================================================================
-- 4. EXERCISE ALTERNATIVES SEED
-- ==============================================================================

delete from public.exercise_alternatives;

insert into public.exercise_alternatives (exercise_id, alternative_id) values
-- Flat bench press alternatives
('ex_db_bench_press', 'ex_db_neutral_press'),
('ex_db_bench_press', 'ex_db_floor_press'),
('ex_db_neutral_press', 'ex_db_bench_press'),
('ex_db_neutral_press', 'ex_db_floor_press'),
-- Shoulder press alternatives
('ex_db_seated_shoulder_press', 'ex_db_arnold_press'),
('ex_db_arnold_press', 'ex_db_seated_shoulder_press'),
-- Squat alternatives
('ex_db_goblet_squat', 'ex_db_sumo_squat'),
('ex_db_goblet_squat', 'ex_db_front_squat'),
('ex_db_sumo_squat', 'ex_db_goblet_squat'),
-- RDL alternatives
('ex_db_rdl', 'ex_db_single_leg_rdl'),
('ex_db_single_leg_rdl', 'ex_db_rdl'),
-- Split squat / Lunge alternatives
('ex_db_bulgarian_split_squat', 'ex_db_reverse_lunge'),
('ex_db_bulgarian_split_squat', 'ex_db_step_up'),
('ex_db_reverse_lunge', 'ex_db_bulgarian_split_squat'),
('ex_db_step_up', 'ex_db_bulgarian_split_squat'),
-- Curls
('ex_db_hammer_curl', 'ex_db_alt_bicep_curl'),
('ex_db_alt_bicep_curl', 'ex_db_hammer_curl'),
-- Triceps
('ex_db_overhead_triceps', 'ex_db_lying_triceps'),
('ex_db_lying_triceps', 'ex_db_overhead_triceps');

-- ==============================================================================
-- 5. INDIAN FOODS SEED (Pure Vegetarian & Eggetarian - Plant and Dairy Based)
-- ==============================================================================

insert into public.foods (id, user_id, name, serving, protein_g, calories, diet, optional) values
-- High-Protein Vegetarian Core Staples
('food_paneer_raw', null, 'Paneer (Raw, Low Fat)', '100g', 22.0, 180, 'veg', false),
('food_paneer_regular', null, 'Paneer (Full Fat)', '100g', 18.0, 265, 'veg', false),
('food_soya_chunks_dry', null, 'Soya Chunks (Nutrela, Dry)', '50g', 26.0, 172, 'veg', false),
('food_soya_chunks_cooked', null, 'Soya Chunks (Boiled / Cooked)', '100g', 17.5, 125, 'veg', false),
('food_tofu_firm', null, 'Tofu (Firm)', '100g', 14.0, 120, 'veg', false),
('food_roasted_chana', null, 'Roasted Chana (Bhuna Chana)', '50g', 11.5, 185, 'veg', false),
('food_sattu', null, 'Sattu (Roasted Gram Flour)', '50g', 13.0, 205, 'veg', false),
('food_curd_dahi', null, 'Curd / Dahi (Homemade)', '100g', 3.5, 60, 'veg', false),
('food_greek_curd', null, 'Greek Yogurt / Hung Curd (Plain)', '100g', 9.0, 75, 'veg', false),
('food_toned_milk', null, 'Cow Milk (Toned)', '250ml (1 glass)', 8.0, 150, 'veg', false),
('food_sprouted_moong', null, 'Sprouted Moong (Raw)', '100g', 7.5, 90, 'veg', false),

-- Indian Dals & Legumes (Cooked)
('food_yellow_moong_dal', null, 'Yellow Moong Dal (Cooked)', '1 cup (200g)', 8.5, 140, 'veg', false),
('food_toor_dal', null, 'Toor / Arhar Dal (Cooked)', '1 cup (200g)', 8.0, 160, 'veg', false),
('food_masoor_dal', null, 'Masoor Dal (Cooked)', '1 cup (200g)', 9.0, 150, 'veg', false),
('food_chana_dal', null, 'Chana Dal (Cooked)', '1 cup (200g)', 10.0, 180, 'veg', false),
('food_rajma', null, 'Rajma / Kidney Beans (Cooked)', '1 cup (200g)', 9.5, 190, 'veg', false),
('food_chole', null, 'Chole / Chickpea Curry (Cooked)', '1 cup (200g)', 10.0, 210, 'veg', false),
('food_kala_chana', null, 'Kala Chana / Black Chickpeas (Cooked)', '1 cup (180g)', 11.0, 195, 'veg', false),

-- Chillas & Breakfast items
('food_besan_chilla', null, 'Besan Chilla with Veggies', '1 medium (60g)', 6.0, 120, 'veg', false),
('food_moong_chilla', null, 'Moong Dal Chilla', '1 medium (60g)', 7.5, 130, 'veg', false),
('food_poha', null, 'Poha with Peanuts & Veggies', '1 plate (200g)', 4.5, 230, 'veg', false),
('food_upma', null, 'Rava Upma with Veggies', '1 plate (200g)', 5.0, 220, 'veg', false),
('food_idli', null, 'Steamed Idli (Rice & Urad Dal)', '2 idlis (100g)', 4.0, 140, 'veg', false),
('food_dosa', null, 'Plain Dosa', '1 medium (80g)', 3.5, 160, 'veg', false),
('food_khichdi', null, 'Moong Dal Khichdi', '1 cup (200g)', 7.0, 180, 'veg', false),

-- Indian Dishes & Prepared Foods
('food_paneer_bhurji', null, 'Paneer Bhurji with Onion & Tomato', '150g', 16.0, 240, 'veg', false),
('food_soya_bhurji', null, 'Soya Granules Bhurji', '150g', 20.0, 190, 'veg', false),
('food_makhana', null, 'Roasted Foxnuts / Makhana', '30g', 3.0, 110, 'veg', false),
('food_soy_milk', null, 'Soy Milk (Unsweetened)', '250ml', 8.0, 95, 'veg', false),

-- Grains, Nuts, Seeds & Fruit
('food_roti', null, 'Roti / Chapati (Whole Wheat, No Ghee)', '1 medium (35g)', 3.2, 85, 'veg', false),
('food_brown_rice', null, 'Brown Rice (Cooked)', '1 cup (150g)', 4.0, 170, 'veg', false),
('food_white_rice', null, 'White Rice (Cooked)', '1 cup (150g)', 3.5, 180, 'veg', false),
('food_rolled_oats', null, 'Rolled Oats (Dry)', '50g', 6.5, 190, 'veg', false),
('food_peanut_butter', null, 'Peanut Butter (Natural, No Sugar)', '1 tbsp (32g)', 8.0, 190, 'veg', false),
('food_peanuts', null, 'Peanuts (Roasted Unsalted)', '30g', 7.5, 175, 'veg', false),
('food_almonds', null, 'Almonds (Raw)', '30g (~23 almonds)', 6.0, 170, 'veg', false),
('food_chia_seeds', null, 'Chia Seeds', '1 tbsp (15g)', 2.5, 75, 'veg', false),
('food_flaxseeds', null, 'Flaxseeds (Ground Roasted)', '1 tbsp (10g)', 2.0, 55, 'veg', false),
('food_banana', null, 'Banana (Ripe)', '1 medium (118g)', 1.3, 105, 'veg', false),

-- Egg Items (Marked diet='egg', completely hidden from veg users)
('food_egg_boiled_whole', null, 'Whole Egg (Hard Boiled)', '1 large (50g)', 6.3, 78, 'egg', false),
('food_egg_whites_boiled', null, 'Egg Whites (Boiled)', '2 large whites (66g)', 7.2, 34, 'egg', false),
('food_egg_omelette', null, 'Egg Omelette (2 Eggs, 1 tsp Oil)', '100g', 13.0, 180, 'egg', false),
('food_egg_bhurji', null, 'Egg Bhurji (2 Eggs, Onion, Tomato)', '120g', 13.5, 190, 'egg', false),

-- Protein Powders (Marked optional=true)
('food_whey_isolate', null, 'Whey Protein Isolate', '1 scoop (30g)', 27.0, 115, 'veg', true),
('food_whey_concentrate', null, 'Whey Protein Concentrate', '1 scoop (33g)', 24.0, 130, 'veg', true),
('food_plant_protein', null, 'Plant Protein Powder (Pea & Brown Rice)', '1 scoop (33g)', 25.0, 125, 'veg', true)

on conflict (id) do update set
  name = excluded.name,
  serving = excluded.serving,
  protein_g = excluded.protein_g,
  calories = excluded.calories,
  diet = excluded.diet,
  optional = excluded.optional;
