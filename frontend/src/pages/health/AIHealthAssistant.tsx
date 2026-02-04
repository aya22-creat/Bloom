import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Image, 
  FileText, 
  ArrowLeft,
  Send,
  Upload,
  Bot,
  User,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  History,
  Plus,
  Trash2,
  Brain,
  Stethoscope
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser, logoutUser } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { apiAI } from "@/lib/api";
import { 
  generateSystemPrompt, 
  getContextualSuggestions, 
  needsMedicalDisclaimer,
  formatResponse,
  RESPONSE_TEMPLATES,
  detectLanguage
} from "@/lib/chatbot-prompts";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const AIHealthAssistant = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = (searchParams.get('mode') as "normal" | "counselor") || "normal";
  const [activeMode, setActiveMode] = useState<"health" | "psych">(urlMode === 'counselor' ? 'psych' : 'health');

  // Sync activeMode when URL changes
  useEffect(() => {
    setActiveMode(urlMode === 'counselor' ? 'psych' : 'health');
  }, [urlMode]);

  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: activeMode === 'psych' 
        ? "Hello. I am your safe space and virtual counselor. I'm here to listen to whatever is on your mind with zero judgment. How are you feeling right now? 💗"
        : "Hello! I'm your compassionate AI health companion. How can I support you today? 💗",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [symptomText, setSymptomText] = useState<string>("");
  const [symptomResult, setSymptomResult] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setUserName(user.name);
    const userLanguage = user.language || "en";

    // Generate and store system prompt per user
    const systemPrompt = generateSystemPrompt({
      userName: user.name,
      userType: user.userType as "fighter" | "survivor" | "wellness",
      currentDate: new Date().toLocaleDateString(),
      language: userLanguage,
      mode: activeMode
    });
    localStorage.setItem('hopebloom_chatbot_prompt', systemPrompt);

    // Load conversations and current conversation pointer from localStorage
    const listKey = `hb_chat_conversations_user_${user.id}${activeMode === 'psych' ? '_counselor' : ''}`;
    const currentKey = `hb_chat_current_conversation_user_${user.id}${activeMode === 'psych' ? '_counselor' : ''}`;
    const storedList = localStorage.getItem(listKey);
    const storedCurrentId = localStorage.getItem(currentKey);

    let convs: Conversation[] = storedList ? JSON.parse(storedList) : [];
    let currentId: string | null = storedCurrentId || null;

    if (convs.length === 0) {
      const greeting = activeMode === 'psych'
        ? (userLanguage === "ar" 
            ? "أهلاً بك. أنا مساحتك الآمنة ومستشارتك الافتراضية. أنا هنا للاستماع إليكِ دون أي حكم. كيف تشعرين الآن؟ 💗"
            : "Hello. I am your safe space and virtual counselor. I'm here to listen with zero judgment. How are you feeling? 💗")
        : RESPONSE_TEMPLATES.greeting(user.name, user.userType, userLanguage);
        
      const initialConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: userLanguage === "ar" 
          ? (activeMode === 'psych' ? "جلسة استشارة" : "محادثة جديدة") 
          : (activeMode === 'psych' ? "Counseling Session" : "New Conversation"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          { id: Date.now(), role: "assistant", content: greeting }
        ]
      };
      convs = [initialConv];
      currentId = initialConv.id;
      localStorage.setItem(listKey, JSON.stringify(convs));
      localStorage.setItem(currentKey, currentId);
    }

    setConversations(convs);
    setCurrentConversationId(currentId);

    const currentConv = convs.find(c => c.id === currentId) || convs[0];
    setMessages(currentConv.messages);
  }, [navigate, userType, activeMode]);

  const generateAIResponse = (userMessage: string): string => {
    const user = getCurrentUser();
    if (!user) return "";
    
    // Detect language from user message (Priority 1)
    const detectedLang = detectLanguage(userMessage);
    // Use user preference as fallback (Priority 2)
    const responseLang = detectedLang === "ar" ? "ar" : (user.language || "en");
    
    const lowerMessage = userMessage.toLowerCase();
    const lowerMessageAr = userMessage; // For Arabic keyword detection
    
    // Emergency keywords in both languages
    const emergencyKeywordsEn = ['emergency', 'severe pain', "can't breathe", 'chest pain', 'severe bleeding', 'suicide', 'kill myself', 'end my life'];
    const emergencyKeywordsAr = ['طوارئ', 'ألم شديد', 'لا أستطيع التنفس', 'ألم في الصدر', 'نزيف شديد', 'انتحار', 'انهي حياتي', 'اموت'];
    const isEmergency = emergencyKeywordsEn.some(k => lowerMessage.includes(k)) || 
                        emergencyKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (isEmergency) {
      const emergencyMsg = responseLang === "ar"
        ? "أنا قلقة بشأن ما تذكرينه. هذا يبدو أمراً جدياً ويستحق الاهتمام الطبي الفوري. إذا كنت تشعرين بأي خطر، أرجو منكِ التوجه لأقرب طوارئ أو التواصل مع طبيبك فوراً. سلامتك هي أولويتنا."
        : "I'm deeply concerned about you. Please, your safety is the most important thing right now. If you're in danger, please call emergency services or go to the nearest hospital immediately.";
      return formatResponse(emergencyMsg, false, user.name, responseLang);
    }

    // Newly Diagnosed guidance
    const newDiagAr = ["مصابه", "مصابة", "تشخيص", "تم تشخيص", "سرطان", "مصابة جديد", "مصابه جديد"]; 
    const newDiagEn = ["newly diagnosed", "just diagnosed", "recently diagnosed", "diagnosed"]; 
    const isNewlyDiagnosed = newDiagAr.some(k => lowerMessageAr.includes(k)) || newDiagEn.some(k => lowerMessage.includes(k));
    if (isNewlyDiagnosed) {
      const text = responseLang === "ar"
        ? [
            "**نظرة عامة**",
            "• التشخيص الجديد يحتاج هدوء وخطوات واضحة. أنا هنا لأدعمك مهنياً وبكل تعاطف.",
            "",
            "**أهم ما تنتبهي له الآن**",
            "• ترتيب زيارة للطبيبة وكتابة أسئلتك.",
            "• متابعة الأعراض يومياً وتسجيلها.",
            "• الالتزام بالأدوية في مواعيدها.",
            "• الاهتمام بالنوم، التغذية، والماء.",
            "",
            "**أسئلة للطبيبة**",
            "• نوع ومرحلة الحالة؟",
            "• خطة العلاج وخطواتها؟",
            "• الآثار الجانبية وكيف أتعامل معها؟",
            "• متى أتواصل فوراً أو أذهب للطوارئ؟",
            "",
            "**متى تطلبين عناية عاجلة**",
            "• ألم صدر شديد، صعوبة تنفس، نزيف شديد، حرارة مرتفعة مستمرة.",
            "",
            "**الخطوة التالية**",
            "• أقدر أجهز لكِ قائمة أسئلة للطبيبة وأضيف تذكيرات للأدوية والمتابعة. تحبي أبدأ؟",
          ].join("\n")
        : [
            "**Overview**",
            "• A new diagnosis is overwhelming. We'll take calm, clear steps together.",
            "",
            "**Pay Attention Now**",
            "• Book your doctor visit and write your questions.",
            "• Track symptoms daily.",
            "• Take medications on time and follow instructions.",
            "• Prioritize sleep, nutrition, and hydration.",
            "",
            "**Questions for Your Doctor**",
            "• Exact type and stage?",
            "• Treatment plan and timeline?",
            "• Expected side effects and management?",
            "• When to call urgently or go to ER?",
            "",
            "**When to Seek Urgent Care**",
            "• Severe chest pain, difficulty breathing, heavy bleeding, persistent high fever.",
            "",
            "**Next Step**",
            "• I can prepare a question list and set reminders. Shall I start?",
          ].join("\n");
      return formatResponse(text, true, user.name, responseLang);
    }

    const stressKeywordsEn = ['stress', 'stressed', 'pressure', 'panic', 'overwhelmed'];
    const stressKeywordsAr = ['توتر', 'متوترة', 'ضغط', 'مضغوطة', 'مجهدة', 'مرهقة', 'بانك', 'هلع'];
    const isStressQuestion = stressKeywordsEn.some(k => lowerMessage.includes(k)) ||
                             stressKeywordsAr.some(k => lowerMessageAr.includes(k));
    if (isStressQuestion) {
      const msg = responseLang === "ar"
        ? [
            "أنا فاهماكي… التوتر والضغط ممكن يكونوا مُرهقين جداً. خلينا نجرّب خطوات بسيطة وآمنة تساعدك الآن:",
            "",
            "• تنفّس 4-6: خدي شهيق 4 ثواني، وطلّعي الزفير 6 ثواني، وكرري 5 مرات.",
            "• اكتبي 3 أشياء مزعلاكي + 1 خطوة صغيرة تقدري تعمليها النهارده.",
            "• قلّلي الكافيين آخر اليوم، وحاولي تمشي 10 دقائق لو تقدري.",
            "• نامي/ريّحي جسمك قدر الإمكان، واشربي مية.",
            "",
            "ولو التوتر شديد أو بيأثر على نومك/أكلك أو معاها خفقان شديد/دوخة/أفكار إيذاء للنفس، الأفضل تتواصلي مع طبيبة أو مختص فوراً.",
            "",
            "تحبي تقوليلي التوتر سببه إيه غالباً: علاج/أعراض/قلق على العيلة/شغل؟"
          ].join("\n")
        : [
            "I hear you—stress and pressure can be exhausting. Here are a few safe, simple steps you can try right now:",
            "",
            "• 4–6 breathing: inhale 4 seconds, exhale 6 seconds, repeat 5 times.",
            "• Write down 3 stressors + 1 small step you can do today.",
            "• Reduce caffeine later in the day and try a 10-minute walk if you can.",
            "• Rest your body when possible and hydrate.",
            "",
            "If stress is severe or affects sleep/appetite, or you have strong palpitations/dizziness/self-harm thoughts, please contact a clinician urgently.",
            "",
            "Would you like to share what’s driving the stress most: treatment, symptoms, family, or work?"
          ].join("\n");
      return formatResponse(msg, false, user.name, responseLang);
    }

    // Emotional support keywords (Expanded)
    const emotionalKeywordsEn = ['scared', 'afraid', 'anxious', 'worried', 'depressed', 'sad', 'fear', 'anxiety', 'lonely', 'pain', 'hurt', 'tired'];
    const emotionalKeywordsAr = ['خائفة', 'خوف', 'قلقة', 'قلق', 'توتر', 'متوترة', 'ضغط', 'مضغوطة', 'مكتئبة', 'حزينة', 'وجع', 'ألم', 'تعبانة', 'محدش حاسس', 'وحيدة', 'عيالي', 'اطفالي'];
    const needsEmotionalSupport = emotionalKeywordsEn.some(k => lowerMessage.includes(k)) ||
                                  emotionalKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (needsEmotionalSupport) {
       // Customized response for "pain" and "kids" mentioned in user input
       if (lowerMessageAr.includes('عيالي') || lowerMessageAr.includes('اطفالي')) {
           const msg = responseLang === "ar"
             ? "أنا مقدرة تماماً خوفك على أطفالك، وده شعور نابع من حبك الكبير ليهم. حالتك النفسية جزء مهم جداً من رحلة العلاج. خلينا نركز مع بعض إزاي نخفف القلق ده عشان تقدري تكوني في أحسن حال ليهم. إحنا هنا جنبك ومش هنسيبك."
             : "I deeply appreciate your fear for your children, which comes from your great love for them. Your mental state is a very important part of the healing journey. Let's focus together on how to alleviate this anxiety so you can be at your best for them. We are here with you.";
           return formatResponse(msg, false, user.name, responseLang);
       }

      let response = RESPONSE_TEMPLATES.emotionalSupport(responseLang);
      response = response.replace('[situation]', responseLang === "ar" ? 'اللي بتمر بيه ده' : 'this situation')
                         .replace('[emotion]', responseLang === "ar" ? 'بالمشاعر دي' : 'this way');
      return formatResponse(response, false, user.name, responseLang);
    }
    
    // ... rest of logic
    
    // Symptom inquiries
    const symptomKeywordsEn = ['symptom', 'pain', 'lump', 'discharge', 'change', 'ache', 'tenderness'];
    const symptomKeywordsAr = ['عرض', 'ألم', 'كتلة', 'إفرازات', 'تغيير', 'وجع', 'ألم'];
    const isSymptomInquiry = symptomKeywordsEn.some(k => lowerMessage.includes(k)) ||
                             symptomKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (isSymptomInquiry) {
      const needsDisclaimer = needsMedicalDisclaimer(userMessage);
      let response = RESPONSE_TEMPLATES.symptomInquiry(responseLang);
      response = response.replace(/\[symptom\]/g, responseLang === "ar" ? 'هذه الأعراض' : 'these symptoms');
      return formatResponse(response, needsDisclaimer, user.name, responseLang);
    }
    
    // Treatment-related questions
    const treatmentKeywordsEn = ['treatment', 'chemotherapy', 'radiation', 'surgery', 'therapy', 'exam', 'checkup', 'screening', 'mammogram'];
    const treatmentKeywordsAr = [
      'علاج',
      'علاج كيميائي',
      'العلاج الكيميائي',
      'العلاج الكيمائي',
      'العلاج الكيماوي',
      'كيميائي',
      'كيمائي',
      'كيماوي',
      'إشعاع',
      'الإشعاع',
      'جراحة',
      'فحص',
      'كشف',
      'أشعة',
      'ماموجرام',
      'سونار'
    ];
    const isTreatmentQuestion = treatmentKeywordsEn.some(k => lowerMessage.includes(k)) ||
                                treatmentKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (isTreatmentQuestion) {
      return formatResponse(RESPONSE_TEMPLATES.treatmentSupport(responseLang), false, user.name, responseLang);
    }
    
    // Fallback for Counselor Mode if no keywords matched (placed late to allow medical queries first)
    if (activeMode === 'psych') {
      const counselorMsg = responseLang === "ar"
        ? "أنا سامعاكي ومقدرة جداً كل كلمة بتقوليها. خرجي كل اللي جواكي، أنا هنا عشانك. تحبي تحكيلي أكتر عن اللي مضايقك؟"
        : "I hear you and I appreciate every word you say. Let it all out, I'm here for you. Would you like to tell me more about what's bothering you?";
      return formatResponse(counselorMsg, false, user.name, responseLang);
    }
    
    // General supportive response
    const needsDisclaimer = needsMedicalDisclaimer(userMessage);
    let response = responseLang === "ar"
      ? `شكراً لك على المشاركة، ${user.name}. أفهم قلقك وأنا هنا للمساعدة. `
      : `Thank you for sharing, ${user.name}. I understand your concern and I'm here to help. `;
    
    const questionKeywordsEn = ['question', 'what', 'how', 'why', 'when', 'where'];
    const questionKeywordsAr = ['سؤال', 'ماذا', 'ما هو', 'كيف', 'ازاي', 'ليه', 'لماذا', 'متى', 'فين', 'أين'];
    const isQuestion = questionKeywordsEn.some(k => lowerMessage.includes(k)) ||
                       questionKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (isQuestion) {
      response += responseLang === "ar"
        ? "هذا سؤال رائع! دعيني أقدم لك بعض المعلومات المفيدة. "
        : "That's a great question! Let me provide you with some helpful information. ";
    } else {
      response += responseLang === "ar"
        ? "أنا هنا للاستماع ودعمك. "
        : "I'm here to listen and support you. ";
    }
    
    response += responseLang === "ar"
      ? "هل تريدين مني مساعدتك في فهم المزيد عن هذا، أم تفضلين مناقشة شيء آخر؟"
      : "Would you like me to help you understand more about this, or would you prefer to discuss something else?";
    
    return formatResponse(response, needsDisclaimer, user.name, responseLang);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    // توليد System Prompt ديناميكي حسب لغة الرسالة المدخلة
    const user = getCurrentUser();
    const responseLanguage = detectLanguage(currentMessage);
    const system = generateSystemPrompt({
      userName: user?.name || "User",
      userType: (user?.userType as "fighter" | "survivor" | "wellness") || "wellness",
      currentDate: new Date().toLocaleDateString(),
      language: responseLanguage,
      mode: activeMode
    });

    try {
      // Prepare history for multi-turn context
      const history = messages.slice(-10).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // محاولـة الرد عبر Gemini من الباكند
      const result = await apiAI.chat({ 
        prompt: currentMessage, 
        system, 
        history,
        mode: activeMode 
      });
      const resultObj = result as Record<string, unknown>;
      const isFallback = resultObj?.fallback === true;
      
      const aiResponseContent = String(resultObj?.text || "");

      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponseContent || generateAIResponse(currentMessage),
      };
      setMessages((prev) => [...prev, aiResponse]);

      if (isFallback) {
        toast({
          title: user?.language === 'ar' ? "وضع عدم الاتصال" : "Offline Mode Active",
          description: user?.language === 'ar' 
            ? "خدمة الذكاء الاصطناعي السحابية غير متاحة حالياً، وسأستخدم الردود المحلية مؤقتاً. 💗"
            : "Cloud AI is currently unavailable. Using local responses for now. 💗",
          variant: "default",
          className: "bg-blue-50 border-blue-200 text-blue-800"
        });
      }
    } catch (err: Error | unknown) {
      // في حال الفشل، نستخدم الرد المحلي ونظهر Toast
      const aiResponseContent = generateAIResponse(currentMessage);
      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponseContent,
      };
      setMessages((prev) => [...prev, aiResponse]);
      
      // Only show toast if it's not a common network error to avoid spamming
      console.warn("AI Service Error:", err);
      toast({
        title: user?.language === 'ar' ? "وضع عدم الاتصال" : "Offline Mode Active",
        description: user?.language === 'ar' 
          ? "أواجه مشكلة في الاتصال بالإنترنت، لكنني ما زلت هنا لدعمك بمعلوماتي المخزنة. 💗"
          : "I'm having trouble connecting to the cloud, but I'm still here to support you with my built-in knowledge. 💗",
        variant: "default",
        className: "bg-blue-50 border-blue-200 text-blue-800"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const handleSymptomAnalysis = async () => {
    if (!symptomText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please describe your symptoms first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const user = getCurrentUser();
    const responseLang = user?.language || "en";

    try {
      const system = generateSystemPrompt({
        userName: user?.name || "User",
        userType: (user?.userType as "fighter" | "survivor" | "wellness") || "wellness",
        currentDate: new Date().toLocaleDateString(),
        language: responseLang,
      });

      const result = await apiAI.chat({ 
        prompt: `Analyze these symptoms and provide guidance: ${symptomText}`, 
        system 
      });
      
      const resultObj = result as Record<string, unknown>;
      const isFallback = resultObj?.fallback === true;
      const analysisText = String(resultObj?.text || "") || generateAIResponse(symptomText);
      setSymptomResult(analysisText);

      if (isFallback) {
        toast({
          title: "AI service unavailable",
          description: "Using local analysis for now.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const fallbackResponse = generateAIResponse(symptomText);
      setSymptomResult(fallbackResponse);
      toast({
        title: "AI service unavailable",
        description: "Using local analysis for now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages to localStorage whenever they change for the current conversation
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !currentConversationId) return;
    const listKey = `hb_chat_conversations_user_${user.id}`;
    const storedList = localStorage.getItem(listKey);
    const convs: Conversation[] = storedList ? JSON.parse(storedList) : [];
    const idx = convs.findIndex(c => c.id === currentConversationId);
    if (idx >= 0) {
      convs[idx] = { ...convs[idx], messages, updatedAt: Date.now() };
      localStorage.setItem(listKey, JSON.stringify(convs));
      setConversations(convs);
    }
  }, [messages, currentConversationId]);

  return (
    <div className="min-h-screen gradient-blush">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/${userType}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              {activeMode === 'psych' ? "Virtual Counselor" : "AI Health Assistant"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/profile/${userType}`)}
            >
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                const u = getCurrentUser();
                if (u) {
                  localStorage.removeItem(`hb_chat_current_conversation_user_${u.id}`);
                  localStorage.removeItem(`hb_chat_conversations_user_${u.id}`);
                }
                logoutUser();
                toast({
                  title: "Logged Out",
                  description: "You have been successfully logged out.",
                });
                navigate("/");
              }}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat Companion</TabsTrigger>
            <TabsTrigger value="image">Image Analysis</TabsTrigger>
            <TabsTrigger value="symptoms">Symptom Analysis</TabsTrigger>
          </TabsList>

          {/* Chat Companion Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  {activeMode === 'psych' ? "Psychological Counseling & Support" : "Virtual Support & Psychological Companion"}
                </h2>

                <div className="flex p-1 bg-muted rounded-lg mb-4 w-full sm:w-fit">
                  <button
                    onClick={() => setActiveMode('health')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeMode === 'health' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    {getCurrentUser()?.language === "ar" ? "مساعد صحي" : "Health Assistant"}
                  </button>
                  <button
                    onClick={() => setActiveMode('psych')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeMode === 'psych' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    {getCurrentUser()?.language === "ar" ? "طبيبة نفسية" : "Psych Counselor"}
                  </button>
                </div>

              <p className="text-muted-foreground">
                I'm here to listen, support, and guide you through your journey. 
                Share your feelings, ask questions, or just chat. Remember, I provide 
                guidance and support, not medical diagnoses.
              </p>
              
              {/* Chat toolbar */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const user = getCurrentUser();
                    if (!user) return;
                    const listKey = `hb_chat_conversations_user_${user.id}`;
                    const currentKey = `hb_chat_current_conversation_user_${user.id}`;
                    const storedList = localStorage.getItem(listKey);
                    const convs: Conversation[] = storedList ? JSON.parse(storedList) : [];
                    const userLanguage = user.language || "en";
                    const newConv: Conversation = {
                      id: `conv_${Date.now()}`,
                      title: userLanguage === "ar" ? "محادثة جديدة" : "New Conversation",
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      messages: []
                    };
                    const nextConvs = [newConv, ...convs];
                    localStorage.setItem(listKey, JSON.stringify(nextConvs));
                    localStorage.setItem(currentKey, newConv.id);
                    setConversations(nextConvs);
                    setCurrentConversationId(newConv.id);
                    setMessages([]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {getCurrentUser()?.language === "ar" ? "محادثة جديدة" : "New Chat"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(v => !v)}
                >
                  <History className="w-4 h-4 mr-2" />
                  {getCurrentUser()?.language === "ar" ? "السجل" : "History"}
                </Button>
              </div>
            </div>

              {/* Quick Suggestions */}
              {suggestions.length === 0 && (() => {
                const user = getCurrentUser();
                if (user) {
                  const userLanguage = user.language || "en";
                  const contextualSuggestions = getContextualSuggestions(user.userType, userLanguage);
                  return (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {userLanguage === "ar" ? "اقتراحات سريعة:" : "Quick suggestions:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {contextualSuggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs"
                            dir={userLanguage === "ar" ? "rtl" : "ltr"}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* History Panel */}
              {showHistory && (() => {
                const user = getCurrentUser();
                if (!user) return null;
                const listKey = `hb_chat_conversations_user_${user.id}`;
                const convs: Conversation[] = conversations;
                const userLanguage = user.language || "en";
                return (
                  <div className="mb-4 p-3 border rounded-lg bg-muted/20">
                    <p className="text-sm font-medium mb-2">
                      {userLanguage === "ar" ? "سجل المحادثات" : "Conversation History"}
                    </p>
                    {convs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {userLanguage === "ar" ? "لا توجد محادثات محفوظة بعد." : "No saved conversations yet."}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {convs.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-md shadow-sm">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{c.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(c.updatedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCurrentConversationId(c.id);
                                  setMessages(c.messages);
                                  localStorage.setItem(`hb_chat_current_conversation_user_${user.id}`, c.id);
                                }}
                              >
                                {userLanguage === "ar" ? "فتح" : "Open"}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const nextConvs = convs.filter(cc => cc.id !== c.id);
                                  setConversations(nextConvs);
                                  localStorage.setItem(listKey, JSON.stringify(nextConvs));
                                  if (currentConversationId === c.id && nextConvs.length > 0) {
                                    const nextId = nextConvs[0].id;
                                    setCurrentConversationId(nextId);
                                    setMessages(nextConvs[0].messages);
                                    localStorage.setItem(`hb_chat_current_conversation_user_${user.id}`, nextId);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/30 rounded-lg">
                {messages.map((msg) => {
                  const isArabic = /[\u0600-\u06FF]/.test(msg.content);
                  const dir = isArabic ? "rtl" : "ltr";
                  
                  // Format message content for display
                  const formatMessageContent = (text: string) => {
                    return text.split('\n').map((line, lineIdx) => {
                      let processedLine = line.trim();
                      
                      // Handle Headers (e.g. ### Title)
                      const headerMatch = processedLine.match(/^(#{1,6})\s+(.*)/);
                      if (headerMatch) {
                        return (
                          <div key={lineIdx} className="font-bold text-lg mt-4 mb-2 text-primary">
                            {headerMatch[2]}
                          </div>
                        );
                      }

                      // Handle Bullet Points
                      const isBullet = processedLine.startsWith('* ') || processedLine.startsWith('- ') || processedLine.startsWith('• ');
                      if (isBullet) {
                        processedLine = processedLine.replace(/^[\*\-\•]\s*/, '').trim();
                      }

                      // Handle Numbered Lists
                      const numberMatch = processedLine.match(/^(\d+)\.\s+(.*)/);
                      let isNumber = false;
                      let numberLabel = '';
                      if (numberMatch) {
                        isNumber = true;
                        numberLabel = numberMatch[1] + '.';
                        processedLine = numberMatch[2];
                      }

                      // Process Inline Formatting (Bold & Italic)
                      const processInline = (str: string): (string | JSX.Element)[] => {
                        const parts: (string | JSX.Element)[] = [];
                        // Split by Bold (**...**)
                        const boldParts = str.split(/(\*\*.*?\*\*)/g);
                        
                        boldParts.forEach((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                             parts.push(<strong key={`b-${i}`} className="font-bold">{part.slice(2, -2)}</strong>);
                          } else {
                             // Process Italics (_..._) inside non-bold parts
                             const italicParts = part.split(/(_.*?_)/g);
                             italicParts.forEach((subPart, j) => {
                               if (subPart.startsWith('_') && subPart.endsWith('_')) {
                                 parts.push(<em key={`i-${i}-${j}`} className="italic text-primary/90">{subPart.slice(1, -1)}</em>);
                               } else {
                                 if (subPart) parts.push(subPart);
                               }
                             });
                          }
                        });
                        return parts;
                      };

                      return (
                        <div 
                          key={lineIdx} 
                          className={`
                            ${isBullet || isNumber ? 'flex items-start gap-2 ms-4 mb-1' : 'min-h-[1.5rem] mb-1'} 
                          `}
                        >
                          {isBullet && (
                            <span className="text-primary font-bold mt-2 text-[8px] shrink-0">●</span>
                          )}
                          {isNumber && (
                            <span className="text-primary font-bold shrink-0 min-w-[1.2rem]">{numberLabel}</span>
                          )}
                          <div className="flex-1 leading-relaxed">
                            {processInline(processedLine)}
                          </div>
                        </div>
                      );
                    });
                  };
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-white shadow-soft text-foreground"
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap space-y-1" dir={dir}>
                          {formatMessageContent(msg.content)}
                        </div>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Assistant typing indicator while loading */}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl p-4 bg-white shadow-soft text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                {(() => {
                  const user = getCurrentUser();
                  const userLanguage = user?.language || "en";
                  const isArabic = /[\u0600-\u06FF]/.test(message);
                  const inputDir = isArabic || userLanguage === "ar" ? "rtl" : "ltr";
                  
                  return (
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                      placeholder={userLanguage === "ar" ? "اكتبي رسالتك هنا..." : "Type your message here..."}
                      className="flex-1"
                      dir={inputDir}
                    />
                  );
                })()}
                <Button
                  onClick={handleSendMessage}
                  className="gradient-rose text-white"
                  disabled={isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Image Analysis Tab */}
          <TabsContent value="image" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Image className="w-6 h-6 text-primary" />
                  Medical Image & Report Analysis
                </h2>
                <p className="text-muted-foreground">
                  Upload X-ray images or medical reports. Our AI will analyze them using 
                  advanced CNN and OCR technology to provide simplified explanations. 
                  <strong className="text-foreground"> This is guidance only, not a medical diagnosis.</strong>
                </p>
              </div>

              <div className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center space-y-4">
                <Upload className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Upload Medical Image or Report
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported formats: JPG, PNG, PDF
                  </p>
                  <Button className="gradient-rose text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Important:</strong> This analysis is for informational purposes only. 
                  Always consult with your healthcare provider for medical decisions and diagnoses.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Symptom Analysis Tab */}
          <TabsContent value="symptoms" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Textual Symptom Analysis (NLP)
                </h2>
                <p className="text-muted-foreground">
                  Describe your symptoms or condition in Arabic or English. Our AI will 
                  categorize your situation and provide guidance.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Describe your symptoms or concerns
                  </label>
                  <textarea
                    className="w-full min-h-[200px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Type in Arabic or English..."
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                  />
                </div>

                <Button 
                  className="gradient-rose text-white w-full"
                  onClick={handleSymptomAnalysis}
                  disabled={isLoading}
                >
                  {isLoading ? "Analyzing..." : "Analyze Symptoms"}
                </Button>

                {symptomResult && (
                  <div className="mt-4 p-4 bg-white border border-primary/20 shadow-soft rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-foreground whitespace-pre-wrap">
                        {symptomResult}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Categories:</strong> Normal | Requires Monitoring | High Risk
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AIHealthAssistant;
