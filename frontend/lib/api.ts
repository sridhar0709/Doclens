const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_URL = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function sanitizeCurrency(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/Γé╣/g, "₹")
    .replace(/â‚¹/g, "₹")
    .replace(/\u00e2\u0082\u00b9/g, "₹")
    .replace(/ΓÇ╣/g, "₹")
    .replace(/ΓÇé/g, "₹")
    .replace(/â¹/g, "₹");
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

// --- Auth ---

export type LoginPayload = { email: string; password: string };
export type SignupPayload = { email: string; password: string; full_name: string };

// --- Profile / Intake ---

export type CitizenProfile = {
  full_name: string;
  age: number;
  gender: string;
  state: string;
  district: string;
  annual_income: number;
  occupation: string;
  social_category: string;
  disability_status: string;
  family_size: number;
  has_bpl_card: boolean;
  land_owned_acres: number;
  education_level: string;
  gov_id_available?: {
    aadhaar?: boolean;
    income_certificate?: boolean;
    caste_certificate?: boolean;
    ration_card?: boolean;
    [key: string]: boolean | undefined;
  };
};

export type SchemeResultType = {
  scheme_id: string;
  scheme_name: string;
  scheme_category: string;
  issuing_authority?: string;
  match_score?: number;
  eligibility_match_score?: number;
  benefit_summary: string;
  benefit_value_estimate?: string;
  missing_documents: string[];
  priority_rank?: number;
  application_url?: string;
  drafted_application_text?: string | null;
};

export type IntakeResponse = {
  request_id: string;
  eligible_schemes?: SchemeResultType[];
  ranked_schemes: SchemeResultType[];
  total_eligible_count?: number;
  missing_documents_summary: string[];
  processing_time_ms: number;
  processing_status?: string;
  error_message?: string;
  normalized_profile?: Record<string, any>;
};

export async function submitIntake(token: string, profile: CitizenProfile | Record<string, any>) {
  const cleanProfile = {
    full_name: profile.full_name || "Citizen Candidate",
    age: Number(profile.age) || 30,
    gender: profile.gender || "male",
    state: profile.state || "Uttar Pradesh",
    district: profile.district || "Varanasi",
    annual_income: Number(profile.annual_income) || 0,
    occupation: profile.occupation === "salaried_private" ? "salaried" : profile.occupation || "other",
    social_category: profile.social_category || "general",
    disability_status: profile.disability_status || "none",
    family_size: Number(profile.family_size) || 1,
    has_bpl_card: Boolean(profile.has_bpl_card),
    land_owned_acres: Number(profile.land_owned_acres) || 0,
    education_level:
      profile.education_level === "below_10th" || profile.education_level === "10th_pass"
        ? "secondary"
        : profile.education_level === "12th_pass"
        ? "higher_secondary"
        : profile.education_level === "post_graduate"
        ? "postgraduate"
        : profile.education_level || "graduate",
    gov_id_available: {
      aadhaar: Boolean(profile.gov_id_available?.aadhaar),
      income_certificate: Boolean(profile.gov_id_available?.income_certificate),
      caste_certificate: Boolean(profile.gov_id_available?.caste_certificate),
      ration_card: Boolean(profile.gov_id_available?.ration_card),
    },
  };

  return fetchApi<IntakeResponse>("/api/intake", {
    method: "POST",
    body: JSON.stringify(cleanProfile),
    token,
  });
}

// --- Schemes ---

export type Scheme = {
  id: string;
  scheme_id: string;
  scheme_name: string;
  scheme_category: string;
  issuing_authority: string;
  benefit_summary: string;
  benefit_value_estimate: string;
  application_url: string;
  required_documents: string[];
  is_active: boolean;
  eligibility_rules: Record<string, unknown>;
};

function rawSchemeToScheme(s: Record<string, unknown>): Scheme {
  return {
    id: (s.scheme_id as string) || (s.id as string) || "",
    scheme_id: (s.scheme_id as string) || (s.id as string) || "",
    scheme_name: sanitizeCurrency((s.scheme_name as string) || ""),
    scheme_category: (s.scheme_category as string) || "",
    issuing_authority: sanitizeCurrency((s.issuing_authority as string) || ""),
    benefit_summary: sanitizeCurrency((s.benefit_summary as string) || ""),
    benefit_value_estimate: sanitizeCurrency((s.benefit_value_estimate as string) || ""),
    application_url: (s.application_url as string) || "",
    required_documents: (s.required_documents as string[]) || [],
    is_active: (s.is_active as boolean) ?? true,
    eligibility_rules: (s.eligibility_rules as Record<string, unknown>) || {},
  };
}

function filterSchemes(schemes: Scheme[], query?: string): Scheme[] {
  if (!query) return schemes;
  const q = query.toLowerCase();
  return schemes.filter(
    (s) =>
      s.scheme_name.toLowerCase().includes(q) ||
      s.benefit_summary.toLowerCase().includes(q) ||
      s.scheme_category.toLowerCase().includes(q) ||
      s.issuing_authority.toLowerCase().includes(q)
  );
}

export async function searchSchemes(query?: string, page = 1, pageSize = 60): Promise<Scheme[]> {
  // 1. Backend API (falls through if not available)
  try {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    return await fetchApi<Scheme[]>(`/api/schemes/search${qs}`);
  } catch { /* fall through */ }

  // 2. Supabase with explicit pagination
  try {
    const { supabase: sb } = await import("@/lib/supabase");
    if (!sb) throw new Error("Supabase not configured");
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = sb.from("schemes").select("*").eq("is_active", true);
    if (query) {
      q = q.or(`scheme_name.ilike.%${query}%,scheme_category.ilike.%${query}%,issuing_authority.ilike.%${query}%,benefit_summary.ilike.%${query}%`);
    }
    const { data, error } = await q.order("scheme_name").range(from, to);
    if (error) throw error;
    return (data || []).map(rawSchemeToScheme);
  } catch { /* fall through */ }
  return [];
}

/** Fetches ALL schemes across multiple pages (bypasses Supabase 1000-row limit) */
export async function fetchAllSchemes(): Promise<{ schemes: Scheme[]; total: number }> {
  try {
    const { supabase: sb } = await import("@/lib/supabase");
    if (!sb) throw new Error("Supabase not configured");
    // First get count
    const { count } = await sb.from("schemes").select("*", { count: "exact", head: true }).eq("is_active", true);
    const total = count ?? 0;
    const pageSize = 1000;
    const pages = Math.ceil(total / pageSize);
    const results: Scheme[] = [];
    for (let p = 0; p < pages; p++) {
      const { data, error } = await sb
        .from("schemes")
        .select("*")
        .eq("is_active", true)
        .order("scheme_name")
        .range(p * pageSize, (p + 1) * pageSize - 1);
      if (error) break;
      results.push(...(data || []).map(rawSchemeToScheme));
    }
    return { schemes: results, total };
  } catch { return { schemes: [], total: 0 }; }
}


// --- Documents ---

export type UserDocument = {
  id: string;
  doc_type: string;
  storage_path: string;
  verification_status: "pending" | "verified" | "rejected";
  extracted_data?: Record<string, string>;
  extraction_confidence?: number;
  uploaded_at: string;
};

export async function uploadDocument(token: string, file: File, docType: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_type", docType);

  const headers: Record<string, string> = {};
  headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/documents/upload`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return res.json();
}

export async function listDocuments(token: string): Promise<UserDocument[]> {
  try {
    return await fetchApi<UserDocument[]>("/api/documents", { token });
  } catch {
    try {
      const { supabase: sb } = await import("@/lib/supabase");
      if (!sb) throw new Error("Supabase not configured");
      const { data, error } = await sb
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        doc_type: d.doc_type as string,
        storage_path: d.storage_path as string,
        verification_status: (d.verification_status as UserDocument["verification_status"]) || "pending",
        extracted_data: d.extracted_data as Record<string, string> | undefined,
        extraction_confidence: d.extraction_confidence as number | undefined,
        uploaded_at: d.uploaded_at as string,
      }));
    } catch {
      return [];
    }
  }
}

export async function confirmDocument(token: string, docId: string, confirmedData: any = {}) {
  return fetchApi<{ status: string }>(`/api/documents/${docId}/confirm`, {
    method: "POST",
    token,
    body: JSON.stringify(confirmedData),
  });
}

// --- Notifications ---

export type Notification = {
  id: string;
  type: "new_match" | "doc_missing_reminder" | "scheme_updated";
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(token: string): Promise<Notification[]> {
  try {
    return await fetchApi<Notification[]>("/api/notifications", { token });
  } catch {
    try {
      const { supabase: sb } = await import("@/lib/supabase");
      if (!sb) throw new Error("Supabase not configured");
      const { data, error } = await sb
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        type: n.type as Notification["type"],
        payload: n.payload as Record<string, unknown>,
        read_at: n.read_at as string | null,
        created_at: n.created_at as string,
      }));
    } catch {
      return [];
    }
  }
}

export async function markNotificationRead(token: string, id: string) {
  return fetchApi<{ status: string }>(`/api/notifications/${id}/read`, {
    method: "POST",
    token,
  });
}

// --- Eligibility Matches (Dashboard) ---

export type EligibilityMatch = {
  id: string;
  scheme_id: string;
  scheme_name: string;
  scheme_category: string;
  issuing_authority: string;
  match_score: number;
  benefit_summary: string;
  benefit_value_estimate: string;
  missing_documents: string[];
  priority_rank: number;
  application_url: string;
  matched_at: string;
  application_status?: "matched" | "drafted" | "applied" | "approved" | "rejected";
};

export async function getUserMatches(token: string): Promise<EligibilityMatch[]> {
  let matches: EligibilityMatch[] = [];
  try {
    const res = await fetch(`${API_URL}/api/matches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ranked_schemes) matches = data.ranked_schemes;
      else if (data.eligible_schemes) matches = data.eligible_schemes;
      else if (Array.isArray(data)) matches = data;
    }
  } catch { /* fall through */ }

  if (matches.length === 0) {
    try {
      const { supabase: sb } = await import("@/lib/supabase");
      if (!sb) throw new Error("Supabase not configured");
      const { data, error } = await sb
        .from("eligibility_matches")
        .select("*, schemes(*), applications(*)")
        .order("priority_rank", { ascending: true });

      if (error) throw error;

      matches = (data || []).map((row: Record<string, unknown>) => {
        const scheme = row.schemes as Record<string, unknown> || {};
        const app = (row.applications as Record<string, unknown>[])?.[0];
        return {
          id: row.id as string,
          scheme_id: (scheme.scheme_id as string) || (row.scheme_id as string) || "",
          scheme_name: (scheme.scheme_name as string) || "",
          scheme_category: (scheme.scheme_category as string) || "",
          issuing_authority: (scheme.issuing_authority as string) || "",
          match_score: (row.match_score as number) || 0.0,
          benefit_summary: (scheme.benefit_summary as string) || "",
          benefit_value_estimate: (scheme.benefit_value_estimate as string) || "",
          missing_documents: (row.missing_documents as string[]) || [],
          priority_rank: (row.priority_rank as number) || 1,
          application_url: (scheme.application_url as string) || "",
          matched_at: (row.matched_at as string) || "",
          application_status: (app?.status as EligibilityMatch["application_status"]) || "matched",
        };
      });
    } catch {
      matches = [];
    }
  }

  return matches.map((m) => ({
    ...m,
    scheme_name: sanitizeCurrency(m.scheme_name),
    issuing_authority: sanitizeCurrency(m.issuing_authority),
    benefit_summary: sanitizeCurrency(m.benefit_summary),
    benefit_value_estimate: sanitizeCurrency(m.benefit_value_estimate),
  }));
}

export type RefreshMatchesResult = {
  status: string;
  eligible_count?: number;
  last_refreshed?: string;
  message?: string;
  error?: string;
  retry_after_seconds?: number;
};

export async function refreshUserMatches(token: string): Promise<RefreshMatchesResult> {
  try {
    const res = await fetch(`${API_URL}/api/matches/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        status: "error",
        error: data.error || data.error_code || "failed",
        message: data.message || data.error_message || "Failed to refresh matches",
        retry_after_seconds: data.retry_after_seconds,
        last_refreshed: data.last_refreshed,
      };
    }
    return data;
  } catch (err) {
    return {
      status: "error",
      error: "network_error",
      message: "Network error while refreshing matches.",
    };
  }
}

// --- Chat Q&A ---

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  reply: string;
  sources: string[];
};

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }
  return res.json();
}
