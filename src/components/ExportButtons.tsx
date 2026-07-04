import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/utils/exportUtils";

interface ExportColumn {
  header: string;
  key: string;
}

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  title: string;
  filename: string;
}

const ExportButtons = ({ data, columns, title, filename }: ExportButtonsProps) => (
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToExcel(data, columns, filename)}
    >
      <FileSpreadsheet className="w-4 h-4 mr-1" />
      Excel
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToPDF(data, columns, title, filename)}
    >
      <FileText className="w-4 h-4 mr-1" />
      PDF
    </Button>
  </div>
);

export default ExportButtons;
