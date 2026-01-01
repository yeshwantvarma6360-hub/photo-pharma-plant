import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, X, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { languageNames } from '@/lib/translations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crop-chat`;

interface ChatSystemProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ isOpen = true, onClose }) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { speak, stop, isSpeaking } = useSpeech(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set initial greeting in selected language
  useEffect(() => {
    const greetings: Record<string, string> = {
      en: "Hello! I'm CropGuard AI, your agricultural assistant. I can help you identify crop diseases, recommend treatments (both organic and chemical), and provide farming best practices. How can I assist you today?",
      hi: "नमस्ते! मैं क्रॉपगार्ड AI हूं, आपका कृषि सहायक। मैं फसल रोगों की पहचान, उपचार (जैविक और रासायनिक दोनों) की सिफारिश, और खेती की सर्वोत्तम प्रथाओं में आपकी मदद कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
      te: "హలో! నేను క్రాప్‌గార్డ్ AI, మీ వ్యవసాయ సహాయకుడిని. పంట వ్యాధులను గుర్తించడం, చికిత్సలను (సేంద్రియ మరియు రసాయన రెండూ) సిఫార్సు చేయడం మరియు వ్యవసాయ ఉత్తమ అభ్యాసాలను అందించడంలో నేను మీకు సహాయం చేయగలను. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
      kn: "ಹಲೋ! ನಾನು ಕ್ರಾಪ್‌ಗಾರ್ಡ್ AI, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆ ರೋಗಗಳನ್ನು ಗುರುತಿಸಲು, ಚಿಕಿತ್ಸೆಗಳನ್ನು (ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಎರಡೂ) ಶಿಫಾರಸು ಮಾಡಲು ಮತ್ತು ಕೃಷಿ ಉತ್ತಮ ಅಭ್ಯಾಸಗಳನ್ನು ಒದಗಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      ta: "வணக்கம்! நான் கிராப்கார்ட் AI, உங்கள் விவசாய உதவியாளர். பயிர் நோய்களைக் கண்டறிய, சிகிச்சைகளை (இயற்கை மற்றும் ரசாயனம் இரண்டையும்) பரிந்துரைக்க மற்றும் விவசாய சிறந்த நடைமுறைகளை வழங்க நான் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      bn: "হ্যালো! আমি ক্রপগার্ড AI, আপনার কৃষি সহকারী। আমি ফসলের রোগ চিহ্নিত করতে, চিকিৎসা (জৈব এবং রাসায়নিক উভয়) সুপারিশ করতে এবং কৃষি সেরা অনুশীলন প্রদান করতে সাহায্য করতে পারি। আজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
      es: "¡Hola! Soy CropGuard AI, tu asistente agrícola. Puedo ayudarte a identificar enfermedades de cultivos, recomendar tratamientos (tanto orgánicos como químicos) y proporcionar las mejores prácticas agrícolas. ¿Cómo puedo asistirte hoy?",
      fr: "Bonjour! Je suis CropGuard AI, votre assistant agricole. Je peux vous aider à identifier les maladies des cultures, recommander des traitements (biologiques et chimiques) et fournir les meilleures pratiques agricoles. Comment puis-je vous aider aujourd'hui?",
      pt: "Olá! Eu sou o CropGuard AI, seu assistente agrícola. Posso ajudá-lo a identificar doenças de culturas, recomendar tratamentos (orgânicos e químicos) e fornecer as melhores práticas agrícolas. Como posso ajudá-lo hoje?",
    };

    setMessages([{
      id: '1',
      role: 'assistant',
      content: greetings[language] || greetings.en,
      timestamp: new Date(),
    }]);
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: { role: string; content: string }[]) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: userMessages,
        language: languageNames[language] 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response');
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant' && last.id === 'streaming') {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, {
                id: 'streaming',
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
              }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Finalize the message with a proper ID
    setMessages(prev => prev.map(m => 
      m.id === 'streaming' ? { ...m, id: Date.now().toString() } : m
    ));

    return assistantContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const userMessages = [...messages.filter(m => m.id !== '1'), userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(userMessages);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="glass-card h-[500px] flex flex-col">
      <CardHeader className="pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            {t('chatTitle')}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && message.id !== 'streaming' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeak(message.content)}
                      className="mt-2 h-7 px-2 text-xs"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3 h-3 mr-1" />
                          {t('stopSpeaking')}
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 mr-1" />
                          {t('speakResponse')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chatPlaceholder')}
              className="flex-1 bg-muted/50 border-border/50"
              disabled={isLoading}
            />
            <Button onClick={handleSend} size="icon" disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSystem;
