export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function estimateAudioDuration(text: string, speechRate: number = 1.0): number {
  // Average reading speed is about 150 words per minute
  const wordsPerMinute = 150;
  const wordCount = text.split(/\s+/).length;
  const durationInMinutes = wordCount / wordsPerMinute;
  const durationInSeconds = durationInMinutes * 60;
  
  // Adjust for speech rate
  return Math.ceil(durationInSeconds / speechRate);
}

export function getVoiceName(voiceId: string): string {
  const voiceMap: Record<string, string> = {
    'vi-VN-HoaiMy': 'Hoài My',
    'vi-VN-NamMinh': 'Nam Minh', 
    'vi-VN-ThuHa': 'Thu Hà',
    'vi-VN-QuangAnh': 'Quang Anh',
  };
  
  return voiceMap[voiceId] || voiceId;
}

export function validateAudioSettings(settings: {
  speed: number;
  pitch: number;
  volume: number;
}): string[] {
  const errors: string[] = [];
  
  if (settings.speed < 0.5 || settings.speed > 2.0) {
    errors.push('Speed must be between 0.5 and 2.0');
  }
  
  if (settings.pitch < 0.5 || settings.pitch > 2.0) {
    errors.push('Pitch must be between 0.5 and 2.0');
  }
  
  if (settings.volume < 0 || settings.volume > 1.0) {
    errors.push('Volume must be between 0 and 1.0');
  }
  
  return errors;
}
