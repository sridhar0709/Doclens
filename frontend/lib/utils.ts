export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function confidenceLabel(score: number): string {
  if (score >= 0.8) return "High confidence";
  if (score >= 0.5) return "Verify with authority";
  return "Manual review needed";
}

export function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}
