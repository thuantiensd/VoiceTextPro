// Client-side datetime utilities for Vietnam timezone

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format date to Vietnam timezone display
 */
export function formatVietnamDateTime(date: string | Date, options?: {
  includeTime?: boolean;
  shortFormat?: boolean;
}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: options?.shortFormat ? 'short' : '2-digit',
    day: '2-digit',
  };

  if (options?.includeTime !== false) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    formatOptions.hour12 = false;
  }

  return new Intl.DateTimeFormat('vi-VN', formatOptions).format(dateObj);
}

/**
 * Get relative time in Vietnamese
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatVietnamDateTime(dateObj, { includeTime: false, shortFormat: true });
}

/**
 * Format duration in Vietnamese
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get current Vietnam time
 */
export function getCurrentVietnamTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));
}