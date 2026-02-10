import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/rbac.middleware';
import { getChatbotService } from '../services/chatbot.service';
import { chatbotConfig } from '../config/chatbot.config';
import { logAudit } from '../services/audit.service';

const router = Router();
const service = getChatbotService();

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { message, module } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const response = await service.chat({ userId, message, module });

    await logAudit({
      user_id: userId,
      action: 'chatbot_message',
      entity_type: 'chatbot',
      details: JSON.stringify({ module: module || 'default', length: message.length }),
      ip_address: req.ip,
    });

    res.status(200).json({
      success: true,
      provider: response.provider,
      fallback: response.fallback,
      timestamp: response.timestamp,
      safety: response.safety,
      data: { text: response.text },
    });
  } catch (error: any) {
    console.error('[Chatbot /chat Error]', error?.message || error);
    const safeText = 'I am here to support you. Please try again shortly or contact a healthcare professional for urgent symptoms.';
    res.status(200).json({
      success: true,
      provider: 'rasa',
      fallback: true,
      timestamp: new Date().toISOString(),
      safety: { flagged: true, reason: 'service_unavailable' },
      data: { text: safeText },
    });
  }
});

router.get('/docs', (_req: Request, res: Response) => {
  res.json({
    endpoint: '/api/chat',
    method: 'POST',
    auth: 'Bearer JWT required',
    body: {
      message: 'string (required)',
      module: '"breast_cancer" | "general_oncology" | "survivorship" (optional)'
    },
    response: {
      success: 'boolean',
      provider: '"rasa" | "gemini_fallback"',
      fallback: 'boolean',
      data: { text: 'string' },
      safety: { flagged: 'boolean', reason: 'string?' },
    },
    notes: [
      'System prompt injected automatically and configurable via env MASTER_SYSTEM_PROMPT',
      'No sensitive personal data stored; only timestamp and message length logged',
      'Severe symptom mentions trigger safety overlay advising urgent care',
    ],
  });
});

export default router;
