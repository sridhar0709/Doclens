"use client";

import React from "react";

export function ConfidenceBadge({
  score,
  size,
  showLabel,
  className = "",
}: {
  score: number;
  size?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const getStyle = (s: number) => {
    if (s >= 85) return "bg-green-100 text-green-700 border-green-200";
    if (s >= 65) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStyle(
        score
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% Match
    </span>
  );
}

export default ConfidenceBadge;
