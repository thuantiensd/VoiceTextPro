import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { downloadBlob, estimateAudioDuration } from "@/lib/audio-utils";
import type { InsertAudioFile } from "@shared/schema";

interface TTSOptions {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export function useTTS(isAuthenticated?: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [lastGeneratedAudio, setLastGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedConfig, setLastGeneratedConfig] = useState<string | null>(null);
  const [playbackVolume, setPlaybackVolume] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();

  const saveAudioMutation = useMutation({
    mutationFn: async (audioData: InsertAudioFile) => {
      console.log('📡 Calling POST /api/audio-files with data:', audioData);
      const result = await apiRequest("POST", "/api/audio-files", audioData);
      const response = await result.json();
      console.log('✅ Save audio response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('🎉 Audio saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/audio-files"] });
      console.log('🔄 Invalidated audio files query');
    },
    onError: (error) => {
      console.error('❌ Failed to save audio:', error);
    },
  });

  // Generate audio (only call API once)
  const generateAudio = useCallback(async (text: string, options: TTSOptions) => {
    if (isGenerating) return;
    
    // Create config hash to check if settings changed
    const configHash = JSON.stringify({
      text: text.trim(),
      voice: options.voice,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume
    });
    
    // If same config, reuse existing audio
    if (lastGeneratedConfig === configHash && lastGeneratedAudio) {
      console.log('Reusing existing audio - no changes detected');
      return 'reused';
    }
    
    try {
      setIsGenerating(true);
      console.log('Generating new audio with OpenAI TTS for:', text);
      
      const response = await fetch("/api/tts", {
        method: "POST",
        credentials: "include", // Include session cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: options.voice === "vi-VN-Female" ? "nova" : 
                 options.voice === "vi-VN-Male" ? "onyx" :
                 options.voice === "vi-VN-HoaiMy" ? "alloy" : 
                 options.voice, // Use the exact voice passed in
          speed: options.rate
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI TTS failed');
      }

      if (response.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Clean up previous audio
        if (lastGeneratedAudio) {
          URL.revokeObjectURL(lastGeneratedAudio);
        }
        
        setLastGeneratedAudio(audioUrl);
        setLastGeneratedConfig(configHash);
        
        // Create audio element for metadata
        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
          console.log('Audio generated successfully, duration:', audio.duration);
        };
        
        // Set initial volume
        audio.volume = playbackVolume;
        
        // Save to backend nếu đã đăng nhập
        if (isAuthenticated) {
          console.log('🔐 User is authenticated, saving audio to backend...');
          const audioData = {
            title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
            content: text,
            voice: options.voice,
            speed: options.rate,
            pitch: options.pitch,
            volume: options.volume,
            format: 'mp3' as const,
            duration: 0,
            fileSize: 0,
            isPublic: false,
          };
          console.log('📝 Audio data to save:', audioData);
          saveAudioMutation.mutate(audioData);
        } else {
          console.log('❌ User is NOT authenticated, skipping save to backend');
        }
        
        console.log('Audio generated and ready to play');
        return 'generated';
      }
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, saveAudioMutation, lastGeneratedAudio, lastGeneratedConfig, isAuthenticated, playbackVolume]);

  // Play already generated audio
  const playAudio = useCallback(() => {
    if (!lastGeneratedAudio) return;
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(lastGeneratedAudio);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        console.log('Audio playing...');
      };
      
      audio.onpause = () => {
        setIsPlaying(false);
        setIsPaused(true);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
      };
      
      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
          setCurrentTime(audio.currentTime);
        }
      };
      
      audio.play();
    } catch (error) {
      console.error('Play error:', error);
    }
  }, [lastGeneratedAudio]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && isPaused) {
      audioRef.current.play();
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, []);

  const downloadAudio = useCallback(() => {
    if (lastGeneratedAudio) {
      fetch(lastGeneratedAudio)
        .then(response => response.blob())
        .then(blob => {
          downloadBlob(blob, `audio-${Date.now()}.mp3`);
        })
        .catch(error => {
          console.error('Download error:', error);
        });
    }
  }, [lastGeneratedAudio]);

  // Legacy speak function for compatibility
  const speak = useCallback(async (text: string, options: TTSOptions) => {
    await generateAudio(text, options);
    // Auto-play after generation
    setTimeout(() => playAudio(), 100);
  }, [generateAudio, playAudio]);

  // Check if current settings match last generated
  const checkIfSameConfig = useCallback((text: string, options: TTSOptions) => {
    const currentConfig = JSON.stringify({
      text: text.trim(),
      voice: options.voice,
      rate: options.rate,
      pitch: options.pitch,
      volume: options.volume
    });
    return lastGeneratedConfig === currentConfig && lastGeneratedAudio;
  }, [lastGeneratedConfig, lastGeneratedAudio]);

  // Update audio volume when playbackVolume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playbackVolume;
    }
  }, [playbackVolume]);

  return {
    speak,
    generateAudio,
    playAudio,
    pause,
    resume,
    stop,
    downloadAudio,
    checkIfSameConfig,
    isPlaying,
    isPaused,
    isGenerating,
    duration,
    progress,
    currentTime,
    hasGeneratedAudio: !!lastGeneratedAudio,
    playbackVolume,
    setPlaybackVolume,
    audioRef // Export audioRef for direct access
  };
}