import React, { useState, useCallback } from 'react';
import { Leaf, Sparkles, MessageCircle, AlertCircle, ImageOff } from 'lucide-react';
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
  const [isChatOpen, setIsChatOpen] = useState(true);
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
      
      // Check if the image is not a plant
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
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        
        <div className="relative container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">{t('title')}</span>
            </div>
            <LanguageSelector />
          </nav>

          {/* Weather Widget */}
          <div className="mb-8">
            <WeatherWidget />
          </div>

          <div className="text-center max-w-3xl mx-auto py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-slide-up border border-primary/20 shadow-sm">
              <Sparkles className="w-4 h-4" />
              AI-Powered Disease Detection
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up-delay-1">
              Protect Your Crops with
              <span className="gradient-text block mt-2">Intelligent Analysis</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up-delay-2">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Results */}
          <div className="space-y-6">
            <ImageUploader onImageUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
            
            {/* Not a Plant Error Alert */}
            {notPlantError && (
              <Alert variant="destructive" className="animate-slide-up">
                <ImageOff className="h-5 w-5" />
                <AlertTitle className="flex items-center gap-2">
                  Not a Plant Image
                </AlertTitle>
                <AlertDescription className="mt-2">
                  {notPlantError}
                </AlertDescription>
              </Alert>
            )}
            
            <DiseaseResults result={result} />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:sticky lg:top-8 h-fit">
            {isChatOpen ? (
              <ChatSystem 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                analysisResult={result}
              />
            ) : (
              <Button
                onClick={() => setIsChatOpen(true)}
                className="w-full h-16 text-lg shadow-lg"
                variant="hero"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {t('openChat')}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Floating Chat Button (Mobile) */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl lg:hidden z-50 bg-gradient-to-br from-primary to-primary/80"
          size="icon"
        >
          <MessageCircle className="w-7 h-7" />
        </Button>
      )}

      {/* Footer */}
      <footer className="relative border-t border-border/50 mt-16 bg-gradient-to-t from-muted/50 to-transparent">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">CropGuard AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
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
