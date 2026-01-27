import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiReports } from "@/lib/api";
import { getCurrentUser } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

export function DoctorReportButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    const user = getCurrentUser();
    if (!user) {
      toast({ title: "Error", description: "User not found", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiReports.getDoctorReport(parseInt(user.id));
      generatePDF(data);
      toast({ title: "Success", description: "Report downloaded successfully!" });
    } catch (error) {
      console.error("API Error:", error);
      // Fallback: Generate report from local user data
      try {
        const fallbackData = {
          user: user,
          symptoms: [],
          medications: [],
          selfExams: []
        };
        generatePDF(fallbackData);
        toast({ title: "Success", description: "Report generated (offline mode)" });
      } catch (fallbackError) {
        console.error("Fallback Error:", fallbackError);
        toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(233, 30, 99); // Pink
    doc.text("HopeBloom Health Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient: ${data.user.username || data.user.name || 'User'}`, 14, 35);
    doc.text(`Email: ${data.user.email || ''}`, 14, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 45);

    let finalY = 55;

    // Symptoms
    if (data.symptoms && data.symptoms.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Recent Symptoms", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Type', 'Severity', 'Notes']],
        body: data.symptoms.map((s: any) => [
          new Date(s.date).toLocaleDateString(),
          s.symptom_type,
          s.severity,
          s.notes || '-'
        ]),
      });
      // @ts-ignore
      finalY = doc.lastAutoTable.finalY + 15;
    }

    // Medications
    if (data.medications && data.medications.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Medications", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Name', 'Dosage', 'Schedule', 'Start Date']],
        body: data.medications.map((m: any) => [
          m.name,
          m.dosage,
          m.schedule,
          new Date(m.start_date).toLocaleDateString()
        ]),
      });
      // @ts-ignore
      finalY = doc.lastAutoTable.finalY + 15;
    }

    // Self Exams
    if (data.selfExams && data.selfExams.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Self Exam Findings", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Findings', 'Pain Level', 'Notes']],
        body: data.selfExams.map((e: any) => [
          new Date(e.date).toLocaleDateString(),
          e.findings,
          e.pain_level ? `${e.pain_level}/10` : '-',
          e.notes || '-'
        ]),
      });
    }

    doc.save(`Health_Report_${data.user.username || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Button onClick={handleDownload} disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      Export Doctor Report
    </Button>
  );
}
