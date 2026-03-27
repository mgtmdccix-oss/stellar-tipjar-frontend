"use client";

import { useState } from "react";
import type { Tip } from "@/hooks/queries/useTips";
import { exportToCSV } from "@/utils/exportCSV";
import { exportToExcel } from "@/utils/exportExcel";
import { exportTransactionsPDF, exportTaxReportPDF } from "@/utils/exportPDFReport";
import { computeTaxSummary } from "@/utils/taxReport";

type Format = "csv" | "excel" | "pdf" | "tax-pdf" | "tax-csv";

const FORMATS: { value: Format; label: string; desc: string }[] = [
  { value: "csv", label: "CSV", desc: "Spreadsheet-compatible, all transactions" },
  { value: "excel", label: "Excel (.xlsx)", desc: "Excel workbook with formatted columns" },
  { value: "pdf", label: "PDF Report", desc: "Printable transaction list" },
  { value: "tax-pdf", label: "Tax Report (PDF)", desc: "Annual summary with monthly breakdown" },
  { value: "tax-csv", label: "Tax Report (CSV)", desc: "Annual summary as CSV" },
];

const TIP_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount (XLM)" },
  { key: "recipient", label: "Recipient" },
  { key: "sender", label: "Sender" },
  { key: "status", label: "Status" },
  { key: "memo", label: "Memo" },
  { key: "transactionHash", label: "Transaction Hash" },
];

interface Props {
  tips: Tip[];
  onClose: () => void;
}

export function ExportModal({ tips, onClose }: Props) {
  const currentYear = new Date().getFullYear();
  const [format, setFormat] = useState<Format>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [taxYear, setTaxYear] = useState(currentYear);

  const isTaxFormat = format === "tax-pdf" || format === "tax-csv";

  function filtered(): Tip[] {
    return tips.filter((t) => {
      const d = new Date(t.date);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }

  function handleExport() {
    const stamp = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      const rows = filtered().map((t) => ({
        date: new Date(t.date).toLocaleString(),
        amount: t.amount,
        recipient: t.recipient,
        sender: t.sender,
        status: t.status,
        memo: t.memo ?? "",
        transactionHash: t.transactionHash ?? "",
      }));
      exportToCSV(rows as Record<string, unknown>[], TIP_COLUMNS, `tips-${stamp}.csv`);
    } else if (format === "excel") {
      exportToExcel(filtered(), `tips-${stamp}.xlsx`);
    } else if (format === "pdf") {
      exportTransactionsPDF(filtered(), `tips-${stamp}.pdf`);
    } else if (format === "tax-pdf") {
      const summary = computeTaxSummary(tips, taxYear);
      exportTaxReportPDF(summary, `tax-report-${taxYear}.pdf`);
    } else if (format === "tax-csv") {
      const summary = computeTaxSummary(tips, taxYear);
      const rows = summary.byMonth.map((r) => ({ month: r.month, received: r.received, sent: r.sent }));
      exportToCSV(rows as Record<string, unknown>[], [
        { key: "month", label: "Month" },
        { key: "received", label: "Received (XLM)" },
        { key: "sent", label: "Sent (XLM)" },
      ], `tax-report-${taxYear}.csv`);
    }

    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export transactions"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Export Transactions</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        {/* Format */}
        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</legend>
          <div className="space-y-2">
            {FORMATS.map((f) => (
              <label key={f.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value={f.value}
                  checked={format === f.value}
                  onChange={() => setFormat(f.value)}
                  className="mt-0.5 accent-indigo-600"
                />
                <span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{f.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date range (non-tax) */}
        {!isTaxFormat && (
          <fieldset className="mb-4">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range <span className="font-normal text-gray-400">(optional)</span></legend>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white" />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{filtered().length} transaction{filtered().length !== 1 ? "s" : ""} in range</p>
          </fieldset>
        )}

        {/* Tax year */}
        {isTaxFormat && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax Year</label>
            <input
              type="number"
              min={2020}
              max={currentYear}
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
            />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button onClick={handleExport}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
