import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Camera, RefreshCw } from 'lucide-react';
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
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraReady, setIsCameraReady] = useState(false);
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

  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setIsCameraReady(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
      setShowCamera(true);
      setFacingMode(facing);
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: t('cameraPermission'),
        description: 'Please allow camera access in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const toggleCamera = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(newFacing);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && isCameraReady) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setPreview(base64);
        onImageUpload(base64);
        stopCamera();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full">
      {showCamera ? (
        <div className="relative border-2 border-primary rounded-2xl overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            className={cn(
              "w-full max-h-[350px] object-cover",
              facingMode === 'user' && "scale-x-[-1]"
            )}
            autoPlay
            playsInline
            muted
          />
          
          {/* Camera controls overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Camera loading indicator */}
          {!isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          )}
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
            {/* Switch Camera */}
            <Button 
              onClick={toggleCamera}
              size="lg"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            
            {/* Capture Button - Only enabled when camera is ready */}
            <Button 
              onClick={capturePhoto}
              size="lg"
              disabled={!isCameraReady}
              className="rounded-full w-20 h-20 p-0 bg-white hover:bg-gray-100 border-4 border-primary shadow-lg disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </Button>
            
            {/* Cancel */}
            <Button 
              onClick={stopCamera}
              size="lg"
              variant="outline"
              className="rounded-full w-12 h-12 p-0 bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Camera mode indicator */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur text-white text-xs font-medium">
            {facingMode === 'environment' ? '📷 Back Camera' : '🤳 Front Camera'}
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
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary/20" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{t('analyzing')}</p>
                    <p className="text-xs text-muted-foreground">Detecting plant diseases...</p>
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
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse-slow">
                  {isDragging ? (
                    <ImageIcon className="w-12 h-12 text-primary" />
                  ) : (
                    <Upload className="w-12 h-12 text-primary" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg">
                  🌱
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg text-foreground mb-1">{t('uploadTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('uploadDesc')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <label className="flex-1 sm:flex-initial">
                  <Button variant="hero" size="lg" className="w-full" asChild>
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
                  onClick={() => startCamera()}
                  className="border-primary/30 hover:bg-primary/10 flex-1 sm:flex-initial"
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
