import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Camera, RefreshCw, SwitchCamera } from 'lucide-react';
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
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check for multiple cameras on mount
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (error) {
        console.log('Could not enumerate devices:', error);
      }
    };
    
    if (navigator.mediaDevices?.enumerateDevices) {
      checkCameras();
    }
  }, []);

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
      setCameraError(null);
      setShowCamera(true);
      
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsCameraReady(false);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this browser');
      }
      
      let stream: MediaStream | null = null;
      
      // Try with specific facing mode first (works best on mobile)
      const constraints: MediaStreamConstraints[] = [
        // First try: ideal facing mode with preferred dimensions
        { 
          video: { 
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        // Second try: exact facing mode (for iOS)
        { 
          video: { 
            facingMode: { exact: facing }
          },
          audio: false
        },
        // Third try: just facing mode as string
        { 
          video: { 
            facingMode: facing
          },
          audio: false
        },
        // Final fallback: any video
        { 
          video: true,
          audio: false
        }
      ];
      
      for (const constraint of constraints) {
        try {
          console.log('Trying camera constraints:', JSON.stringify(constraint));
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera started successfully with constraint');
          break;
        } catch (e) {
          console.log('Constraint failed, trying next:', e);
          continue;
        }
      }
      
      if (!stream) {
        throw new Error('Could not access camera with any constraints');
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 10000);
          
          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            video.play()
              .then(() => {
                console.log('Video playing, dimensions:', video.videoWidth, 'x', video.videoHeight);
                setIsCameraReady(true);
                resolve();
              })
              .catch(reject);
          };
          
          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Video element error'));
          };
        });
      }
      
      setFacingMode(facing);
      
      // Re-check available cameras after getting permission
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (e) {
        console.log('Could not enumerate devices');
      }
      
    } catch (error: any) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Please allow camera access in your browser settings.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access requires HTTPS. Please use a secure connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      toast({
        title: t('cameraPermission'),
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const toggleCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacing);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      
      // Use actual video dimensions for best quality
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.92);
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
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {showCamera ? (
        <div className="relative border-2 border-primary rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-video max-h-[70vh]">
          <video 
            ref={videoRef} 
            className={cn(
              "w-full h-full object-cover",
              facingMode === 'user' && "scale-x-[-1]"
            )}
            autoPlay
            playsInline
            muted
            controls={false}
          />
          
          {/* Camera controls overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
          
          {/* Camera loading indicator */}
          {!isCameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Camera error display */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <Camera className="w-12 h-12 text-white/60" />
                <p className="text-white text-sm max-w-xs">{cameraError}</p>
                <Button 
                  onClick={stopCamera}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {/* Camera controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="flex justify-center items-center gap-4 sm:gap-6">
              {/* Switch Camera - Only show if multiple cameras */}
              {hasMultipleCameras && (
                <Button 
                  onClick={toggleCamera}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 transition-all"
                  disabled={!isCameraReady}
                >
                  <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              )}
              
              {/* Capture Button */}
              <Button 
                onClick={capturePhoto}
                size="lg"
                disabled={!isCameraReady}
                className="rounded-full w-18 h-18 sm:w-20 sm:h-20 p-0 bg-white hover:bg-gray-100 border-4 border-primary shadow-2xl disabled:opacity-50 transition-all active:scale-95"
                style={{ width: '72px', height: '72px' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </Button>
              
              {/* Cancel */}
              <Button 
                onClick={stopCamera}
                size="lg"
                variant="outline"
                className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30 transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>
          
          {/* Camera mode indicator */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs sm:text-sm font-medium flex items-center gap-2">
            {facingMode === 'environment' ? (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Back Camera</span>
                <span className="xs:hidden">Back</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Front Camera</span>
                <span className="xs:hidden">Front</span>
              </>
            )}
          </div>
          
          {/* Instructions */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium">
            Point at plant 🌱
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-300 cursor-pointer overflow-hidden",
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
                className="w-full max-h-[250px] sm:max-h-[300px] md:max-h-[350px] object-contain rounded-xl"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
                      <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-primary/20" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{t('analyzing')}</p>
                    <p className="text-xs text-muted-foreground text-center px-4">Detecting plant diseases...</p>
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
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse-slow">
                  {isDragging ? (
                    <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                  ) : (
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base sm:text-lg">
                  🌱
                </div>
              </div>
              <div className="text-center px-2">
                <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1">{t('uploadTitle')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{t('uploadDesc')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <label className="flex-1">
                  <Button variant="hero" size="lg" className="w-full text-sm sm:text-base" asChild>
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
                  className="border-primary/30 hover:bg-primary/10 flex-1 text-sm sm:text-base"
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
