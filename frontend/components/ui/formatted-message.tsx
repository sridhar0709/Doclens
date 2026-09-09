"use client";

import React from "react";

/**
 * Custom rich text formatter that transforms raw LLM/backend scheme text into
 * beautifully styled UI cards, bold badges, clickable portal buttons, and clean lists.
 */
export function FormattedMessage({ content }: { content: string }) {
  // Clean up any weird character encoding artifacts if present
  const cleaned = content
    .replace(/Гé/g, "₹")
    .replace(/ΓÇô|ΓÇö/g, "—")
    .replace(/ΓÇÖ/g, "'");

  const lines = cleaned.split("\n");

  return (
    <div className="space-y-3.5 text-sm leading-relaxed text-[#1E1B4B]">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;

        // Check if line is a bullet/list item (starts with *, +, -, or number.)
        const isBullet = /^[*\-+•]\s+|^\d+\.\s+/.test(line);
        // Check if line is a "Benefit estimate:" or similar tag
        const isBenefit = /^Benefit estimate:/i.test(line);
        const isDocs = /^Required docs:/i.test(line);
        const isApply = /^Apply:/i.test(line);

        // Parse inline bold syntax **text**
        const renderInline = (text: string) => {
          const parts = text.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const inner = part.slice(2, -2).trim();
              return (
                <strong
                  key={i}
                  className="font-bold text-[#1E1B4B] bg-orange-500/10 text-orange-900 dark:text-orange-950 px-1.5 py-0.5 rounded border border-orange-500/20"
                >
                  {inner}
                </strong>
              );
            }
            return part;
          });
        };

        if (isBenefit) {
          const val = line.replace(/^Benefit estimate:/i, "").trim();
          return (
            <div
              key={idx}
              className="my-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-emerald-800 font-semibold shadow-2xs"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                💰
              </span>
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-700 block font-bold">
                  Benefit Estimate
                </span>
                <span className="text-sm">{renderInline(val)}</span>
              </div>
            </div>
          );
        }

        if (isDocs) {
          const val = line.replace(/^Required docs:/i, "").trim();
          const docs = val.split(",").map((d) => d.trim()).filter(Boolean);
          return (
            <div key={idx} className="my-2 rounded-xl bg-blue-50/80 border border-blue-200/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">
                <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Required Documents</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {docs.map((doc, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-blue-300/80 px-2.5 py-1 text-xs font-semibold text-blue-900 shadow-2xs"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        if (isApply) {
          const urlMatch = line.match(/https?:\/\/[^\s]+/);
          const url = urlMatch ? urlMatch[0] : "";
          if (url) {
            return (
              <div key={idx} className="my-2 pt-1">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Apply at Official Portal</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              </div>
            );
          }
        }

        if (isBullet) {
          const cleanBullet = line.replace(/^[*\-+•]\s+|^\d+\.\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1.5">
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-600">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="flex-1 text-slate-700 font-medium">{renderInline(cleanBullet)}</span>
            </div>
          );
        }

        // Standard paragraph line
        return (
          <p key={idx} className="text-slate-700 font-normal leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

export default FormattedMessage;
