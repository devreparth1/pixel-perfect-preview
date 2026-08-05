-- User Activity Tracking for Personalization
BEGIN;

-- Create user_activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,          -- 'page_view', 'feature_use', 'interaction', 'search', 'meal_log', etc.
  event_name TEXT NOT NULL,          -- specific event: 'viewed_recipes', 'used_scanner', 'searched_food', etc.
  event_data JSONB DEFAULT '{}'::jsonb, -- flexible payload (page path, search query, recipe id, etc.)
  page_path TEXT,                    -- the route/path where the event occurred
  session_id TEXT,                   -- groups events within a single session
  duration_ms INTEGER DEFAULT 0,    -- time spent on page/feature in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_event_type ON public.user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_event ON public.user_activity(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_page_path ON public.user_activity(page_path);

-- Row Level Security
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only read their own activity
CREATE POLICY "users_read_own_activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "users_insert_own_activity" ON public.user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a view for user activity summaries (most visited pages, most used features)
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT
  user_id,
  event_type,
  event_name,
  COUNT(*) as event_count,
  MAX(created_at) as last_occurred,
  AVG(duration_ms) as avg_duration_ms
FROM public.user_activity
GROUP BY user_id, event_type, event_name;

-- Create a function to get personalization insights for a user
CREATE OR REPLACE FUNCTION public.get_user_insights(target_user_id UUID)
RETURNS TABLE (
  category TEXT,
  insight_key TEXT,
  insight_value TEXT,
  score NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY

  -- Most visited pages
  SELECT
    'top_pages'::TEXT as category,
    ua.page_path as insight_key,
    ua.event_name as insight_value,
    COUNT(*)::NUMERIC as score
  FROM public.user_activity ua
  WHERE ua.user_id = target_user_id
    AND ua.event_type = 'page_view'
    AND ua.created_at > NOW() - INTERVAL '30 days'
  GROUP BY ua.page_path, ua.event_name
  ORDER BY score DESC
  LIMIT 5

  UNION ALL

  -- Most used features
  SELECT
    'top_features'::TEXT as category,
    ua.event_name as insight_key,
    COALESCE(ua.event_data->>'detail', ua.event_name) as insight_value,
    COUNT(*)::NUMERIC as score
  FROM public.user_activity ua
  WHERE ua.user_id = target_user_id
    AND ua.event_type = 'feature_use'
    AND ua.created_at > NOW() - INTERVAL '30 days'
  GROUP BY ua.event_name, ua.event_data->>'detail'
  ORDER BY score DESC
  LIMIT 5

  UNION ALL

  -- Recent searches
  SELECT
    'recent_searches'::TEXT as category,
    ua.event_data->>'query' as insight_key,
    ua.page_path as insight_value,
    1::NUMERIC as score
  FROM public.user_activity ua
  WHERE ua.user_id = target_user_id
    AND ua.event_type = 'search'
    AND ua.created_at > NOW() - INTERVAL '7 days'
  ORDER BY ua.created_at DESC
  LIMIT 10;
END;
$$;

COMMIT;