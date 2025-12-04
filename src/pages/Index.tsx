import React, { useState, useCallback } from 'react';
import { Leaf, Sparkles } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import ImageUploader from '@/components/ImageUploader';
import DiseaseResults from '@/components/DiseaseResults';
import ChatSystem from '@/components/ChatSystem';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { DiseaseResult, getRandomDisease } from '@/lib/mockData';
import heroBg from '@/assets/hero-bg.jpg';

const MainContent: React.FC = () => {
  const { t } = useLanguage();
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000));

    const disease = getRandomDisease();
    setResult(disease);
    setIsAnalyzing(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        
        <div className="relative container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Leaf className="w-7 h-7 text-primary" />
              </div>
              <span className="text-2xl font-bold gradient-text">{t('title')}</span>
            </div>
            <LanguageSelector />
          </nav>

          <div className="text-center max-w-3xl mx-auto py-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-slide-up">
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
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Results */}
          <div className="space-y-6">
            <ImageUploader onImageUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
            <DiseaseResults result={result} />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:sticky lg:top-8 h-fit">
            <ChatSystem />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
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
