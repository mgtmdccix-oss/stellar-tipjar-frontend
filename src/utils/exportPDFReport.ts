import { jsPDF } from "jspdf";
import type { Tip } from "@/hooks/queries/useTips";
import type { TaxSummary } from "@/utils/taxReport";

function addTableHeader(doc: jsPDF, y: number, cols: { label: string; x: number }[]) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, 180, 7, "F");
  cols.forEach((c) => doc.text(c.label, c.x, y));
  doc.setFont("helvetica", "normal");
}

export function exportTransactionsPDF(tips: Tip[], filename: string): void {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Report", pw / 2, 20, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, pw / 2, 27, { align: "center" });
  doc.setTextColor(0);

  const cols = [
    { label: "Date", x: 16 },
    { label: "Recipient", x: 55 },
    { label: "Amount (XLM)", x: 100 },
    { label: "Status", x: 145 },
    { label: "Memo", x: 170 },
  ];

  let y = 40;
  addTableHeader(doc, y, cols);
  y += 8;

  doc.setFontSize(8);
  for (const t of tips) {
    if (y > 275) { doc.addPage(); y = 20; addTableHeader(doc, y, cols); y += 8; }
    doc.text(new Date(t.date).toLocaleDateString(), 16, y);
    doc.text(t.recipient.slice(0, 18), 55, y);
    doc.text(String(t.amount), 100, y);
    doc.text(t.status, 145, y);
    doc.text((t.memo ?? "").slice(0, 15), 170, y);
    y += 7;
  }

  doc.save(filename);
}

export function exportTaxReportPDF(summary: TaxSummary, filename: string): void {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Tax Report — ${summary.year}`, pw / 2, 22, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Stellar Tip Jar · For informational purposes only", pw / 2, 29, { align: "center" });
  doc.setTextColor(0);

  // Summary box
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let y = 42;
  const summaryLines = [
    ["Total Received:", `${summary.totalReceived} XLM`],
    ["Total Sent:", `${summary.totalSent} XLM`],
    ["Completed Transactions:", String(summary.completedTips)],
  ];
  for (const [label, value] of summaryLines) {
    doc.text(label, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 90, y);
    doc.setFont("helvetica", "bold");
    y += 9;
  }

  // Monthly breakdown
  y += 4;
  doc.setFontSize(12);
  doc.text("Monthly Breakdown", 20, y);
  y += 6;

  const cols = [
    { label: "Month", x: 20 },
    { label: "Received (XLM)", x: 80 },
    { label: "Sent (XLM)", x: 140 },
  ];
  addTableHeader(doc, y, cols);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const row of summary.byMonth) {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(row.month, 20, y);
    doc.text(String(row.received), 80, y);
    doc.text(String(row.sent), 140, y);
    y += 7;
  }

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("This report is not financial or tax advice. Consult a qualified tax professional.", pw / 2, 285, { align: "center" });

  doc.save(filename);
}
