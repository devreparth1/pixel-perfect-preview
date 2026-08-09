-- =====================  PROFILES  =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  age INTEGER,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  activity_level TEXT NOT NULL DEFAULT 'moderate',
  goal TEXT NOT NULL DEFAULT 'maintain',
  diet TEXT NOT NULL DEFAULT 'omnivore',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

-- =====================  RECIPES  =====================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NOT NULL DEFAULT 0,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  prep_minutes INTEGER NOT NULL DEFAULT 0,
  cook_minutes INTEGER NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  cuisine TEXT NOT NULL DEFAULT 'international',
  meal_type TEXT NOT NULL DEFAULT 'dinner',
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_read" ON public.recipes FOR SELECT TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "recipes_insert_own" ON public.recipes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update_own" ON public.recipes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_delete_own" ON public.recipes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS recipes_user_idx ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS recipes_meal_type_idx ON public.recipes(meal_type);

-- =====================  MEAL LOGS  =====================
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0 CHECK (calories >= 0),
  protein NUMERIC NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs NUMERIC NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat NUMERIC NOT NULL DEFAULT 0 CHECK (fat >= 0),
  fiber NUMERIC NOT NULL DEFAULT 0 CHECK (fiber >= 0),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;
GRANT ALL ON public.meal_logs TO service_role;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_logs_own" ON public.meal_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS meal_logs_user_date_idx ON public.meal_logs(user_id, log_date DESC);

-- =====================  WATER LOGS  =====================
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  amount_ml INTEGER NOT NULL CHECK (amount_ml <> 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_logs_own" ON public.water_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS water_logs_user_date_idx ON public.water_logs(user_id, log_date DESC);

-- =====================  WEIGHT LOGS  =====================
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 20 AND weight_kg < 400),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weight_logs_own" ON public.weight_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS weight_logs_user_date_idx ON public.weight_logs(user_id, log_date DESC);

-- =====================  FAVORITES  =====================
CREATE TABLE IF NOT EXISTS public.recipe_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_favorites TO authenticated;
GRANT ALL ON public.recipe_favorites TO service_role;
ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.recipe_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================  MEAL PLAN ITEMS  =====================
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  meal_type TEXT NOT NULL DEFAULT 'dinner',
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_items TO authenticated;
GRANT ALL ON public.meal_plan_items TO service_role;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_plan_items_own" ON public.meal_plan_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS meal_plan_user_date_idx ON public.meal_plan_items(user_id, plan_date);

-- =====================  STARTER RECIPE LIBRARY  =====================
INSERT INTO public.recipes (user_id, name, description, calories, protein, carbs, fat, fiber, ingredients, instructions, prep_minutes, cook_minutes, servings, difficulty, dietary_tags, cuisine, meal_type)
VALUES
(NULL, 'Miso-Glazed Salmon', 'Umami-rich salmon fillet with a caramelised miso glaze, served with greens.', 480, 42, 18, 26, 3,
 '["150 g salmon fillet","1 tbsp white miso paste","1 tsp honey","1 tsp rice vinegar","1 tsp sesame oil","150 g pak choi","1 tsp sesame seeds"]',
 '["Whisk miso, honey, vinegar and sesame oil into a glaze.","Brush the salmon and rest for 10 minutes.","Roast at 200C for 12-14 minutes until just cooked.","Steam the pak choi for 3 minutes.","Plate and finish with sesame seeds."]',
 10, 15, 1, 'easy', '{"high-protein","pescatarian","gluten-free"}', 'japanese', 'dinner'),
(NULL, 'Chicken Quinoa Power Bowl', 'Balanced bowl with grilled chicken, quinoa, roast veg and lemon tahini.', 520, 44, 48, 16, 8,
 '["150 g chicken breast","70 g quinoa, uncooked","100 g cherry tomatoes","80 g courgette","1 tbsp tahini","1 tbsp lemon juice","1 tsp olive oil"]',
 '["Cook the quinoa in salted water for 12 minutes and fluff.","Season and grill the chicken 6 minutes per side, then slice.","Roast tomatoes and courgette with olive oil at 200C for 15 minutes.","Thin tahini with lemon juice and water.","Assemble the bowl and drizzle with dressing."]',
 15, 20, 1, 'easy', '{"high-protein","balanced","gluten-free"}', 'mediterranean', 'lunch'),
(NULL, 'Crispy Tofu Stir-Fry', 'Fast weeknight vegan stir-fry with crisp tofu and rainbow vegetables.', 410, 28, 34, 18, 7,
 '["200 g firm tofu","1 tbsp cornflour","1 tbsp soy sauce","1 tsp maple syrup","1 clove garlic","150 g mixed peppers","80 g broccoli","1 tsp sesame oil"]',
 '["Press the tofu, cube it and toss in cornflour.","Pan-fry in sesame oil until golden on all sides.","Stir-fry garlic, peppers and broccoli for 4 minutes.","Add soy sauce and maple syrup, return the tofu and toss.","Serve immediately."]',
 15, 12, 1, 'easy', '{"vegan","vegetarian","high-protein"}', 'asian', 'dinner'),
(NULL, 'Greek Yogurt Berry Parfait', 'Five-minute high-protein breakfast layered with berries and toasted oats.', 320, 24, 34, 8, 6,
 '["200 g Greek yogurt 0%","80 g mixed berries","30 g rolled oats","1 tsp honey","10 g flaked almonds"]',
 '["Toast the oats and almonds in a dry pan for 3 minutes.","Layer yogurt, berries and oats in a glass.","Repeat the layers and finish with honey."]',
 5, 3, 1, 'easy', '{"vegetarian","high-protein","breakfast"}', 'international', 'breakfast'),
(NULL, 'Turkey & Bean Chilli', 'Batch-cook chilli that freezes well and packs serious protein and fibre.', 460, 38, 42, 14, 12,
 '["400 g turkey mince 5%","400 g chopped tomatoes","240 g kidney beans, drained","1 onion","1 red pepper","2 tsp smoked paprika","1 tsp cumin","1 tsp olive oil"]',
 '["Soften onion and pepper in olive oil for 5 minutes.","Add the turkey mince and brown well.","Stir in spices, tomatoes and beans.","Simmer for 25 minutes until thickened.","Season and divide into 4 portions."]',
 15, 30, 4, 'medium', '{"high-protein","meal-prep","gluten-free"}', 'mexican', 'dinner'),
(NULL, 'Protein Overnight Oats', 'Prep-ahead oats that thicken overnight for a grab-and-go breakfast.', 380, 26, 46, 10, 8,
 '["50 g rolled oats","1 scoop vanilla whey or plant protein","150 ml milk of choice","80 g Greek yogurt","1 tsp chia seeds","1/2 banana"]',
 '["Stir oats, protein, chia, milk and yogurt together.","Cover and refrigerate overnight.","Top with sliced banana before eating."]',
 5, 0, 1, 'easy', '{"vegetarian","high-protein","breakfast","meal-prep"}', 'international', 'breakfast'),
(NULL, 'Lentil & Spinach Dal', 'Comforting low-cost vegan dal, high in fibre and plant protein.', 350, 20, 48, 8, 14,
 '["150 g red lentils","1 onion","2 cloves garlic","1 tsp ginger","1 tsp turmeric","1 tsp garam masala","100 g spinach","400 ml water"]',
 '["Fry onion, garlic and ginger until soft.","Add spices and cook for 1 minute.","Add lentils and water, simmer 20 minutes.","Stir through spinach until wilted and season."]',
 10, 25, 2, 'easy', '{"vegan","vegetarian","high-fibre","low-calorie"}', 'indian', 'dinner'),
(NULL, 'Egg White Veggie Omelette', 'Light, low-calorie omelette that still delivers 30 g of protein.', 240, 30, 8, 9, 3,
 '["200 ml egg whites","1 whole egg","60 g mushrooms","40 g spinach","20 g feta","1 tsp olive oil"]',
 '["Sauté mushrooms and spinach in olive oil.","Whisk the eggs and pour over the vegetables.","Cook gently for 4 minutes, scatter feta and fold."]',
 5, 8, 1, 'easy', '{"high-protein","low-calorie","vegetarian","gluten-free"}', 'international', 'breakfast'),
(NULL, 'Cottage Cheese Snack Bowl', 'Two-minute snack with 25 g protein to bridge the gap between meals.', 210, 25, 12, 6, 2,
 '["200 g cottage cheese","60 g pineapple or peach","10 g pumpkin seeds","Pinch of cinnamon"]',
 '["Spoon cottage cheese into a bowl.","Top with fruit, seeds and cinnamon."]',
 2, 0, 1, 'easy', '{"high-protein","vegetarian","snack","low-calorie"}', 'international', 'snack'),
(NULL, 'Beef & Broccoli Rice Bowl', 'Lean steak strips with broccoli and jasmine rice for a post-training refuel.', 610, 46, 62, 18, 6,
 '["150 g lean beef strips","70 g jasmine rice, uncooked","150 g broccoli","1 tbsp soy sauce","1 tsp sesame oil","1 clove garlic","1 tsp cornflour"]',
 '["Cook the rice according to the packet.","Sear the beef in sesame oil for 2 minutes.","Add garlic and broccoli with a splash of water and cover 3 minutes.","Stir soy sauce with cornflour, add and thicken.","Serve over the rice."]',
 10, 18, 1, 'medium', '{"high-protein","post-workout"}', 'asian', 'dinner'),
(NULL, 'Chickpea Mediterranean Salad', 'No-cook lunch with chickpeas, cucumber, olives and herbs.', 390, 16, 44, 16, 12,
 '["240 g chickpeas, drained","100 g cucumber","100 g cherry tomatoes","30 g olives","20 g red onion","1 tbsp olive oil","1 tbsp lemon juice","Fresh parsley"]',
 '["Chop all the vegetables.","Toss with chickpeas, olive oil and lemon juice.","Season generously and finish with parsley."]',
 10, 0, 2, 'easy', '{"vegan","vegetarian","high-fibre","lunch"}', 'mediterranean', 'lunch'),
(NULL, 'Banana Protein Pancakes', 'Three-ingredient pancakes with 30 g protein for a weekend breakfast.', 420, 30, 48, 12, 5,
 '["1 banana","2 eggs","1 scoop vanilla protein powder","30 g oats","1 tsp baking powder","1 tsp coconut oil"]',
 '["Blend banana, eggs, protein, oats and baking powder.","Rest the batter 5 minutes.","Cook small pancakes in coconut oil, 2 minutes per side."]',
 5, 10, 1, 'easy', '{"high-protein","vegetarian","breakfast"}', 'international', 'breakfast');