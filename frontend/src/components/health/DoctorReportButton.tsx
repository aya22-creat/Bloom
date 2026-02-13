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

  const ensureArabicFont = async (doc: jsPDF) => {
    const fontName = 'NotoNaskhArabic';
    const vfsName = 'NotoNaskhArabic-Regular.ttf';
    const anyDoc: any = doc as any;
    const hasFont = anyDoc.getFontList && anyDoc.getFontList().some((f: string) => f.includes(fontName));
    if (hasFont) return fontName;
    const url = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/phaseIII/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf';
    const res = await fetch(url);
    const ab = await res.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
    anyDoc.addFileToVFS(vfsName, base64);
    anyDoc.addFont(vfsName, fontName, 'normal');
    return fontName;
  };

  const handleDownload = async () => {
    const user = getCurrentUser();
    if (!user) {
      toast({ title: "Error", description: "User not found", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = await apiReports.getDoctorReport(parseInt(user.id));
      await generatePDF(data);
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

  const generatePDF = async (data: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const fontName = await ensureArabicFont(doc);
    doc.setFont(fontName, 'normal');

    const arabicMap: Record<string, string> = {
      'ا':'a','أ':'a','إ':'i','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh',
      'د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z',
      'ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y',
      'ء':'`','ؤ':'w','ئ':'y','ى':'a','ة':'h','ﻻ':'la','لا':'la','٪':'%','،':',','؛':';','؟':'?'
    };
    const toAsciiArabic = (s: any) => {
      const str = String(s ?? '').trim();
      if (!/[\u0600-\u06FF]/.test(str)) return str; // no Arabic
      return str.replace(/[\u0660-\u0669]/g, (d) => String('0123456789'[Number(d.charCodeAt(0)-0x0660)]))
                .split('')
                .map(ch => arabicMap[ch] ?? ch)
                .join('');
    };
    
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

    const symptoms = Array.isArray(data.symptoms) ? data.symptoms : [];
    const logs = Array.isArray(data.healthLogs) ? data.healthLogs : [];
    const exams = Array.isArray(data.selfExams) ? data.selfExams : [];
    const meds = Array.isArray(data.medications) ? data.medications : [];
    const remindersRaw = Array.isArray(data.reminders) ? data.reminders : [];
    const reports = Array.isArray(data.medicalReports) ? data.medicalReports : [];

    // Text cleanup helpers to avoid mojibake
    const stripNoise = (s: any) => String(s ?? '')
      .normalize('NFC')
      .replace(/[^\u0600-\u06FFA-Za-z0-9\s\-.,:%]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const clean = (s: any) => {
      const str = String(s ?? '').trim();
      if (!str) return '';
      // If Arabic characters exist, transliterate for safer rendering
      if ([...str].some(ch => /[\u0600-\u06FF]/.test(ch))) return stripNoise(str);
      return stripNoise(str);
    };

    // Reminders: collapse repeated hydration entries; only show next few upcoming
    const nowTs = Date.now();
    const reminders = remindersRaw
      .map((r: any) => ({
        date: r.date,
        time: r.time,
        type: clean(r.type),
        title: clean(r.title),
        description: clean(r.description),
      }))
      .filter(r => r.date && r.time)
      .map(r => ({ ...r, ts: new Date(`${r.date}T${r.time}:00`).getTime() }))
      .filter(r => !Number.isNaN(r.ts) && r.ts >= nowTs)
      .sort((a,b) => a.ts - b.ts);
    const collapsedReminders = (() => {
      const seen = new Set<string>();
      const out: any[] = [];
      for (const r of reminders) {
        const key = `${r.date}|${r.time}|${r.type}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r);
        if (out.length >= 6) break;
      }
      return out;
    })();

    const avgSeverity = (() => {
      const vals = symptoms.map((s: any) => parseInt(String(s.severity))).filter((v) => !isNaN(v));
      if (!vals.length) return '-';
      return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    })();
    const painLogs = logs.filter((l: any) => String(l.type).toLowerCase() === 'pain');
    const avgPain = (() => {
      const vals = painLogs.map((l: any) => parseInt(String(l.value))).filter((v) => !isNaN(v));
      if (!vals.length) return '-';
      return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    })();

    doc.setFontSize(16);
    doc.setTextColor(233, 30, 99);
    doc.text("Summary & Analysis", 14, finalY);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const summaryLines = [
      `Symptoms recorded: ${symptoms.length}`,
      `Average symptom severity: ${avgSeverity}`,
      `Average pain (logs): ${avgPain}/10`,
      `Medications: ${meds.length}`,
      `Self-exams: ${exams.length}`,
      `Upcoming reminders (next): ${collapsedReminders.length}`,
    ];
    summaryLines.forEach((line, i) => doc.text(line, 14, finalY + 7 + i * 6));
    finalY += 7 + summaryLines.length * 6 + 8;

    // Symptoms
    if (symptoms.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Recent Symptoms", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Type', 'Severity', 'Notes']],
        styles: { font: fontName },
        headStyles: { font: fontName },
        columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
        body: symptoms.map((s: any) => {
          const d = s.tracking_date || s.date || s.logged_at || s.created_at;
          const t = clean(s.symptom_type || s.symptom_name || '-');
          return [
            d ? new Date(d).toLocaleDateString() : '-',
            t,
            s.severity ?? '-',
            clean(s.notes || '-')
          ];
        }),
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Medications
    if (meds.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Medications", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Name', 'Type', 'Dosage', 'Frequency', 'Start', 'End']],
        styles: { font: fontName },
        headStyles: { font: fontName },
        body: meds.map((m: any) => [
          clean(m.name || '-'),
          clean(m.type || '-'),
          clean(m.dosage || '-'),
          clean(m.frequency || m.schedule || '-'),
          m.start_date ? new Date(m.start_date).toLocaleDateString() : '-',
          m.end_date ? new Date(m.end_date).toLocaleDateString() : '-'
        ]),
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Self Exams
    if (exams.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Self Exam Findings", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Findings', 'Pain Level', 'Notes']],
        styles: { font: fontName },
        headStyles: { font: fontName },
        columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
        body: exams.map((e: any) => {
          const d = e.exam_date || e.date || e.created_at;
          const pain = e.pain_level ?? '-';
          return [
            d ? new Date(d).toLocaleDateString() : '-',
            clean(e.findings || '-'),
            pain !== '-' ? `${pain}/10` : '-',
            clean(e.notes || '-')
          ];
        }),
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (logs.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Health Logs", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Type', 'Value', 'Notes']],
        styles: { font: fontName },
        headStyles: { font: fontName },
        columnStyles: { 3: { halign: 'right' } },
        body: logs.map((l: any) => [
          l.created_at ? new Date(l.created_at).toLocaleDateString() : '-',
          clean(l.type || '-'),
          l.value ?? '-',
          clean(l.notes || '-')
        ]),
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (reminders.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Reminders", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Time', 'Type', 'Title', 'Description']],
        styles: { font: fontName },
        headStyles: { font: fontName },
        columnStyles: { 4: { halign: 'right' } },
        body: collapsedReminders.map((r: any) => [
          r.date || '-',
          r.time || '-',
          clean(r.type || '-'),
          clean(r.title || '-'),
          clean(r.description || '-')
        ]),
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (reports.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(233, 30, 99);
      doc.text("Medical Reports", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [['File', 'Type', 'Size (KB)', 'Uploaded']],
        styles: { font: fontName },
        headStyles: { font: fontName },
        body: reports.map((r: any) => [
          clean(r.file_name || '-'),
          clean(r.mime_type || '-'),
          r.size_kb ?? '-',
          r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString() : '-'
        ]),
      });
      finalY = (doc as any).lastAutoTable.finalY + 15;
    }

    const safeName = String(data.user.username || 'user').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'user';
    const fileName = `Health_Report_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
    try {
      const buffer = doc.output('arraybuffer');
      const blob = new Blob([buffer], { type: 'application/pdf' });

      // Preferred: Native File Picker (Chromium/Edge/Firefox recent)
      const pickerAvailable = typeof (window as any).showSaveFilePicker === 'function';
      if (pickerAvailable) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch {}
      }

      // Legacy: msSaveOrOpenBlob for old Edge/IE
      const navAny: any = navigator as any;
      if (typeof navAny.msSaveOrOpenBlob === 'function') {
        try { navAny.msSaveOrOpenBlob(blob, fileName); return; } catch {}
      }

      // Standard: ObjectURL + programmatic click
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch {}
        try { a.remove(); } catch {}
      }, 2000);
    } catch {
      try {
        const dataUrl = doc.output('dataurlstring');
        const win = window.open(dataUrl, '_blank');
        if (!win) doc.save(fileName);
      } catch {
        try { doc.save(fileName); } catch {}
      }
    }
  };

  return (
    <Button onClick={handleDownload} disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
      Export Doctor Report
    </Button>
  );
}
