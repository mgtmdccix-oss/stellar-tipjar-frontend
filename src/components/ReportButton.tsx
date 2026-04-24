"use client";

import { useState } from "react";
import { ReportModal } from "@/components/ReportModal";

interface ReportButtonProps {
  targetUser: string;
  /** Render as icon-only button (for compact layouts) */
  compact?: boolean;
}

export function ReportButton({ targetUser, compact = false }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report @${targetUser}`}
        className={`rounded-lg border border-ink/10 text-xs text-ink/40 transition-colors hover:border-error/40 hover:text-error ${
          compact ? "px-2 py-1" : "px-3 py-1.5"
        }`}
      >
        {compact ? "⚑" : "Report"}
      </button>

      {open && <ReportModal targetUser={targetUser} onClose={() => setOpen(false)} />}
    </>
  );
}
