CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_path TEXT,
  session_id TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_select_own" ON public.user_activity FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "activity_insert_own" ON public.user_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS activity_user_created_idx ON public.user_activity(user_id, created_at DESC);

-- SECURITY INVOKER: row-level security still applies, so callers only ever see
-- their own activity even if they pass another id.
CREATE OR REPLACE FUNCTION public.get_user_insights(target_user_id UUID)
RETURNS TABLE (category TEXT, insight_key TEXT, insight_value TEXT, score NUMERIC)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  (SELECT 'top_pages'::TEXT, ua.page_path, ua.event_name, COUNT(*)::NUMERIC
     FROM public.user_activity ua
    WHERE ua.user_id = target_user_id AND ua.event_type = 'page_view'
      AND ua.created_at > now() - INTERVAL '30 days'
    GROUP BY ua.page_path, ua.event_name ORDER BY 4 DESC LIMIT 5)
  UNION ALL
  (SELECT 'top_features'::TEXT, ua.event_name, COALESCE(ua.event_data->>'detail', ua.event_name), COUNT(*)::NUMERIC
     FROM public.user_activity ua
    WHERE ua.user_id = target_user_id AND ua.event_type = 'feature_use'
      AND ua.created_at > now() - INTERVAL '30 days'
    GROUP BY ua.event_name, ua.event_data->>'detail' ORDER BY 4 DESC LIMIT 5)
  UNION ALL
  (SELECT 'recent_searches'::TEXT, ua.event_data->>'query', ua.page_path, 1::NUMERIC
     FROM public.user_activity ua
    WHERE ua.user_id = target_user_id AND ua.event_type = 'search'
      AND ua.created_at > now() - INTERVAL '7 days'
    ORDER BY ua.created_at DESC LIMIT 10);
$$;