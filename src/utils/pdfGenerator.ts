import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Tip } from "@/hooks/queries/useTips";

const STELLAR_EXPLORER_URL = "https://stellar.expert/explorer/public/tx";

export async function generateReceiptPDF(tip: Tip): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Tip Receipt", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Stellar Tip Jar", pageWidth / 2, 32, { align: "center" });

  doc.setDrawColor(200);
  doc.line(20, 40, pageWidth - 20, 40);

  doc.setTextColor(0);
  doc.setFontSize(11);
  const startY = 55;
  const lineHeight = 10;
  const labelX = 25;
  const valueX = 70;

  const formattedDate = new Date(tip.date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const fields = [
    { label: "Receipt ID:", value: tip.id },
    { label: "Date:", value: formattedDate },
    { label: "Amount:", value: `${tip.amount} XLM` },
    { label: "Recipient:", value: `@${tip.recipient}` },
    { label: "Sender:", value: tip.sender },
    { label: "Status:", value: tip.status.charAt(0).toUpperCase() + tip.status.slice(1) },
    { label: "Memo:", value: tip.memo || "-" },
  ];

  fields.forEach((field, index) => {
    const y = startY + index * lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text(field.label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.text(field.value, valueX, y);
  });

  if (tip.transactionHash) {
    const txY = startY + fields.length * lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text("Transaction Hash:", labelX, txY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(tip.transactionHash, labelX, txY + 6);

    const txUrl = `${STELLAR_EXPLORER_URL}/${tip.transactionHash}`;
    const qrDataUrl = await QRCode.toDataURL(txUrl, {
      width: 200,
      margin: 1,
    });

    const qrSize = 50;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = txY + 20;
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Scan to verify on Stellar Explorer", pageWidth / 2, qrY + qrSize + 6, {
      align: "center",
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: "center" }
  );

  const timestamp = new Date().toISOString().split("T")[0];
  doc.save(`tip-receipt-${tip.id}-${timestamp}.pdf`);
}
