import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import {
  FileSpreadsheet,
  FileText,
} from "lucide-react";
=======
import { Download, FileSpreadsheet, FileText } from "lucide-react";
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
