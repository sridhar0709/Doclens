export type CategoryKey =
  | "all"
  | "agriculture"
  | "education"
  | "health"
  | "housing"
  | "pension"
  | "women_child"
  | "livelihood"
  | "scholarship"
  | "financial_inclusion"
  | "disability"
  | "other";

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: string;
  badge: string;
  border: string;
  glow: string;
  bg: string;
  text: string;
}

export const CATEGORY_LIST: CategoryInfo[] = [
  {
    key: "all",
    label: "All",
    icon: "🏛️",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    border: "border-l-slate-400",
    glow: "hover:shadow-slate-100",
    bg: "bg-slate-50",
    text: "text-slate-700",
  },
  {
    key: "agriculture",
    label: "Agriculture",
    icon: "🌾",
    badge: "bg-green-50 text-green-700 border-green-200",
    border: "border-l-green-400",
    glow: "hover:shadow-green-100",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  {
    key: "education",
    label: "Education",
    icon: "🎓",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    border: "border-l-cyan-400",
    glow: "hover:shadow-cyan-100",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  {
    key: "health",
    label: "Health",
    icon: "🏥",
    badge: "bg-rose-50 text-rose-600 border-rose-200",
    border: "border-l-rose-400",
    glow: "hover:shadow-rose-100",
    bg: "bg-rose-50",
    text: "text-rose-600",
  },
  {
    key: "housing",
    label: "Housing",
    icon: "🏠",
    badge: "bg-orange-50 text-orange-600 border-orange-200",
    border: "border-l-orange-400",
    glow: "hover:shadow-orange-100",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    key: "pension",
    label: "Pension",
    icon: "👴",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-l-purple-400",
    glow: "hover:shadow-purple-100",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  {
    key: "women_child",
    label: "Women & Child",
    icon: "👩‍👧",
    badge: "bg-pink-50 text-pink-600 border-pink-200",
    border: "border-l-pink-400",
    glow: "hover:shadow-pink-100",
    bg: "bg-pink-50",
    text: "text-pink-600",
  },
  {
    key: "livelihood",
    label: "Livelihood",
    icon: "💼",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-l-amber-400",
    glow: "hover:shadow-amber-100",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  {
    key: "scholarship",
    label: "Scholarship",
    icon: "📚",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    border: "border-l-indigo-400",
    glow: "hover:shadow-indigo-100",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  {
    key: "financial_inclusion",
    label: "Finance",
    icon: "💰",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    border: "border-l-teal-400",
    glow: "hover:shadow-teal-100",
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
  {
    key: "disability",
    label: "Disability",
    icon: "♿",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-l-blue-400",
    glow: "hover:shadow-blue-100",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  {
    key: "other",
    label: "Other",
    icon: "📌",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    border: "border-l-slate-300",
    glow: "hover:shadow-slate-100",
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
];

const KEY_MAP: Record<string, CategoryKey> = {
  all: "all",
  agriculture: "agriculture",
  education: "education",
  health: "health",
  housing: "housing",
  pension: "pension",
  women_child: "women_child",
  "women & child": "women_child",
  "women and child": "women_child",
  livelihood: "livelihood",
  employment: "livelihood",
  scholarship: "scholarship",
  financial_inclusion: "financial_inclusion",
  finance: "financial_inclusion",
  disability: "disability",
  other: "other",
};

const INFO_MAP: Record<CategoryKey, CategoryInfo> = CATEGORY_LIST.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<CategoryKey, CategoryInfo>
);

/**
 * Normalizes any category string (from backend or UI or legacy JSON) to a standardized CategoryKey.
 */
export function normalizeCategoryKey(cat?: string | null): CategoryKey {
  if (!cat) return "other";
  const normalized = cat.toLowerCase().trim();
  return KEY_MAP[normalized] ?? "other";
}

/**
 * Returns full styling and label info for any category input.
 */
export function getCategoryInfo(cat?: string | null): CategoryInfo {
  const key = normalizeCategoryKey(cat);
  return INFO_MAP[key] ?? INFO_MAP.other;
}
