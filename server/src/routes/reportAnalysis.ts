import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Database } from '../lib/database';
import { AIService } from '../ai/ai.service';
import { AITask } from '../ai/types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const userId = Number((req.body as any)?.user_id ?? (req.body as any)?.userId);
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }
    const name = req.file.originalname;
    const type = req.file.mimetype;
    const sizeKB = Math.round(req.file.size / 1024);
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
    const safeName = `${Date.now()}_${name.replace(/[^\w\-.]+/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.promises.writeFile(filePath, req.file.buffer);

    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO medical_reports (user_id, file_name, mime_type, size_kb, file_path) VALUES (?, ?, ?, ?, ?)`,
        [userId, name, type, sizeKB, filePath],
        (err) => (err ? reject(err) : resolve())
      );
    });

    let contentPreview = '';
    let imageInline: { mimeType: string; data: string } | undefined;
    try {
      const isText = type.startsWith('text/');
      const isImage = type.startsWith('image/');
      if (isText) {
        const raw = req.file.buffer.toString('utf8');
        contentPreview = raw.slice(0, 1200);
      } else if (isImage) {
        const base64 = Buffer.from(req.file.buffer).toString('base64');
        imageInline = { mimeType: type, data: base64 };
      }
    } catch {}

    const ai = AIService.getInstance();
    const isImage = type.startsWith('image/');
    const isText = type.startsWith('text/');
    const baseInstruction = isImage
      ? `خلال النظر إلى الصورة الطبية المرفقة (لا تشخيص ولا وصف علاج)، أعطِ:
1) ملخص واضح غير تقني لما يظهر بالصورة.
2) نقاط مهمة يجب الانتباه لها.
3) أسئلة مقترحة للطبيبة.
4) علامات إنذار.
5) خطوات متابعة بسيطة.

أجب بصيغة JSON منظمة.`
      : `حلّل هذا التقرير الطبي بشكل مبسّط وآمن دون تشخيص أو وصف أدوية.
الملف: ${name} | النوع: ${type} | الحجم: ${sizeKB}KB.
${contentPreview ? `معاينة محتوى (أول 1200 حرف):\n${contentPreview}` : 'لا توجد معاينة نصية متاحة لهذا النوع.'}

المطلوب: ملخص واضح، نقاط مهمّة، أسئلة للطبيبة، علامات إنذار، وخطوات تالية منظمة. أجب بصيغة JSON.`;

    const request = {
      task: AITask.HEALTH_QUESTION,
      userId: userId,
      input: {
        question: baseInstruction,
        context: 'لغة عربية، أسلوب مطمئن، معلومات تعليمية فقط، إحالات للطبيبة عند الحاجة.',
        ...(imageInline ? { imageInline } : {}),
      },
      context: { language: 'ar', mode: 'health' as const },
    } as const;

    try {
      const aiResp = await ai.chat(String(userId), request as any);
      let parsed: any = null;
      try { parsed = JSON.parse(aiResp.content); } catch {}

      res.json({
        success: true,
        message: 'File uploaded and analyzed',
        data: {
          file: { name, type, sizeKB, path: filePath },
          analysis: parsed || aiResp.content,
          metadata: aiResp.metadata,
          disclaimer:
            'هذه معلومات تعليمية داعمة وليست تشخيصاً طبياً. يُرجى الرجوع للطبيبة في أي قرار علاجي.'
        }
      });
    } catch (e) {
      console.warn('[AI Analysis Fallback]', (e as any)?.message || e);
      const summary = `تم حفظ ${name} (${type}, ${sizeKB}KB). تعذّر التحليل الآلي، نقدّم إرشادات عامة فقط.`;
      res.json({
        success: true,
        message: 'File uploaded (guidance only)',
        data: {
          file: { name, type, sizeKB, path: filePath },
          summary,
          explanation:
            'سنوضح خطوات متابعة آمنة وأسئلة مهمّة للطبيبة، دون تشخيص أو وصفة علاجية.',
          next_steps: ['تنظيم السجلات', 'تدوين الأعراض زمنياً', 'تحضير أسئلة للموعد الطبي'],
          red_flags: ['حمّى مرتفعة مستمرة', 'ألم صدر شديد', 'صعوبة تنفس'],
          disclaimer:
            'هذه المعلومات تعليمية فقط ولا تغني عن المشورة الطبية المهنية.'
        },
      });
    }
  } catch (error) {
    console.error('[Report Upload Error]', error);
    res.status(500).json({ success: false, error: 'Failed to process file' });
  }
});

export default router;
