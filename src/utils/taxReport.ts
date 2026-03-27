import type { Tip } from "@/hooks/queries/useTips";

export interface TaxSummary {
  year: number;
  totalReceived: number;
  totalSent: number;
  completedTips: number;
  byMonth: { month: string; received: number; sent: number }[];
}

export function computeTaxSummary(tips: Tip[], year: number): TaxSummary {
  const inYear = tips.filter((t) => new Date(t.date).getFullYear() === year && t.status === "completed");

  const monthMap: Record<string, { received: number; sent: number }> = {};
  for (const t of inYear) {
    const key = new Date(t.date).toLocaleString("default", { month: "short", year: "numeric" });
    if (!monthMap[key]) monthMap[key] = { received: 0, sent: 0 };
    // "you" as sender means outgoing; otherwise incoming
    if (t.sender === "you") monthMap[key].sent += t.amount;
    else monthMap[key].received += t.amount;
  }

  const totalReceived = inYear.filter((t) => t.sender !== "you").reduce((s, t) => s + t.amount, 0);
  const totalSent = inYear.filter((t) => t.sender === "you").reduce((s, t) => s + t.amount, 0);

  return {
    year,
    totalReceived,
    totalSent,
    completedTips: inYear.length,
    byMonth: Object.entries(monthMap).map(([month, v]) => ({ month, ...v })),
  };
}
