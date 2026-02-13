import { chatbotConfig, DiseaseModuleKey } from '../config/chatbot.config';
import { RasaClient } from '../lib/rasa.client';

export interface ChatRequest {
  userId: number;
  message: string;
  module?: DiseaseModuleKey;
}

export interface ChatResponse {
  text: string;
  provider: 'rasa';
  fallback: boolean;
  timestamp: string;
  safety: { flagged: boolean; reason?: string };
}

const diagnosisKeywords = ['diagnose', 'diagnosis', 'تشخيص', 'prescribe', 'وصفة', 'دواء', 'medication dosage'];
const severeKeywords = ['chest pain', 'difficulty breathing', 'suicidal', 'self-harm', 'نزيف', 'دوخة شديدة', 'ألم صدر'];

function guardrail(text: string): { flagged: boolean; reason?: string } {
  const lower = text.toLowerCase();
  if (diagnosisKeywords.some((k) => lower.includes(k))) {
    return { flagged: true, reason: 'diagnosis_or_prescription_requested' };
  }
  if (severeKeywords.some((k) => lower.includes(k))) {
    return { flagged: true, reason: 'severe_symptom_mentioned' };
  }
  return { flagged: false };
}

function buildPrefacedMessage(module: DiseaseModuleKey | undefined, userMessage: string): string {
  const preface = module ? chatbotConfig.modules[module]?.preface : undefined;
  const header = `${chatbotConfig.systemPrompt}\n\n${preface ? preface + '\n\n' : ''}`;
  return `${header}User message:\n${userMessage}`;
}

export class ChatbotService {
  private rasa = new RasaClient(chatbotConfig.rasaUrl, chatbotConfig.timeoutMs);

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const safety = guardrail(req.message);
    const composed = buildPrefacedMessage(req.module, req.message);
    const senderId = `user_${req.userId}`;
    try {
      const text = await this.rasa.sendMessage(senderId, composed);
      const finalText = this.applySafetyOverlay(text, safety);
      return {
        text: finalText,
        provider: 'rasa',
        fallback: false,
        timestamp: new Date().toISOString(),
        safety,
      };
    } catch (err) {
      console.warn('[ChatbotService] Rasa call failed:', (err as any)?.message || err);
      const text = this.applySafetyOverlay(
        'I am here to support you. Please try again shortly or contact a healthcare professional for urgent symptoms.',
        safety
      );
      return {
        text,
        provider: 'rasa',
        fallback: true,
        timestamp: new Date().toISOString(),
        safety,
      };
    }
  }

  private applySafetyOverlay(text: string, safety: { flagged: boolean; reason?: string }): string {
    const disclaimer = '\n\n⚕️ This guidance is for support and education only and does not replace professional medical advice.';
    if (!text || text.trim().length === 0) {
      return 'I am here to support you. Could you share more so I can help better?' + disclaimer;
    }
    if (safety.flagged) {
      if (safety.reason === 'diagnosis_or_prescription_requested') {
        return (
          text +
          '\n\nImportant: I cannot diagnose conditions or prescribe medications. Please consult your clinician for medical decisions.' +
          disclaimer
        );
      }
      if (safety.reason === 'severe_symptom_mentioned') {
        return (
          text +
          '\n\nIf symptoms are severe or worsening, please seek urgent medical care or contact local emergency services immediately.' +
          disclaimer
        );
      }
    }
    return text + disclaimer;
  }
}

export const getChatbotService = () => new ChatbotService();
