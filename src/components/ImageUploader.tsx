import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (imageBase64: string) => void;
  isAnalyzing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isAnalyzing }) => {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        onImageUpload(base64);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer overflow-hidden",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          preview && "border-solid"
        )}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Uploaded crop" 
              className="w-full max-h-[300px] object-contain rounded-xl"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">{t('analyzing')}</p>
                </div>
              </div>
            )}
            {!isAnalyzing && (
              <button
                onClick={clearPreview}
                className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center gap-4 cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-slow">
              {isDragging ? (
                <ImageIcon className="w-10 h-10 text-primary" />
              ) : (
                <Upload className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground mb-1">{t('uploadTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('uploadDesc')}</p>
            </div>
            <Button variant="hero" size="lg">
              {t('uploadButton')}
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
