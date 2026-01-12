import React, { useState, useCallback } from 'react';
import { Leaf, Sparkles, MessageCircle, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LanguageSelector from '@/components/LanguageSelector';
import ImageUploader from '@/components/ImageUploader';
import DiseaseResults from '@/components/DiseaseResults';
import ChatSystem from '@/components/ChatSystem';
import WeatherWidget from '@/components/WeatherWidget';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { DiseaseResult } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import heroBg from '@/assets/hero-bg.jpg';

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-crop`;

const MainContent: React.FC = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notPlantError, setNotPlantError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (imageBase64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setNotPlantError(null);

    try {
      const response = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          imageBase64,
          language 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      
      if (data.isPlant === false) {
        setNotPlantError(data.notPlantMessage || 'This image does not appear to contain a plant. Please upload a clear photo of a plant, leaf, or crop for disease analysis.');
        toast({
          title: '🌱 Not a Plant Image',
          description: 'Please upload a photo of a plant or crop',
          variant: 'destructive',
        });
        return;
      }

      setResult(data);

      toast({
        title: data.isHealthy ? '✅ Healthy Crop Detected' : '⚠️ Disease Detected',
        description: `${data.name} - ${data.confidence}% confidence`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Please try again with a clearer image',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [language, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Animated Background Elements - Hidden on mobile for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden sm:block">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        
        <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <nav className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-slow flex-shrink-0">
                <Leaf className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-2xl font-bold gradient-text truncate">{t('title')}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">AI Crop Health</span>
              </div>
            </div>
            <LanguageSelector />
          </nav>

          {/* Weather Widget */}
          <div className="mb-4 sm:mb-8">
            <WeatherWidget />
          </div>

          <div className="text-center max-w-3xl mx-auto py-4 sm:py-8 px-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary text-xs sm:text-sm font-semibold mb-4 sm:mb-6 animate-slide-up border border-primary/20 shadow-lg backdrop-blur-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
              <span className="hidden xs:inline">AI-Powered Disease Detection</span>
              <span className="xs:hidden">AI Disease Detection</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-6 animate-slide-up-delay-1 leading-tight">
              Protect Your Crops with
              <span className="gradient-text block mt-1 sm:mt-2">Intelligent Analysis</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up-delay-2 leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className={`transition-all duration-500 ease-out ${isChatOpen ? 'lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8' : ''}`}>
          {/* Main Column - Upload & Results */}
          <div className={`space-y-4 sm:space-y-6 transition-all duration-500 ${isChatOpen ? '' : 'max-w-4xl mx-auto'}`}>
            <ImageUploader onImageUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
            
            {/* Not a Plant Error Alert */}
            {notPlantError && (
              <Alert variant="destructive" className="animate-slide-up border-2">
                <ImageOff className="h-4 w-4 sm:h-5 sm:w-5" />
                <AlertTitle className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                  Not a Plant Image
                </AlertTitle>
                <AlertDescription className="mt-2 text-xs sm:text-sm">
                  {notPlantError}
                </AlertDescription>
              </Alert>
            )}
            
            <DiseaseResults result={result} />
          </div>

          {/* Chat Column - Only visible when open */}
          {isChatOpen && (
            <div className="lg:sticky lg:top-4 xl:top-8 h-fit mt-4 sm:mt-6 lg:mt-0 animate-slide-in-right">
              <ChatSystem 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                analysisResult={result}
              />
            </div>
          )}
        </div>

        {/* Open Chat Button - Shown when chat is closed */}
        {!isChatOpen && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-fade-in">
            <Button
              onClick={() => setIsChatOpen(true)}
              className="h-12 sm:h-16 px-4 sm:px-6 text-sm sm:text-lg shadow-2xl shadow-primary/30 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-white/20"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              <span className="hidden sm:inline">{t('openChat')}</span>
              <span className="sm:hidden">Chat</span>
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/50 mt-8 sm:mt-16 bg-gradient-to-t from-muted/50 to-transparent">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="font-bold text-foreground text-sm sm:text-base">CropGuard AI</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Empowering farmers with AI-driven crop health insights
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
};

export default Index;
