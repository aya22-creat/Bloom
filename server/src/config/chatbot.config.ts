export type DiseaseModuleKey = 'breast_cancer' | 'general_oncology' | 'survivorship';

export interface ChatbotConfig {
  provider: 'rasa' | 'gemini_fallback';
  rasaUrl: string;
  timeoutMs: number;
  systemPrompt: string;
  modules: Record<DiseaseModuleKey, { title: string; preface: string }>;
}

export const DEFAULT_SYSTEM_PROMPT = `You are a compassionate healthcare support assistant focused on cancer patient well-being.
You provide emotional support, lifestyle guidance, medication and self-examination reminders, and simple educational explanations.
You must never diagnose illnesses or provide medical prescriptions.
If severe symptoms are mentioned, advise contacting a medical professional immediately.
Maintain empathy, clarity, and confidentiality at all times, with special attention to breast cancer awareness and rehabilitation safety.`;

export const chatbotConfig: ChatbotConfig = {
  provider: (process.env.CHATBOT_PROVIDER as any) || 'rasa',
  rasaUrl: process.env.RASA_URL || 'http://localhost:5005/webhooks/rest/webhook',
  timeoutMs: Number.parseInt(process.env.CHATBOT_TIMEOUT_MS || '15000', 10),
  systemPrompt: process.env.MASTER_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
  modules: {
    breast_cancer: {
      title: 'Breast Cancer Support',
      preface:
        'Focus on breast cancer awareness, rehabilitation safety, lymphedema prevention exercises, medication adherence, and monthly self-exam reminders (3–5 days post-period). No diagnosis or prescriptions.',
    },
    general_oncology: {
      title: 'General Oncology Support',
      preface:
        'Provide empathetic lifestyle guidance, side-effect coping strategies, and safety red flags. Never diagnose; always recommend contacting clinicians for medical decisions.',
    },
    survivorship: {
      title: 'Survivorship and Recovery',
      preface:
        'Reinforce healthy routines, gradual exercise, follow-up appointments, and emotional rehabilitation. Encourage adherence to care plans without medical directives.',
    },
  },
};

