import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Square, Volume2, Loader2 } from 'lucide-react';
import type { AudioFile } from '@shared/schema';

interface AudioPlayerProps {
  file: AudioFile;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  className?: string;
}

export default function AudioPlayer({ 
  file, 
  size = 'md', 
  showTitle = false,
  className = ''
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file.duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const createAudioElement = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadstart = () => {
      setIsLoading(true);
    };

    audio.onloadeddata = () => {
      setIsLoading(false);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    audio.oncanplay = () => {
      setIsLoading(false);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.onwaiting = () => {
      setIsLoading(true);
    };

    audio.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      toast({
        title: "Lỗi phát âm thanh",
        description: "Không thể phát file audio này",
        variant: "destructive",
      });
    };

    return audio;
  };

  const handlePlay = async () => {
    try {
      setIsLoading(true);

      // If audio element exists and is paused, just resume
      if (audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Use TTS API (which now includes server-side caching)
      console.log(`🎵 Playing audio for file ${file.id} - using server cache`);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: file.content,
          voice: file.voice,
          speed: file.speed || 1.0,
          format: file.format || 'mp3'
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element with blob URL
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event handlers
      audio.onloadstart = () => {
        setIsLoading(true);
      };

      audio.onloadeddata = () => {
        setIsLoading(false);
      };

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      audio.oncanplay = () => {
        setIsLoading(false);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
          setCurrentTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onwaiting = () => {
        setIsLoading(true);
      };

      audio.onplaying = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Lỗi phát âm thanh",
          description: "Không thể phát file audio này",
          variant: "destructive",
        });
      };

      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
      toast({
        title: "Lỗi phát âm thanh",
        description: "Không thể phát file audio này",
        variant: "destructive",
      });
    }
  };

  const handlePause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-6 w-6';
      default: return 'h-4 w-4';
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Play/Pause Button */}
      <Button
        onClick={isPlaying ? handlePause : handlePlay}
        disabled={isLoading}
        size="icon"
        className={`${getButtonSize()} flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white`}
      >
        {isLoading ? (
          <Loader2 className={`${getIconSize()} animate-spin`} />
        ) : isPlaying ? (
          <Pause className={getIconSize()} />
        ) : (
          <Play className={getIconSize()} />
        )}
      </Button>

      {/* Stop Button (only show when playing) */}
      {(isPlaying || progress > 0) && (
        <Button
          onClick={handleStop}
          size="icon"
          variant="outline"
          className={`${getButtonSize()} flex-shrink-0`}
        >
          <Square className={getIconSize()} />
        </Button>
      )}

      {/* Progress and Time */}
      <div className="flex-1 min-w-0">
        {showTitle && (
          <div className="text-sm font-medium truncate mb-1">
            {file.title}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume Indicator */}
      <div className="flex items-center">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
} 