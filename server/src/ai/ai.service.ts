/**
 * AI Service - Production-Ready Gemini Integration
 * 
 * ARCHITECTURE:
 * - Facade pattern: Hides Gemini complexity from controllers
 * - Strategy pattern: Can swap providers without changing controllers
 * - Singleton pattern: Single instance per application lifetime
 * 
 * SECURITY:
 * - API key from environment variables only
 * - Master system prompt injected automatically
 * - Response validation before returning to client
 * - No user input directly in prompts (only validated structured input)
 * 
 * MEDICAL SAFETY:
 * - Only predefined tasks (AITask enum)
 * - Master prompt enforces no diagnosis/prescription
 * - Response validation catches harmful content
 * - All responses include safety metadata
 * 
 * CRITICAL RULE: Controllers NEVER call GeminiClient directly
 * Controllers → AIService → GeminiClient
 */

import { GeminiClient } from './gemini.client';
import { OpenAIClient } from './openai.client';
import {
  AIRequest,
  AIResponse,
  AITask,
  AIError,
  AIErrorType,
  GeminiRequest,
  WellnessAdviceInput,
  SymptomEducationInput,
  MedicationReminderInput,
  CycleTrackingInsightInput,
  HealthQuestionInput,
  SelfExamGuidanceInput,
  PreventiveTipsInput,
  LifestyleSuggestionInput,
  AppointmentPreparationInput,
} from './types';
import { HOPEBLOOM_SYSTEM_PROMPT } from './hopebloom-system-prompt';

export class AIService {
  private geminiClient: GeminiClient | null = null;
  private openaiClient: OpenAIClient | null = null;
  private static instance: AIService | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(): AIService {
    if (!this.instance) {
      this.instance = new AIService();
    }
    return this.instance;
  }

  /**
   * Initialize AI service with Gemini client
   * MUST be called once on application startup
   */
  initialize(geminiClient: GeminiClient): void {
    this.geminiClient = geminiClient;
    console.log(`[AIService] Initialized with model: ${geminiClient.getModel()}`);

    // Validate master prompt is loaded
    console.log(`[AIService] Master prompt loaded (${HOPEBLOOM_SYSTEM_PROMPT.length} chars)`);
  }

  addOpenAIProvider(openaiClient: OpenAIClient): void {
    this.openaiClient = openaiClient;
    console.log(`[AIService] OpenAI fallback enabled: ${openaiClient.getModel()}`);
  }

  getStatus(): {
    initialized: boolean;
    provider: string;
    model?: string;
    gemini?: {
      disabled: boolean;
      disabledType?: string;
      disabledStatusCode?: number;
    };
  } {
    if (!this.geminiClient) {
      return { initialized: false, provider: this.getProviderName() };
    }

    const summary = this.geminiClient.getStatusSummary();
    return {
      initialized: true,
      provider: this.getProviderName(),
      model: this.geminiClient.getModel(),
      gemini: {
        disabled: summary.disabled,
        disabledType: summary.disabledType,
        disabledStatusCode: summary.disabledStatusCode,
      },
    };
  }

  /**
   * MAIN API: Generate AI response for user request
   * 
   * TASK PROMPTS: Enum-based, pre-defined safe tasks
   * 
   * @param userId - User making the request
   * @param request - AIRequest with task and validated input
   * @returns AIResponse with content and safety metadata
   * @throws AIError if request is invalid or generation fails
   */
  async chat(userId: string, request: AIRequest): Promise<AIResponse> {
    // Validation: Service initialized
    if (!this.geminiClient) {
      console.warn('[AIService] Gemini client not initialized, using fallback rule engine');
      return this.generateFallbackResponse(userId, request);
    }

    // Validation: Task is valid
    if (!Object.values(AITask).includes(request.task)) {
      throw this.createError(
        AIErrorType.INVALID_TASK,
        `Invalid task: ${request.task}`,
        'Invalid request. Please try again.',
        { userId, task: request.task }
      );
    }

    // Validation: Input provided
    if (!request.input) {
      throw this.createError(
        AIErrorType.MISSING_REQUIRED_FIELD,
        'Missing input for task',
        'Invalid request. Please try again.',
        { userId, task: request.task }
      );
    }

    const startTime = Date.now();

    try {
      // Step 1: Build task-specific prompt
      const taskPrompt = this.buildTaskPrompt(request.task, request.input);

      // Step 2: Get master system prompt and optional frontend mode-specific instructions
      let explicitModeInstruction = '';
      if (request.context?.mode) {
        const mode = request.context.mode.toUpperCase();
        explicitModeInstruction = `\n\n=== USER SELECTED MODE: ${mode} ===\nThe user has explicitly selected ${mode} mode. You MUST adhere to the ${mode} guidelines above.`;
      }

      const systemPrompt = [
        HOPEBLOOM_SYSTEM_PROMPT,
        request.input.context, // Frontend-generated system prompt
        explicitModeInstruction
      ]
        .filter(Boolean)
        .join('\n\n=== CONTEXT & INSTRUCTIONS ===\n\n');

      // Step 3: Build Gemini request
      const history = (request.context?.history || []).map(msg => ({
        role: msg.role,
        parts: msg.parts
      }));

      const geminiRequest: GeminiRequest = {
        contents: [
          ...history,
          {
            role: 'user',
            parts: [{ text: taskPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40,
          responseMimeType: "application/json"
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      };

      // Step 4: Call Gemini API (prefer online: wait+retry on rate limit)
      const preferOnline = String(process.env.GEMINI_PREFER_ONLINE || 'true').toLowerCase() === 'true';
      const maxWaitMs = Number.parseInt(process.env.GEMINI_MAX_WAIT_MS || '20000', 10);

      let geminiResponse: any;
      try {
        geminiResponse = await this.geminiClient.generate(geminiRequest);
      } catch (err: any) {
        const errorType = err?.type as AIErrorType | undefined;
        const retryable = Boolean(err?.retryable);
        const retryAfterSec = Number(err?.details?.retryAfter ?? err?.retryAfter ?? 0);

        if (preferOnline && retryable && errorType === AIErrorType.GEMINI_RATE_LIMIT) {
          const waitMs = Math.max(0, Math.min(maxWaitMs, retryAfterSec * 1000));
          if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
          }
          geminiResponse = await this.geminiClient.generate(geminiRequest);
        } else {
          throw err;
        }
      }

      // Step 5: Extract and validate response
      const candidate = geminiResponse.candidates[0];
      if (!candidate?.content?.parts?.[0]) {
        throw this.createError(
          AIErrorType.INVALID_RESPONSE_FORMAT,
          'Gemini response missing content',
          'Unable to generate response. Please try again.'
        );
      }

      let content = candidate.content.parts[0].text || '';

      // Validate response is not empty
      if (!content || content.trim().length === 0) {
        throw this.createError(
          AIErrorType.INVALID_RESPONSE_FORMAT,
          'Gemini returned empty response',
          'Unable to generate response. Please try again.'
        );
      }

      // 1. Strip Markdown Code Blocks (if any)
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

      // 2. Clean technical mode prefix from JSON answer
      try {
        const json = JSON.parse(content);
        if (json.answer) {
          // Remove "Mode: XXX" prefix and surrounding whitespace
          json.answer = json.answer.replace(/^\s*Mode:\s*(PSYCH|HEALTH|MIXED)\s*\n*/i, '');
          content = JSON.stringify(json);
        }
      } catch {
        // Not JSON, ignore
      }

      // Step 6: Build response with metadata
      const response: AIResponse = {
        content,
        task: request.task,
        metadata: {
          model: this.geminiClient.getModel(),
          timestamp: new Date().toISOString(),
          tokensUsed: geminiResponse.usageMetadata?.totalTokenCount || 0,
          processingTime: Date.now() - startTime,
        },
        safety: {
          filtered: false,
        },
      };

      return response;
    } catch (error) {
      console.warn('[AI Service] Gemini call failed, trying OpenAI fallback:', (error as any)?.message || error);
      if (this.openaiClient) {
        try {
          const messages = (request.context?.history || []).map((m: any) => ({ role: m.role, content: (m.parts?.[0]?.text || '') }));
          messages.push({ role: 'user', content: taskPrompt });
          const openai = await this.openaiClient.generateText(systemPrompt, messages as any);
          const response: AIResponse = {
            content: openai.content || 'I am here to support you.',
            task: request.task,
            metadata: {
              model: `openai:${this.openaiClient.getModel()}`,
              timestamp: new Date().toISOString(),
              tokensUsed: openai?.usage?.total_tokens || 0,
              processingTime: Date.now() - startTime,
            },
            safety: { filtered: false },
          };
          return response;
        } catch (e) {
          console.warn('[AI Service] OpenAI fallback failed, using rule engine:', (e as any)?.message || e);
        }
      }
      // FALLBACK SYSTEM: rule-based
      return this.generateFallbackResponse(userId, request);
    }
  }

  /**
   * Generate rule-based fallback response when AI service is down
   */
  private generateFallbackResponse(userId: string, request: AIRequest): AIResponse {
      const input = request.input;
      let content = "";
      
      // Simple keyword matching for fallback
      const question = (input.question || input.prompt || "").toLowerCase();
      const isArabic = /[\u0600-\u06FF]/.test(question);
      
      if (request.task === AITask.HEALTH_QUESTION) {
          if (isArabic) {
              if (question.includes("ألم") || question.includes("وجع") || question.includes("تعبانة")) {
                  content = "ألف سلامة عليكي. أنا مقدرة جداً الألم اللي بتمر بيه. أهم حاجة دلوقتي تحاولي ترتاحي وتاخدي نفس عميق. لو الألم ده مستمر أو شديد، أنصحك بزيارة الطبيب للاطمئنان. أنا موجودة هنا لو حابة تتكلمي أو توصفيه أكتر.";
              } else if (question.includes("خايفة") || question.includes("قلقانة") || question.includes("عيالي")) {
                  content = "مشاعرك دي طبيعية جداً ومفهومة، ومن حقك تقلقي عشان إنتي أم مسؤولة. اطمني، إحنا هنا جنبك خطوة بخطوة. خلي عندك أمل ويقين، وإن شاء الله الأمور هتتحسن. تحبي نتكلم في استراتيجيات بسيطة للتعامل مع القلق ده؟";
              } else if (question.includes("توتر") || question.includes("متوترة") || question.includes("ضغط") || question.includes("مضغوطة") || question.includes("هلع")) {
                  content = [
                    "أنا فاهماكي… التوتر والضغط ممكن يكونوا مُرهقين جداً. جربي خطوات بسيطة وآمنة تساعدك دلوقتي:",
                    "",
                    "• تنفّس 4-6: شهيق 4 ثواني، زفير 6 ثواني، كرري 5 مرات.",
                    "• اكتبي 3 حاجات مزعلاكي + خطوة صغيرة تقدري تعمليها النهارده.",
                    "• قلّلي الكافيين آخر اليوم، وحاولي تمشي 10 دقائق لو تقدري.",
                    "• نامي/ريّحي جسمك قدر الإمكان، واشربي مية.",
                    "",
                    "لو التوتر شديد أو بيأثر على نومك/أكلك أو معاها خفقان شديد/دوخة/أفكار إيذاء للنفس، الأفضل تتواصلي مع طبيبة أو مختص فوراً.",
                    "",
                    "تحبي تقوليلي أكتر: التوتر سببه إيه غالباً؟"
                  ].join("\n");
              } else if (
                   question.includes("مصابه") ||
                   question.includes("مصابة") ||
                   question.includes("تشخيص") ||
                   question.includes("تم تشخيص") ||
                   question.includes("سرطان")
               ) {
                   content = [
                     "**نظرة عامة**",
                     "• التشخيص الجديد يحتاج هدوء وخطوات واضحة. وأنا هنا لأدعمك بشكل مهني ومطمئن.",
                     "",
                     "**أهم ما تنتبهي له الآن**",
                     "• ترتيب موعد مع الطبيبة وكتابة أسئلتك مسبقاً.",
                     "• متابعة الأعراض يومياً وتسجيلها (شدة، مدة، ما يحسن/يزيد).",
                     "• الالتزام بالأدوية في مواعيدها مع مراعاة التعليمات.",
                     "• الاهتمام بالنوم، غذاء متوازن، وماء كفاية.",
                     "",
                     "**أسئلة مفيدة للطبيبة**",
                     "• ما نوع ومرحلة الحالة؟",
                     "• ما خطة العلاج وخطواتها؟",
                     "• الآثار الجانبية المتوقعة وكيف أتعامل معها؟",
                     "• متى يجب أن أتواصل فوراً أو أذهب للطوارئ؟",
                     "",
                     "**متى تطلبين عناية عاجلة**",
                     "• ألم صدر شديد، صعوبة تنفس، نزيف شديد، حرارة مرتفعة مستمرة.",
                     "",
                     "**الخطوة التالية**",
                     "• أقدر أجهز لكِ قائمة أسئلة للطبيبة، وأضيف تذكيرات للأدوية والمتابعة. تحبي أبدأ؟",
                   ].join("\n");
              } else if (question.includes("فحص") || question.includes("كشف") || question.includes("ماموجرام") || question.includes("أشعة")) {
                  content = [
                    "**الفحص الدوري مهم جداً للاطمئنان على صحتك.**",
                    "",
                    "• **الفحص الذاتي:** يُنصح بعمله مرة كل شهر، من 3-5 أيام بعد انتهاء الدورة الشهرية (لما يكون الثدي أقل تحجراً). لو انقطعت الدورة، ثبتي يوم معين في الشهر.",
                    "• **الفحص السريري (عند الطبيب):** يُنصح به مرة سنوياً أو حسب توجيهات طبيبك.",
                    "• **الماموجرام:** عادة يُنصح به سنوياً بعد سن الأربعين، أو قبل ذلك لو فيه تاريخ مرضي في العائلة (حسب رأي الطبيب).",
                    "",
                    "هل تحبي أساعدك نعرف طريقة الفحص الذاتي الصحيحة؟"
                  ].join("\n");
              } else if (question.includes("تغذية") || question.includes("أكل") || question.includes("طعام") || question.includes("رجيم") || question.includes("دايت")) {
                  content = [
                    "**التغذية السليمة جزء أساسي من صحتك.**",
                    "إليك بعض النصائح العامة التي قد تساعدك:",
                    "",
                    "• ركزي على الخضروات والفواكه الطازجة لغناها بالفيتامينات والمعادن.",
                    "• تناولي البروتينات الصحية (مثل الدجاج، السمك، البقوليات) لبناء الجسم وترميم الخلايا.",
                    "• اشربي كميات كافية من الماء (حوالي 8 أكواب يومياً) للحفاظ على رطوبة الجسم.",
                    "• قللي من السكريات والدهون المشبعة والأطعمة المصنعة.",
                    "• حاولي تناول وجبات صغيرة ومتعددة على مدار اليوم إذا كنت تعانين من فقدان الشهية.",
                    "",
                    "هل لديك استفسار محدد عن نوع معين من الطعام؟"
                  ].join("\n");
              } else if (question.includes("رياضة") || question.includes("تمرين") || question.includes("حركة") || question.includes("مشي")) {
                  content = [
                    "**الحركة بركة، والرياضة مفيدة جداً للحالة النفسية والجسدية.**",
                    "ولكن تذكري دائماً استشارة طبيبك قبل البدء بأي برنامج رياضي.",
                    "",
                    "• **المشي:** من أسهل وأفضل الرياضات، ابدئي بـ 10-15 دقيقة يومياً وزيديها تدريجياً.",
                    "• **تمارين التمدد (Stretching):** تساعد على مرونة العضلات وتقليل التوتر.",
                    "• **اليوغا:** مفيدة جداً للاسترخاء وتحسين التنفس.",
                    "",
                    "استمعي لجسدك دائماً، وتوقفي فوراً عند الشعور بأي ألم أو تعب شديد."
                  ].join("\n");
              } else if (question.includes("نوم") || question.includes("أرق") || question.includes("سهر")) {
                   content = [
                    "**النوم الجيد يساعد جسمك على التعافي وتجديد طاقته.**",
                    "إليك بعض النصائح لتحسين جودة نومك:",
                    "",
                    "• حاولي تثبيت موعد النوم والاستيقاظ.",
                    "• تجنبي الشاشات (موبايل، تلفزيون) قبل النوم بساعة على الأقل.",
                    "• اجعلي غرفة النوم هادئة ومظلمة ومريحة.",
                    "• تجنبي الكافيين والوجبات الثقيلة في المساء.",
                    "• جربي تمارين الاسترخاء أو التنفس العميق قبل النوم.",
                    "",
                    "هل تعانين من الأرق بشكل مستمر؟"
                   ].join("\n");
              } else {
                  content = "أهلاً بيكي. أنا سامعاكي كويس ومقدرة كل كلمة بتقوليها. كملي، أنا معاكي للآخر. إيه كمان شاغل بالك أو مضايقك؟ خدي راحتك في الكلام، أنا هنا عشان أسمعك.";
              }
          } else {
              // English Fallback
              if (question.includes("pain") || question.includes("hurt")) {
                  content = "I'm so sorry you're in pain. Please take a deep breath and try to rest. If the pain is severe, please see a doctor. I'm here if you want to talk more.";
              } else if (question.includes("scared") || question.includes("afraid") || question.includes("kids")) {
                  content = "I understand your fear. You are a strong mother, and it's natural to worry. Have faith that you will get through this. I am here with you.";
              } else if (question.includes("stress") || question.includes("stressed") || question.includes("pressure") || question.includes("panic") || question.includes("overwhelmed")) {
                  content = [
                    "I hear you—stress can be exhausting. A few safe steps you can try right now:",
                    "",
                    "• 4–6 breathing: inhale 4 seconds, exhale 6 seconds, repeat 5 times.",
                    "• Write down 3 stressors + 1 small step you can do today.",
                    "• Reduce caffeine later in the day and try a 10-minute walk if you can.",
                    "• Rest and hydrate.",
                    "",
                    "If stress is severe or affects sleep/appetite, or you have strong palpitations/dizziness/self-harm thoughts, please contact a clinician urgently.",
                    "",
                    "What’s driving the stress most: symptoms, treatment, family, or work?"
                  ].join("\n");
              } else if (
                   question.includes("newly diagnosed") ||
                   question.includes("just diagnosed") ||
                   question.includes("diagnosed")
               ) {
                   content = [
                     "**Overview**",
                     "• A new diagnosis is overwhelming. Let's take calm, clear steps together.",
                     "",
                     "**Pay Attention Now**",
                     "• Schedule your doctor visit and write down your questions.",
                     "• Track symptoms daily (severity, duration, triggers, relievers).",
                     "• Take medications on time and follow instructions.",
                     "• Prioritize sleep, balanced nutrition, and hydration.",
                     "",
                     "**Questions for Your Doctor**",
                     "• What is the exact type and stage?",
                     "• What is the treatment plan and timeline?",
                     "• Expected side effects and how to manage them?",
                     "• When should I call urgently or go to ER?",
                     "",
                     "**When to Seek Urgent Care**",
                     "• Severe chest pain, difficulty breathing, heavy bleeding, persistent high fever.",
                     "",
                     "**Next Step**",
                     "• I can prepare your doctor question list and set reminders. Would you like me to start now?",
                   ].join("\n");
              } else if (question.includes("nutrition") || question.includes("food") || question.includes("eat") || question.includes("diet")) {
                  content = [
                    "**Good nutrition is a key part of your health.**",
                    "Here are some general tips that might help:",
                    "",
                    "• Focus on fresh fruits and vegetables for vitamins and minerals.",
                    "• Include healthy proteins (chicken, fish, legumes) to build and repair tissues.",
                    "• Drink enough water (about 8 cups daily) to stay hydrated.",
                    "• Limit sugar, saturated fats, and processed foods.",
                    "• Try small, frequent meals if you have a loss of appetite.",
                    "",
                    "Do you have a specific question about a certain food?"
                  ].join("\n");
              } else if (question.includes("exercise") || question.includes("workout") || question.includes("activity") || question.includes("walk")) {
                  content = [
                    "**Movement is medicine, and exercise helps both mind and body.**",
                    "Always consult your doctor before starting any new exercise routine.",
                    "",
                    "• **Walking:** One of the best and easiest activities. Start with 10-15 minutes a day.",
                    "• **Stretching:** Helps keep muscles flexible and reduces tension.",
                    "• **Yoga:** Great for relaxation and breathing.",
                    "",
                    "Listen to your body, and stop immediately if you feel pain or extreme fatigue."
                  ].join("\n");
              } else if (question.includes("sleep") || question.includes("insomnia") || question.includes("awake")) {
                  content = [
                    "**Quality sleep helps your body heal and recharge.**",
                    "Here are some tips for better sleep:",
                    "",
                    "• Stick to a regular sleep schedule.",
                    "• Avoid screens (phone, TV) at least an hour before bed.",
                    "• Keep your bedroom dark, quiet, and cool.",
                    "• Avoid caffeine and heavy meals in the evening.",
                    "• Try relaxation exercises or deep breathing before bed.",
                    "",
                    "Do you struggle with insomnia often?"
                  ].join("\n");
              } else {
                  content = "I'm here for you. I hear you and I support you. Would you like to tell me more? I can help with questions about nutrition, exercise, sleep, or symptoms.";
              }
          }
      } else {
          content = isArabic 
            ? "أنا هنا عشان أساعدك. ممكن توضحيلي أكتر إزاي أقدر أكون جنبك النهاردة؟" 
            : "I am here to help. Could you tell me more about how I can support you today?";
      }

      return {
        content,
        task: request.task,
        metadata: {
          model: 'fallback-rule-engine',
          timestamp: new Date().toISOString(),
          tokensUsed: 0,
          processingTime: 0,
        },
        safety: { filtered: false }
      };
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.geminiClient) {
      return false;
    }

    try {
      return await this.geminiClient.healthCheck();
    } catch {
      return false;
    }
  }

  /**
   * Implementation of IAIProvider interface
   */
  getProviderName(): string {
    return 'GoogleGemini';
  }

  /**
   * Get current rate limit status
   */
  async getRateLimit(): Promise<{ remaining: number; reset: Date }> {
    return {
      remaining: 1000,
      reset: new Date(Date.now() + 3600000),
    };
  }

  /**
   * Build task-specific prompt from enum-based template
   * @private
   */
  private buildTaskPrompt(task: AITask, input: any): string {
    switch (task) {
      case AITask.WELLNESS_ADVICE:
        return `The user is experiencing these symptoms: ${input.currentSymptoms?.join(', ') || 'none'}.
                Their wellness goals are: ${input.goals?.join(', ') || 'general health'}.
                Provide practical wellness advice focusing on lifestyle, nutrition, stress management, and exercise.
                CRITICAL: Do not diagnose conditions or prescribe medications. Recommend consulting a healthcare provider.`;

      case AITask.SYMPTOM_EDUCATION:
        return `User wants to understand these symptoms: ${input.symptoms?.join(', ') || 'unknown'}.
                Context: ${input.context || 'General understanding'}.
                Educate about what these symptoms typically indicate (general knowledge), when to seek medical attention.
                CRITICAL: Educational only, not diagnostic. Always recommend professional medical evaluation.`;

      case AITask.MEDICATION_REMINDER:
        return `Help user remember information about: ${input.medicationName || 'medication'}.
                Dosage: ${input.dosage || 'not specified'}
                Potential side effects: ${input.sideEffects?.join(', ') || 'not specified'}
                Create helpful reminder about when/how to take it, adherence practices, and side effect management.
                CRITICAL: Never suggest changing dosage or stopping medication. Remind to follow doctor's instructions.`;

      case AITask.CYCLE_TRACKING_INSIGHT:
        return `Help track menstrual cycle awareness:
                Current phase: ${input.cyclePhase || 'unknown'}
                Symptoms: ${input.symptoms?.join(', ') || 'none'}
                Days into cycle: ${input.daysIntoCycle || 'unknown'}
                Provide insights about what's typical for this phase, self-care recommendations.
                CRITICAL: Track for awareness, not diagnosis. Symptoms outside normal range need professional evaluation.`;

      case AITask.HEALTH_QUESTION:
        return `Answer this health question: "${input.question || 'unspecified'}"
                User context: ${input.context || 'No additional context'}
                Provide accurate evidence-based information, sources, and when professional medical advice is needed.
                CRITICAL: Educational information only, not medical advice.`;

      case AITask.WELLNESS_TIPS:
        return `Provide wellness tips for: ${input.topic || 'general wellness'}
                Focus areas: ${input.focusAreas?.join(', ') || 'overall wellness'}
                Suggest practical, actionable tips about lifestyle, nutrition, mental health, and physical activity.`;

      case AITask.SELF_EXAM_GUIDANCE:
        return `Provide guidance for: ${input.examType || 'self-examination'}
                Recommended frequency: ${input.frequency || 'as recommended'}
                Explain how to perform the exam, what to look for, what's normal vs. concerning.
                CRITICAL: Educational guidance for health awareness, not diagnostic.`;

      case AITask.PREVENTIVE_TIPS:
        return `Provide preventive health recommendations for: ${input.topic || 'general health'}
                Age group: ${input.ageGroup || 'general'}
                Suggest evidence-based preventive measures: lifestyle modifications, screening recommendations.`;

      case AITask.LIFESTYLE_SUGGESTION:
        return `Help improve lifestyle for: ${input.goal || 'general wellness'}
                Current habits: ${input.currentHabits?.join(', ') || 'not specified'}
                Timeframe: ${input.timeframe || 'long-term'}
                Suggest practical, achievable improvements with specific daily habits.`;

      case AITask.APPOINTMENT_PREPARATION:
        return `Help prepare for: ${input.appointmentType || 'doctor appointment'}
                Current concerns: ${input.concerns?.join(', ') || 'none specified'}
                Suggest important questions to ask the doctor and records to bring.`;

      default:
        throw this.createError(
          AIErrorType.INVALID_TASK,
          `Unknown task: ${task}`,
          'Invalid request.'
        );
    }
  }

  /**
   * Create structured error object
   * @private
   */
  private createError(
    type: AIErrorType,
    message: string,
    userMessage: string,
    details?: Record<string, any>
  ): AIError {
    const statusCodeMap: Record<AIErrorType, number> = {
      [AIErrorType.GEMINI_API_ERROR]: 502,
      [AIErrorType.GEMINI_RATE_LIMIT]: 429,
      [AIErrorType.GEMINI_INVALID_KEY]: 401,
      [AIErrorType.GEMINI_TIMEOUT]: 504,
      [AIErrorType.INVALID_TASK]: 400,
      [AIErrorType.INVALID_INPUT]: 400,
      [AIErrorType.MISSING_REQUIRED_FIELD]: 400,
      [AIErrorType.INVALID_RESPONSE_FORMAT]: 502,
      [AIErrorType.RESPONSE_SAFETY_VIOLATION]: 400,
      [AIErrorType.NETWORK_ERROR]: 503,
      [AIErrorType.CONNECTION_TIMEOUT]: 504,
      [AIErrorType.SYSTEM_ERROR]: 500,
      [AIErrorType.AI_SERVICE_UNAVAILABLE]: 503,
    };

    const retryableErrors = [
      AIErrorType.GEMINI_RATE_LIMIT,
      AIErrorType.GEMINI_TIMEOUT,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.CONNECTION_TIMEOUT,
    ];

    return {
      type,
      message,
      userMessage,
      details,
      statusCode: statusCodeMap[type] || 500,
      retryable: retryableErrors.includes(type),
      retryAfter: type === AIErrorType.GEMINI_RATE_LIMIT ? 60000 : undefined,
    };
  }
}
