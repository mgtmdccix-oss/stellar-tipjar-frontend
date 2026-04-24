"use client";

import { useState, useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface ReportModalProps {
  targetUser: string;
  onClose: () => void;
}

type ReportCategory =
  | "spam"
  | "harassment"
  | "impersonation"
  | "inappropriate"
  | "misinformation"
  | "other";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "impersonation", label: "Impersonation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

type Status = "idle" | "submitting" | "success" | "error";

async function submitReport(payload: {
  targetUser: string;
  category: ReportCategory;
  reason: string;
}): Promise<void> {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit report.");
}

export function ReportModal({ targetUser, onClose }: ReportModalProps) {
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const trapRef = useFocusTrap<HTMLDivElement>(true);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Save and restore focus
  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement;
    return () => prevFocusRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { setError("Please select a reason."); return; }
    setError(null);
    setStatus("submitting");
    try {
      await submitReport({ targetUser, category, reason: reason.trim() });
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-wave/30";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="w-full max-w-md rounded-3xl border border-ink/10 bg-[color:var(--surface)] p-6 shadow-card"
      >
        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-4xl" aria-hidden="true">✅</span>
            <h2 className="text-lg font-semibold text-ink">Report submitted</h2>
            <p className="text-sm text-ink/60">
              Thanks for helping keep the community safe. We'll review this shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl bg-wave px-5 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 id="report-modal-title" className="text-lg font-semibold text-ink">
                Report @{targetUser}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close report dialog"
                className="rounded-lg p-1 text-ink/40 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-ink/60">
              Reports are anonymous. We review all reports within 24 hours.
            </p>

            {/* Category */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">Reason *</legend>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 px-3 py-2.5 text-sm transition-colors hover:border-wave/30 has-[:checked]:border-wave has-[:checked]:bg-wave/5"
                  >
                    <input
                      type="radio"
                      name="report-category"
                      value={cat.value}
                      checked={category === cat.value}
                      onChange={() => setCategory(cat.value)}
                      className="accent-wave"
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Details */}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">
                Additional details (optional)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide any extra context..."
                maxLength={1000}
                rows={3}
                aria-label="Additional details"
                className={`${inputCls} resize-y`}
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={status === "submitting"}
                aria-busy={status === "submitting"}
                className="inline-flex items-center justify-center rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {status === "submitting" ? "Submitting..." : "Submit Report"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-ink/40"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
