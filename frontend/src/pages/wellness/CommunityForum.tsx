import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  Users, 
  Shield, 
  Info,
  MoreVertical,
  LogOut,
  Bell,
  User as UserIcon,
  Flower2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "@/lib/database";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Message {
  sender: string;
  message: string;
  timestamp: string;
  isMe: boolean;
}

const CommunityForum = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineCount, setOnlineCount] = useState(1); // Mock count for now
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const user = getCurrentUser();
  const userName = user?.name || "Anonymous";

  // Determine room based on userType to group similar users
  const roomName = userType || "general";

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io(import.meta.env.VITE_API_BASE?.replace('/api', '') || "http://localhost:4000");

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      newSocket.emit("join_room", roomName);
      
      toast({
        title: t('community.connected'),
        description: t('community.joined_room', { room: t(`auth.${userType === 'wellness' ? 'health_conscious_woman' : userType === 'fighter' ? 'breast_cancer_fighter' : 'survivor'}`) }),
      });
    });

    newSocket.on("receive_message", (data: { sender: string; message: string; timestamp: string }) => {
      setMessages((prev) => [...prev, {
        sender: data.sender,
        message: data.message,
        timestamp: data.timestamp,
        isMe: data.sender === userName
      }]);
    });

    newSocket.on("notification", (data: { type: string; message: string }) => {
      if (data.type === 'user_joined') {
        setOnlineCount(prev => prev + 1);
      }
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from socket server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomName, userName, userType, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;

    const messageData = {
      room: roomName,
      sender: userName,
      message: message,
      timestamp: new Date().toISOString()
    };

    socket.emit("send_message", messageData);
    setMessage("");
  };

  const getRoomTitle = () => {
    switch (userType) {
      case 'fighter': return t('auth.breast_cancer_fighter');
      case 'survivor': return t('auth.survivor');
      case 'wellness': return t('auth.health_conscious_woman');
      default: return "Community";
    }
  };

  return (
    <div className="min-h-screen gradient-blush flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/mental-wellness/${userType}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {t('mental.community_forum')}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {getRoomTitle()} • {onlineCount} {t('community.online')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon">
              <Shield className="w-5 h-5 text-primary" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        {/* Safety Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {t('community.safety_notice')}
          </p>
        </div>

        {/* Messages List */}
        <Card className="flex-1 bg-white/60 backdrop-blur-sm shadow-soft mb-4 p-4 overflow-y-auto min-h-[500px] flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('community.welcome_msg')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('community.welcome_desc')}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[80%] ${msg.isMe ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`${msg.isMe ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    {msg.sender.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {msg.isMe ? t('community.you') : msg.sender}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-2xl text-sm ${
                      msg.isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white shadow-sm border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </Card>

        {/* Input Area */}
        <div className="bg-white p-4 rounded-xl shadow-soft flex gap-2 items-center">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('community.type_message')}
            className="flex-1 bg-gray-50 border-gray-200"
          />
          <Button 
            onClick={handleSendMessage}
            className="gradient-rose text-white rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-glow hover:scale-105 transition-all"
            disabled={!message.trim() || !isConnected}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CommunityForum;
