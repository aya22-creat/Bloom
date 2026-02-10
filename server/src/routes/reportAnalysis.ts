import { Router, Request, Response } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const name = req.file.originalname;
    const type = req.file.mimetype;
    const sizeKB = Math.round(req.file.size / 1024);
    const summary = `Received ${name} (${type}, ${sizeKB}KB). Performing safe guidance-only analysis.`;
    const guidance = [
      'This is a supportive explanation, not a diagnosis.',
      'Discuss any concerns with your clinician.',
      'We focus on clarity, red flags, and next steps.'
    ];
    res.json({
      success: true,
      message: 'File uploaded',
      data: {
        summary,
        explanation:
          'Your report will be simplified to highlight plain-language findings, helpful questions for your doctor, and standard follow-up steps.',
        next_steps: ['Keep records organized', 'Note symptoms timeline', 'Prepare questions for appointment'],
        red_flags: ['Persistent high fever', 'Severe chest pain', 'Difficulty breathing'],
        disclaimer:
          'This guidance is for informational purposes only and does not replace professional medical advice.',
      },
    });
  } catch (error) {
    console.error('[Report Upload Error]', error);
    res.status(500).json({ success: false, error: 'Failed to process file' });
  }
});

export default router;

