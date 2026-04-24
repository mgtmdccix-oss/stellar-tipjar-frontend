"use client";

import { useState } from "react";

type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
type ReportCategory =
  | "spam"
  | "harassment"
  | "impersonation"
  | "inappropriate"
  | "misinformation"
  | "other";

interface Report {
  id: string;
  targetUser: string;
  category: ReportCategory;
  reason: string;
  reportedAt: string;
  status: ReportStatus;
  reporterCount: number;
}

// Mock data — replace with real API call when backend is ready
const MOCK_REPORTS: Report[] = [
  {
    id: "r1",
    targetUser: "spam-bot",
    category: "spam",
    reason: "Posting buy-cheap-XLM links in comments.",
    reportedAt: new Date(Date.now() - 3_600_000).toISOString(),
    status: "pending",
    reporterCount: 5,
  },
  {
    id: "r2",
    targetUser: "bad-actor",
    category: "harassment",
    reason: "Sending threatening messages to other users.",
    reportedAt: new Date(Date.now() - 86_400_000).toISOString(),
    status: "pending",
    reporterCount: 2,
  },
  {
    id: "r3",
    targetUser: "fake-alice",
    category: "impersonation",
    reason: "Pretending to be the creator @alice.",
    reportedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    status: "reviewed",
    reporterCount: 8,
  },
  {
    id: "r4",
    targetUser: "old-report",
    category: "other",
    reason: "Outdated concern, no longer relevant.",
    reportedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    status: "dismissed",
    reporterCount: 1,
  },
];

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  reviewed: "bg-blue-100 text-blue-700",
  dismissed: "bg-ink/10 text-ink/50",
  actioned: "bg-green-100 text-green-700",
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  spam: "Spam",
  harassment: "Harassment",
  impersonation: "Impersonation",
  inappropriate: "Inappropriate",
  misinformation: "Misinformation",
  other: "Other",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "< 1h ago";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [filter, setFilter] = useState<ReportStatus | "all">("pending");

  const updateStatus = (id: string, status: ReportStatus) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const displayed =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    reviewed: reports.filter((r) => r.status === "reviewed").length,
    actioned: reports.filter((r) => r.status === "actioned").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Moderation Dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">Review and action user reports.</p>
      </div>

      {/* Filter tabs */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter reports by status"
      >
        {(["all", "pending", "reviewed", "actioned", "dismissed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={`rounded-xl border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === s
                ? "border-wave bg-wave/10 text-wave"
                : "border-ink/20 text-ink/60 hover:border-wave/30"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {displayed.length === 0 && (
        <p className="rounded-2xl border border-ink/10 bg-[color:var(--surface)] p-8 text-center text-sm text-ink/50">
          No reports in this category.
        </p>
      )}

      <ul className="space-y-3" aria-label="Reports list">
        {displayed.map((report) => (
          <li
            key={report.id}
            className="rounded-2xl border border-ink/10 bg-[color:var(--surface)] p-5 shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">@{report.targetUser}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[report.status]}`}>
                    {report.status}
                  </span>
                  <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/60">
                    {CATEGORY_LABELS[report.category]}
                  </span>
                  {report.reporterCount > 1 && (
                    <span className="text-xs text-ink/40">
                      {report.reporterCount} reports
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink/70">{report.reason}</p>
                <p className="text-xs text-ink/40">{timeAgo(report.reportedAt)}</p>
              </div>

              {/* Actions */}
              {report.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(report.id, "actioned")}
                    aria-label={`Action report against @${report.targetUser}`}
                    className="rounded-xl bg-error px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    Block User
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(report.id, "reviewed")}
                    aria-label={`Mark report against @${report.targetUser} as reviewed`}
                    className="rounded-xl border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-wave/40"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(report.id, "dismissed")}
                    aria-label={`Dismiss report against @${report.targetUser}`}
                    className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs text-ink/40 transition hover:border-ink/30"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {report.status === "actioned" && (
                <button
                  type="button"
                  onClick={() => updateStatus(report.id, "dismissed")}
                  aria-label={`Unblock @${report.targetUser}`}
                  className="rounded-xl border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-wave/40"
                >
                  Unblock
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
