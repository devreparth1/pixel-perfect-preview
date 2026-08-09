// Single Supabase client for the whole app. The generated client owns env wiring
// and auth storage; re-exported here so existing imports keep working.
export { supabase } from "@/integrations/supabase/client";

export const isSupabaseConfigured = true;
