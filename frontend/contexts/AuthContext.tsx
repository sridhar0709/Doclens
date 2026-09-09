"use client";

import { createContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const CONFIG_ERR = "Supabase not configured. Contact the administrator.";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, redirectPath?: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    profileData?: Record<string, any>
  ) => Promise<{ error?: string; data?: { user: User | null; session: Session | null } }>;
  signOut: (redirectPath?: string) => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: undefined }),
  signUp: async () => ({ error: undefined, data: undefined }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const ensureUserProfile = useCallback(async (currentUser: User) => {
    if (!supabase) return;
    try {
      // Server-side check: confirm session validity and prevent stale/forged identity injection
      const { data: { user: verifiedUser }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !verifiedUser || verifiedUser.id !== currentUser.id) {
        console.warn("User session verification failed for self-healing.");
        return;
      }

      // Check if profile exists and has all fields filled
      const { data: profile, error } = await supabase
        .from("citizen_profiles")
        .select("*")
        .eq("user_id", verifiedUser.id)
        .eq("is_current", true)
        .maybeSingle();

      const isProfileIncomplete = !profile ||
        !profile.state ||
        !profile.district ||
        profile.annual_income === null ||
        !profile.occupation ||
        !profile.social_category ||
        profile.age === null;

      if (isProfileIncomplete && !error) {
        const meta = verifiedUser.user_metadata;
        if (meta && (meta.full_name || meta.state)) {
          const payload = {
            user_id: verifiedUser.id,
            full_name: meta.full_name || profile?.full_name || "",
            age: meta.age !== undefined ? parseInt(meta.age) : (profile?.age || 0),
            gender: meta.gender || profile?.gender || "other",
            state: meta.state || profile?.state || "",
            district: meta.district || profile?.district || "",
            annual_income: meta.annual_income !== undefined ? parseFloat(meta.annual_income) : (profile?.annual_income || 0),
            occupation: meta.occupation || profile?.occupation || "other",
            social_category: meta.social_category || profile?.social_category || "general",
            disability_status: meta.disability_status || profile?.disability_status || "none",
            family_size: meta.family_size !== undefined ? parseInt(meta.family_size) : (profile?.family_size || 1),
            has_bpl_card: meta.has_bpl_card === true || meta.has_bpl_card === "true" || !!profile?.has_bpl_card,
            land_owned_acres: meta.land_owned_acres !== undefined ? parseFloat(meta.land_owned_acres) : (profile?.land_owned_acres || 0),
            education_level: meta.education_level || profile?.education_level || "other",
            is_current: true,
          };
          await supabase.from("citizen_profiles").upsert(payload, { onConflict: "user_id" });
        }
      }
    } catch (e) {
      console.error("Error in ensureUserProfile self-healing:", e);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user ?? null);
          if (data.session.user) {
            await ensureUserProfile(data.session.user);
          }
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user ?? null);
        if (session.user) {
          await ensureUserProfile(session.user);
        }
      } else {
        setSession(null);
        setUser(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [ensureUserProfile]);

  const signIn = useCallback(async (email: string, password: string, redirectPath?: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: CONFIG_ERR };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      const target = redirectPath || "/dashboard";
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.href = target;
      } else {
        router.push(target);
      }
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : CONFIG_ERR };
    }
  }, [router]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    profileData?: Record<string, any>
  ): Promise<{ error?: string; data?: { user: User | null; session: Session | null } }> => {
    if (!supabase) return { error: CONFIG_ERR };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...profileData,
          },
        },
      });
      if (error) return { error: error.message };
      return { data };
    } catch (e) {
      return { error: e instanceof Error ? e.message : CONFIG_ERR };
    }
  }, []);

  const signOut = useCallback(async (redirectPath?: string) => {
    setUser(null);
    setSession(null);
    
    // Forcibly clear all Supabase client-side cookies to prevent middleware auto-login bypass
    if (typeof document !== "undefined") {
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name.startsWith("sb-")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch { /* ignore */ }
    }
    const target = redirectPath || "/";
    if (typeof window !== "undefined") {
      window.location.href = target;
    } else {
      router.push(target);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
