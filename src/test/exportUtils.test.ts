import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportToExcel, exportToPDF, generateInvoicePDF, generatePrescriptionPDF } from "@/utils/exportUtils";

// Mock jsPDF and ExcelJS
vi.mock("jspdf", () => ({
  default: vi.fn(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    setDrawColor: vi.fn(),
    line: vi.fn(),
    addImage: vi.fn(),
    splitTextToSize: vi.fn((t: string) => [t]),
    autoPrint: vi.fn(),
    output: vi.fn(),
    internal: { pageSize: { getWidth: () => 210 } },
  })),
}));

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

vi.mock("exceljs", () => ({
  default: {
    Workbook: vi.fn(() => ({
      creator: "",
      created: null,
      addWorksheet: vi.fn(() => ({
        columns: [],
        getRow: vi.fn(() => ({
          font: {},
          fill: {},
          alignment: {},
        })),
        addRow: vi.fn(),
        eachRow: vi.fn(),
      })),
      xlsx: {
        writeBuffer: vi.fn(() => Promise.resolve(Buffer.from([]))),
      },
    })),
  },
}));

describe("exportUtils", () => {
  const mockData = [
    { id: 1, name: "John Doe", age: 30 },
    { id: 2, name: "Jane Smith", age: 25 },
  ];

  const mockColumns = [
    { header: "ID", key: "id" },
    { header: "Name", key: "name" },
    { header: "Age", key: "age" },
  ];

  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  describe("exportToExcel", () => {
    it("should export data to Excel format", async () => {
      await expect(exportToExcel(mockData, mockColumns, "test")).resolves.not.toThrow();
    });

    it("should handle empty data", async () => {
      await expect(exportToExcel([], mockColumns, "test")).resolves.not.toThrow();
    });
  });

  describe("exportToPDF", () => {
    it("should export data to PDF format", () => {
      expect(() => exportToPDF(mockData, mockColumns, "Test Report", "test")).not.toThrow();
    });

    it("should handle empty data", () => {
      expect(() => exportToPDF([], mockColumns, "Test Report", "test")).not.toThrow();
    });
  });

  describe("generateInvoicePDF", () => {
    const mockPayment = {
      patientName: "John Doe",
      amount: 100,
      currency: "EUR",
      method: "Card",
      date: "2024-01-01",
      description: "Consultation",
    };

    it("should generate invoice PDF", () => {
      expect(() => generateInvoicePDF(mockPayment)).not.toThrow();
    });
  });

  describe("generatePrescriptionPDF", () => {
    const rx = {
      patientName: "Marie Diallo",
      doctorName: "Dr. Sow",
      date: "2026-10-27",
      notes: "Après repas",
      medications: [{ name: "Amox", dosage: "500mg", quantity: 2, unitPrice: 1500 }],
    };

    it("downloads a PDF", async () => {
      await expect(generatePrescriptionPDF(rx)).resolves.toBeUndefined();
    });

    it("opens print preview", async () => {
      await expect(generatePrescriptionPDF(rx, { print: true, clinicName: "Clinique Test" })).resolves.toBeUndefined();
    });
  });
});
