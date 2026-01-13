import { useParams, useNavigate } from "react-router-dom";
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
  Trash2
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
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your compassionate AI health companion. How can I support you today? 💗",
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestions] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

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
    });
    localStorage.setItem('hopebloom_chatbot_prompt', systemPrompt);

    // Load conversations and current conversation pointer from localStorage
    const listKey = `hb_chat_conversations_user_${user.id}`;
    const currentKey = `hb_chat_current_conversation_user_${user.id}`;
    const storedList = localStorage.getItem(listKey);
    const storedCurrentId = localStorage.getItem(currentKey);

    let convs: Conversation[] = storedList ? JSON.parse(storedList) : [];
    let currentId: string | null = storedCurrentId || null;

    if (convs.length === 0) {
      const greeting = RESPONSE_TEMPLATES.greeting(user.name, user.userType, userLanguage);
      const initialConv: Conversation = {
        id: `conv_${Date.now()}`,
        title: userLanguage === "ar" ? "محادثة جديدة" : "New Conversation",
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
  }, [navigate, userType]);

  const generateAIResponse = (userMessage: string): string => {
    const user = getCurrentUser();
    if (!user) return "";
    
    // Detect language from user message or use user preference
    const detectedLang = detectLanguage(userMessage);
    const responseLang = user.language || detectedLang;
    
    const lowerMessage = userMessage.toLowerCase();
    const lowerMessageAr = userMessage; // For Arabic keyword detection
    
    // Emergency keywords in both languages
    const emergencyKeywordsEn = ['emergency', 'severe pain', "can't breathe", 'chest pain', 'severe bleeding'];
    const emergencyKeywordsAr = ['طوارئ', 'ألم شديد', 'لا أستطيع التنفس', 'ألم في الصدر', 'نزيف شديد'];
    const isEmergency = emergencyKeywordsEn.some(k => lowerMessage.includes(k)) || 
                        emergencyKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (isEmergency) {
      const emergencyMsg = responseLang === "ar"
        ? "أنا قلق بشأن ما تصفينه. إذا كنت تعانين من أعراض شديدة مثل ألم في الصدر أو صعوبة في التنفس أو نزيف شديد، يرجى طلب العناية الطبية الفورية أو الاتصال بخدمات الطوارئ على الفور. سلامتك هي الأولوية القصوى. 💗"
        : "I'm concerned about what you're describing. If you're experiencing severe symptoms like chest pain, difficulty breathing, or severe bleeding, please seek immediate medical attention or call emergency services right away. Your safety is the top priority. 💗";
      return formatResponse(emergencyMsg, false, user.name, responseLang);
    }
    
    // Emotional support keywords
    const emotionalKeywordsEn = ['scared', 'afraid', 'anxious', 'worried', 'depressed', 'sad', 'fear', 'anxiety'];
    const emotionalKeywordsAr = ['خائفة', 'خوف', 'قلقة', 'قلق', 'مكتئبة', 'حزينة', 'خوف', 'قلق'];
    const needsEmotionalSupport = emotionalKeywordsEn.some(k => lowerMessage.includes(k)) ||
                                  emotionalKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (needsEmotionalSupport) {
      let response = RESPONSE_TEMPLATES.emotionalSupport(responseLang);
      response = response.replace('[situation]', responseLang === "ar" ? 'هذا' : 'this')
                         .replace('[emotion]', responseLang === "ar" ? 'بهذه الطريقة' : 'this way');
      return formatResponse(response, false, user.name, responseLang);
    }
    
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
    const treatmentKeywordsEn = ['treatment', 'chemotherapy', 'radiation', 'surgery', 'therapy'];
    const treatmentKeywordsAr = ['علاج', 'علاج كيميائي', 'إشعاع', 'جراحة', 'علاج'];
    const isTreatmentQuestion = treatmentKeywordsEn.some(k => lowerMessage.includes(k)) ||
                                treatmentKeywordsAr.some(k => lowerMessageAr.includes(k));
    
    if (isTreatmentQuestion) {
      return formatResponse(RESPONSE_TEMPLATES.treatmentSupport(responseLang), false, user.name, responseLang);
    }
    
    // General supportive response
    const needsDisclaimer = needsMedicalDisclaimer(userMessage);
    let response = responseLang === "ar"
      ? `شكراً لك على المشاركة، ${user.name}. أفهم قلقك وأنا هنا للمساعدة. `
      : `Thank you for sharing, ${user.name}. I understand your concern and I'm here to help. `;
    
    const questionKeywordsEn = ['question', 'what', 'how', 'why', 'when', 'where'];
    const questionKeywordsAr = ['سؤال', 'ماذا', 'كيف', 'لماذا', 'متى', 'أين'];
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
    });

    try {
      // محاولـة الرد عبر Gemini من الباكند
      const result = await apiAI.chat({ prompt: currentMessage, system });
      const aiResponseContent = (result as any)?.text || "";
      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponseContent || generateAIResponse(currentMessage),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err: any) {
      // في حال الفشل، نستخدم الرد المحلي ونظهر Toast
      const aiResponseContent = generateAIResponse(currentMessage);
      const aiResponse: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponseContent,
      };
      setMessages((prev) => [...prev, aiResponse]);
      toast({
        title: "AI service unavailable",
        description: "Using local companion responses for now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  // Persist messages to localStorage whenever they change for the current conversation
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !currentConversationId) return;
    const listKey = `hb_chat_conversations_user_${user.id}`;
    const storedList = localStorage.getItem(listKey);
    let convs: Conversation[] = storedList ? JSON.parse(storedList) : [];
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
            <span className="text-xl font-bold text-foreground">AI Health Assistant</span>
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
                  Virtual Support & Psychological Companion
                </h2>
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
                      // Check if line has bold text
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const parts: (string | JSX.Element)[] = [];
                      let lastIndex = 0;
                      let match;
                      let key = 0;
                      
                      while ((match = boldRegex.exec(line)) !== null) {
                        // Add text before bold
                        if (match.index > lastIndex) {
                          parts.push(line.substring(lastIndex, match.index));
                        }
                        // Add bold text
                        parts.push(
                          <strong key={`bold-${key++}`} className="font-semibold">
                            {match[1]}
                          </strong>
                        );
                        lastIndex = match.index + match[0].length;
                      }
                      // Add remaining text
                      if (lastIndex < line.length) {
                        parts.push(line.substring(lastIndex));
                      }
                      
                      return (
                        <div key={lineIdx} className={line.trim().startsWith('•') ? "ml-4" : ""}>
                          {parts.length > 0 ? parts : line}
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

