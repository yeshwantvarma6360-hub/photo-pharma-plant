import { useState, useCallback, useRef, useEffect } from 'react';
import { Language } from '@/lib/translations';

// Language code mapping for speech synthesis
const speechLanguageMap: Record<Language, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
};

export const useSpeech = (language: Language) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguageMap[language] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices();
    const languageVoice = voices.find(voice => 
      voice.lang.startsWith(speechLanguageMap[language]?.split('-')[0] || 'en')
    );
    if (languageVoice) {
      utterance.voice = languageVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return { speak, stop, isSpeaking };
};
