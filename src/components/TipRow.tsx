"use client";

import { useState } from "react";
import type { Tip } from "@/hooks/useTipHistory";
import { generateReceiptPDF } from "@/utils/pdfGenerator";

interface TipRowProps {
  tip: Tip;
}

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
};

const statusLabels = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

export function TipRow({ tip }: TipRowProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formattedDate = new Date(tip.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDownloadReceipt = async () => {
    setIsGenerating(true);
    try {
      await generateReceiptPDF(tip);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <tr className="border-b border-ink/10 hover:bg-ink/5">
      <td className="px-4 py-3 text-sm text-ink">{formattedDate}</td>
      <td className="px-4 py-3 text-sm font-medium text-ink">{tip.amount} XLM</td>
      <td className="px-4 py-3 text-sm text-ink">
        <a
          href={`/creator/${tip.recipient}`}
          className="text-wave hover:underline"
        >
          @{tip.recipient}
        </a>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            statusColors[tip.status]
          }`}
        >
          {statusLabels[tip.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-ink/60">
        {tip.memo || "-"}
      </td>
      <td className="px-4 py-3 text-sm">
        {tip.transactionHash ? (
          <a
            href={`https://stellar.expert/explorer/public/tx/${tip.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wave hover:underline"
            title={tip.transactionHash}
          >
            {tip.transactionHash.slice(0, 8)}...
          </a>
        ) : (
          <span className="text-ink/40">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleDownloadReceipt}
          disabled={isGenerating}
          className="inline-flex items-center gap-1 rounded-md bg-wave/10 px-2 py-1 text-xs font-medium text-wave hover:bg-wave/20 disabled:cursor-not-allowed disabled:opacity-50"
          title="Download receipt"
        >
          {isGenerating ? (
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Receipt
        </button>
      </td>
    </tr>
  );
}
