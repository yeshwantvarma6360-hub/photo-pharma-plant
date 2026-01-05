import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, X, Volume2, VolumeX, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { languageNames } from '@/lib/translations';
import { DiseaseResult } from '@/lib/mockData';

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
  analysisResult?: DiseaseResult | null;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ isOpen = true, onClose, analysisResult }) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { speak, stop, isSpeaking, isLoading: isSpeechLoading } = useSpeech(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisContext, setAnalysisContext] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set initial greeting in selected language
  useEffect(() => {
    const greetings: Record<string, string> = {
      en: "Hello! I'm CropGuard AI, your agricultural assistant. I can help you identify crop diseases, recommend treatments (both organic and chemical), and provide farming best practices. Upload a plant image or ask me anything about farming!",
      hi: "नमस्ते! मैं क्रॉपगार्ड AI हूं, आपका कृषि सहायक। मैं फसल रोगों की पहचान, उपचार (जैविक और रासायनिक दोनों) की सिफारिश, और खेती की सर्वोत्तम प्रथाओं में आपकी मदद कर सकता हूं। एक पौधे की तस्वीर अपलोड करें या खेती के बारे में कुछ भी पूछें!",
      te: "హలో! నేను క్రాప్‌గార్డ్ AI, మీ వ్యవసాయ సహాయకుడిని. పంట వ్యాధులను గుర్తించడం, చికిత్సలను సిఫార్సు చేయడం మరియు వ్యవసాయ ఉత్తమ అభ్యాసాలను అందించడంలో నేను మీకు సహాయం చేయగలను. మొక్క చిత్రాన్ని అప్‌లోడ్ చేయండి లేదా వ్యవసాయం గురించి ఏదైనా అడగండి!",
      kn: "ಹಲೋ! ನಾನು ಕ್ರಾಪ್‌ಗಾರ್ಡ್ AI, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆ ರೋಗಗಳನ್ನು ಗುರುತಿಸಲು, ಚಿಕಿತ್ಸೆಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಲು ಮತ್ತು ಕೃಷಿ ಉತ್ತಮ ಅಭ್ಯಾಸಗಳನ್ನು ಒದಗಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಸಸ್ಯದ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಕೃಷಿ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ!",
      ta: "வணக்கம்! நான் கிராப்கார்ட் AI, உங்கள் விவசாய உதவியாளர். பயிர் நோய்களைக் கண்டறிய, சிகிச்சைகளை பரிந்துரைக்க மற்றும் விவசாய சிறந்த நடைமுறைகளை வழங்க நான் உங்களுக்கு உதவ முடியும். தாவர படத்தை பதிவேற்றவும் அல்லது விவசாயம் பற்றி எதையும் கேளுங்கள்!",
      bn: "হ্যালো! আমি ক্রপগার্ড AI, আপনার কৃষি সহকারী। আমি ফসলের রোগ চিহ্নিত করতে, চিকিৎসা সুপারিশ করতে এবং কৃষি সেরা অনুশীলন প্রদান করতে সাহায্য করতে পারি। একটি উদ্ভিদের ছবি আপলোড করুন বা কৃষি সম্পর্কে কিছু জিজ্ঞাসা করুন!",
      es: "¡Hola! Soy CropGuard AI, tu asistente agrícola. Puedo ayudarte a identificar enfermedades de cultivos, recomendar tratamientos y proporcionar las mejores prácticas agrícolas. ¡Sube una imagen de planta o pregúntame sobre agricultura!",
      fr: "Bonjour! Je suis CropGuard AI, votre assistant agricole. Je peux vous aider à identifier les maladies des cultures, recommander des traitements et fournir les meilleures pratiques agricoles. Téléchargez une image de plante ou posez-moi des questions sur l'agriculture!",
      pt: "Olá! Eu sou o CropGuard AI, seu assistente agrícola. Posso ajudá-lo a identificar doenças de culturas, recomendar tratamentos e fornecer as melhores práticas agrícolas. Faça upload de uma imagem de planta ou pergunte-me sobre agricultura!",
    };

    setMessages([{
      id: '1',
      role: 'assistant',
      content: greetings[language] || greetings.en,
      timestamp: new Date(),
    }]);
  }, [language]);

  // Update context when analysis result changes
  useEffect(() => {
    if (analysisResult && analysisResult.isPlant !== false) {
      const context = `
The user has just analyzed a crop image. Here are the results:
- Disease/Condition: ${analysisResult.name}
- Confidence: ${analysisResult.confidence}%
- Status: ${analysisResult.isHealthy ? 'Healthy' : 'Diseased'}
- Description: ${analysisResult.description}
- Precautions: ${analysisResult.precautions?.join(', ')}

Use this context to provide more relevant and personalized advice. When the user asks follow-up questions, relate your answers to this specific crop analysis.
`;
      setAnalysisContext(context);
      
      // Add a contextual message
      const contextMessages: Record<string, string> = {
        en: `I've analyzed your crop image! I detected **${analysisResult.name}** with ${analysisResult.confidence}% confidence. Feel free to ask me any questions about this diagnosis, treatment options, or general farming advice.`,
        hi: `मैंने आपकी फसल की छवि का विश्लेषण किया है! मैंने **${analysisResult.name}** का पता लगाया है ${analysisResult.confidence}% विश्वास के साथ। इस निदान, उपचार विकल्पों या सामान्य खेती सलाह के बारे में कोई भी प्रश्न पूछें।`,
        te: `మీ పంట చిత్రాన్ని విశ్లేషించాను! నేను **${analysisResult.name}** ను ${analysisResult.confidence}% నమ్మకంతో గుర్తించాను. ఈ రోగ నిర్ధారణ, చికిత్స ఎంపికలు లేదా సాధారణ వ్యవసాయ సలహా గురించి ఏవైనా ప్రశ్నలు అడగండి.`,
        kn: `ನಿಮ್ಮ ಬೆಳೆ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇನೆ! ನಾನು **${analysisResult.name}** ಅನ್ನು ${analysisResult.confidence}% ವಿಶ್ವಾಸದೊಂದಿಗೆ ಪತ್ತೆ ಮಾಡಿದ್ದೇನೆ. ಈ ರೋಗನಿರ್ಣಯ, ಚಿಕಿತ್ಸೆಯ ಆಯ್ಕೆಗಳು ಅಥವಾ ಸಾಮಾನ್ಯ ಕೃಷಿ ಸಲಹೆ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.`,
        ta: `உங்கள் பயிர் படத்தை பகுப்பாய்வு செய்தேன்! நான் **${analysisResult.name}** ஐ ${analysisResult.confidence}% நம்பிக்கையுடன் கண்டறிந்தேன். இந்த நோயறிதல், சிகிச்சை விருப்பங்கள் அல்லது பொதுவான விவசாய ஆலோசனை பற்றி ஏதேனும் கேள்விகளைக் கேளுங்கள்.`,
        bn: `আমি আপনার ফসলের ছবি বিশ্লেষণ করেছি! আমি **${analysisResult.name}** ${analysisResult.confidence}% আত্মবিশ্বাসের সাথে সনাক্ত করেছি। এই রোগ নির্ণয়, চিকিৎসার বিকল্প বা সাধারণ কৃষি পরামর্শ সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন।`,
        es: `¡He analizado la imagen de tu cultivo! Detecté **${analysisResult.name}** con ${analysisResult.confidence}% de confianza. No dudes en preguntarme sobre este diagnóstico, opciones de tratamiento o consejos agrícolas.`,
        fr: `J'ai analysé l'image de votre culture! J'ai détecté **${analysisResult.name}** avec ${analysisResult.confidence}% de confiance. N'hésitez pas à me poser des questions sur ce diagnostic, les options de traitement ou les conseils agricoles.`,
        pt: `Analisei a imagem da sua cultura! Detectei **${analysisResult.name}** com ${analysisResult.confidence}% de confiança. Sinta-se à vontade para me perguntar sobre este diagnóstico, opções de tratamento ou conselhos agrícolas.`,
      };

      setMessages(prev => [...prev, {
        id: `analysis-${Date.now()}`,
        role: 'assistant',
        content: contextMessages[language] || contextMessages.en,
        timestamp: new Date(),
      }]);
    }
  }, [analysisResult, language]);

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
        language: languageNames[language],
        context: analysisContext
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

    const userMessages = [...messages.filter(m => m.id !== '1' && !m.id.startsWith('analysis-')), userMessage].map(m => ({
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
    <Card className="glass-card h-[600px] flex flex-col shadow-2xl shadow-primary/10 border-2 border-border/60">
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse-slow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base">{t('chatTitle')}</span>
              {analysisContext && (
                <Badge variant="secondary" className="mt-0.5 text-xs w-fit bg-primary/10 text-primary border-primary/20">
                  <Leaf className="w-3 h-3 mr-1" />
                  Crop Analyzed
                </Badge>
              )}
            </div>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all">
              <X className="w-5 h-5" />
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
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md",
                  message.role === 'user' 
                    ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground" 
                    : "bg-gradient-to-br from-muted to-muted/50"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                  message.role === 'user'
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                    : "bg-gradient-to-br from-muted to-muted/80 text-foreground rounded-tl-sm"
                )}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && message.id !== 'streaming' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeak(message.content)}
                      disabled={isSpeechLoading}
                      className="mt-2 h-7 px-2 text-xs hover:bg-white/20"
                    >
                      {isSpeechLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Loading...
                        </>
                      ) : isSpeaking ? (
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-gradient-to-br from-muted to-muted/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chatPlaceholder')}
              className="flex-1 bg-background/80 border-border/50 focus:border-primary"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSystem;
