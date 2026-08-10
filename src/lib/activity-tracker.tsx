import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventType = "page_view" | "feature_use" | "interaction" | "search" | "meal_log" | "preference";

export interface TrackEventParams {
  eventType: EventType;
  eventName: string;
  eventData?: Record<string, unknown>;
  pagePath?: string;
  durationMs?: number;
}

export interface UserInsight {
  category: string;
  insight_key: string;
  insight_value: string;
  score: number;
}

export interface ActivityContextType {
  trackEvent: (params: TrackEventParams) => void;
  trackPageView: (pagePath: string, pageName: string) => void;
  trackFeatureUse: (featureName: string, detail?: Record<string, unknown>) => void;
  trackSearch: (query: string, pagePath?: string) => void;
  trackInteraction: (elementName: string, action: string, detail?: Record<string, unknown>) => void;
  getInsights: () => Promise<UserInsight[]>;
  getRecentActivity: (limit?: number) => Promise<any[]>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// ─── Session ID Generator ────────────────────────────────────────────────────

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Event Queue (batch inserts for performance) ─────────────────────────────

interface QueuedEvent {
  user_id: string;
  event_type: string;
  event_name: string;
  event_data: Record<string, unknown>;
  page_path: string;
  session_id: string;
  duration_ms: number;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(generateSessionId());
  const eventQueueRef = useRef<QueuedEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageEntryTimeRef = useRef<number>(Date.now());

  // Flush queued events to Supabase
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      await supabase.from("user_activity").insert(events as never);
    } catch (err) {
      // If insert fails, re-queue events (up to a limit to prevent memory leaks)
      if (eventQueueRef.current.length < 100) {
        eventQueueRef.current = [...events, ...eventQueueRef.current];
      }
      console.error("[ActivityTracker] Failed to flush events:", err);
    }
  }, []);

  // Schedule a flush (debounced - flushes every 5 seconds or when queue hits 10)
  const scheduleFlush = useCallback(() => {
    if (eventQueueRef.current.length >= 10) {
      flushEvents();
      return;
    }
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flushEvents, 5000);
  }, [flushEvents]);

  // Flush on unmount or page unload
  useEffect(() => {
    const handleUnload = () => {
      // Flush through the configured Supabase client (sendBeacon can't carry the
      // user's bearer token, so it would be rejected by RLS / api key checks).
      if (eventQueueRef.current.length > 0 && user) {
        void flushEvents();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushEvents();
    };
  }, [user, flushEvents]);

  // ─── Track Event (core) ──────────────────────────────────────────────────

  const trackEvent = useCallback(
    (params: TrackEventParams) => {
      if (!user) return;

      const event: QueuedEvent = {
        user_id: user.id,
        event_type: params.eventType,
        event_name: params.eventName,
        event_data: params.eventData || {},
        page_path: params.pagePath || window.location.pathname,
        session_id: sessionIdRef.current,
        duration_ms: params.durationMs || 0,
      };

      eventQueueRef.current.push(event);
      scheduleFlush();
    },
    [user, scheduleFlush]
  );

  // ─── Convenience Methods ─────────────────────────────────────────────────

  const trackPageView = useCallback(
    (pagePath: string, pageName: string) => {
      // Calculate duration on previous page
      const now = Date.now();
      const duration = now - pageEntryTimeRef.current;
      pageEntryTimeRef.current = now;

      trackEvent({
        eventType: "page_view",
        eventName: pageName,
        pagePath,
        durationMs: duration > 500 ? duration : 0, // ignore very short durations (initial load)
      });
    },
    [trackEvent]
  );

  const trackFeatureUse = useCallback(
    (featureName: string, detail?: Record<string, unknown>) => {
      trackEvent({
        eventType: "feature_use",
        eventName: featureName,
        eventData: detail ? { detail: JSON.stringify(detail), ...detail } : {},
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (query: string, pagePath?: string) => {
      trackEvent({
        eventType: "search",
        eventName: "search_query",
        eventData: { query },
        pagePath,
      });
    },
    [trackEvent]
  );

  const trackInteraction = useCallback(
    (elementName: string, action: string, detail?: Record<string, unknown>) => {
      trackEvent({
        eventType: "interaction",
        eventName: `${elementName}_${action}`,
        eventData: { element: elementName, action, ...detail },
      });
    },
    [trackEvent]
  );

  // ─── Insights & History ──────────────────────────────────────────────────

  const getInsights = useCallback(async (): Promise<UserInsight[]> => {
    if (!user) return [];
    const { data, error } = await supabase.rpc("get_user_insights", {
      target_user_id: user.id,
    });
    if (error) {
      console.error("[ActivityTracker] Failed to get insights:", error);
      return [];
    }
    return (data as UserInsight[]) || [];
  }, [user]);

  const getRecentActivity = useCallback(
    async (limit = 20) => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        console.error("[ActivityTracker] Failed to get recent activity:", error);
        return [];
      }
      return data || [];
    },
    [user]
  );

  return (
    <ActivityContext.Provider
      value={{
        trackEvent,
        trackPageView,
        trackFeatureUse,
        trackSearch,
        trackInteraction,
        getInsights,
        getRecentActivity,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}

// ─── Auto Page View Hook (use in route components) ───────────────────────────

export function useTrackPageView(pageName: string) {
  const { trackPageView } = useActivity();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current) {
      trackPageView(window.location.pathname, pageName);
      trackedRef.current = true;
    }
  }, [pageName, trackPageView]);
}