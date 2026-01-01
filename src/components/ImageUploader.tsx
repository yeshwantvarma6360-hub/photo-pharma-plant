import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Camera, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUpload: (imageBase64: string) => void;
  isAnalyzing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isAnalyzing }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: t('cameraPermission'),
        description: 'Please allow camera access in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setPreview(base64);
        onImageUpload(base64);
        stopCamera();
      }
    }
  };

  return (
    <div className="w-full">
      {showCamera ? (
        <div className="relative border-2 border-primary rounded-2xl overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            className="w-full max-h-[300px] object-cover"
            autoPlay
            playsInline
            muted
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button 
              onClick={capturePhoto}
              size="lg"
              className="rounded-full w-16 h-16 p-0 bg-white hover:bg-gray-100"
            >
              <Camera className="w-8 h-8 text-primary" />
            </Button>
            <Button 
              onClick={stopCamera}
              size="lg"
              variant="outline"
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
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
            <div className="flex flex-col items-center gap-4">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <label>
                  <Button variant="hero" size="lg" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('uploadButton')}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={startCamera}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t('takePhoto')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
