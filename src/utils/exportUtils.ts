import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { formatFcfaDot } from "@/lib/prescription-meds";

interface ExportColumn {
  header: string;
  key: string;
}

export const exportToExcel = async (
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gesclic";
  wb.created = new Date();
  const ws = wb.addWorksheet("Données");

  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: Math.max(14, c.header.length + 4),
  }));

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3B82F6" },
  };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "left" };

  data.forEach((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((c) => {
      row[c.key] = item[c.key] ?? "";
    });
    ws.addRow(row);
  });

  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  title: string,
  filename: string
) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

  const headers = columns.map((c) => c.header);
  const rows = data.map((item) => columns.map((c) => String(item[c.key] ?? "")));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 36,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`${filename}.pdf`);
};

export const generateInvoicePDF = (payment: {
  patientName: string;
  amount: number;
  currency: string;
  method: string;
  date: string;
  description: string;
}) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text("FACTURE", 14, 25);

  doc.setFontSize(10);
  doc.text("Gesclic - Gestion Médicale", 14, 35);
  doc.text(`Date: ${payment.date}`, 14, 42);
  doc.text(`N° Facture: FAC-${Date.now().toString().slice(-6)}`, 14, 49);

  doc.setDrawColor(59, 130, 246);
  doc.line(14, 55, 196, 55);

  doc.setFontSize(12);
  doc.text("Patient:", 14, 65);
  doc.setFontSize(11);
  doc.text(payment.patientName, 50, 65);

  autoTable(doc, {
    startY: 75,
    head: [["Description", "Méthode", "Montant"]],
    body: [[payment.description, payment.method, `${payment.amount.toLocaleString()} ${payment.currency}`]],
    headStyles: { fillColor: [59, 130, 246] },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 100;

  doc.setFontSize(14);
  doc.text(`Total: ${payment.amount.toLocaleString()} ${payment.currency}`, 14, finalY + 15);

  doc.save(`facture-${payment.patientName.replace(/\s+/g, "-")}.pdf`);
};

async function loadClinicLogo(url: string): Promise<{ data: string; format: "PNG"; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.width || !canvas.height) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve({
          data: canvas.toDataURL("image/png"),
          format: "PNG",
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generatePrescriptionPDF(
  rx: {
    patientName: string;
    doctorName: string;
    date: string;
    notes?: string;
    medications: { name: string; dosage: string; quantity: number; unitPrice: number }[];
  },
  options?: { clinicName?: string; logoUrl?: string | null; print?: boolean },
) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const clinic = options?.clinicName || "Gesclic";
  const fmt = (n: number) => `${formatFcfaDot(n)} FCFA`;
  const total = rx.medications.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const logo = options?.logoUrl ? await loadClinicLogo(options.logoUrl) : null;

  if (logo) {
    const max = 22;
    const ratio = logo.width / logo.height;
    const w = ratio >= 1 ? max : max * ratio;
    const h = ratio >= 1 ? max / ratio : max;
    doc.addImage(logo.data, logo.format, 14, 10, w, h);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ORDONNANCE", pageW / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(clinic, 14, 36);
  doc.text(`Date : ${rx.date}`, 14, 42);
  doc.text(`N° : ORD-${Date.now().toString().slice(-6)}`, 14, 48);

  doc.setDrawColor(59, 130, 246);
  doc.line(14, 52, pageW - 14, 52);

  doc.setFontSize(11);
  doc.text(`Patient : ${rx.patientName}`, 14, 62);
  doc.text(`Médecin : ${rx.doctorName}`, 14, 69);

  autoTable(doc, {
    startY: 76,
    head: [["Médicament", "Posologie", "Qté", "P.U.", "Montant"]],
    body: rx.medications.map((m) => [
      m.name,
      m.dosage || "—",
      String(m.quantity),
      fmt(m.unitPrice),
      fmt(m.quantity * m.unitPrice),
    ]),
    foot: [["", "", "", "Total", fmt(total)]],
    headStyles: { fillColor: [59, 130, 246] },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    styles: { fontSize: 9 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 110;
  if (rx.notes) {
    doc.setFontSize(10);
    doc.text("Notes :", 14, finalY + 12);
    doc.setFontSize(9);
    const notes = doc.splitTextToSize(rx.notes, 180);
    doc.text(notes, 14, finalY + 18);
  }

  const signY = Math.min(finalY + (rx.notes ? 36 : 22), 270);
  doc.setFontSize(10);
  doc.text("Signature du médecin", 130, signY);
  doc.line(130, signY + 16, 190, signY + 16);

  const filename = `ordonnance-${rx.patientName.replace(/\s+/g, "-")}.pdf`;
  if (options?.print) {
    const printable = doc as jsPDF & { autoPrint: () => void };
    printable.autoPrint();
    printable.output("dataurlnewwindow");
    return;
  }
  doc.save(filename);
}
