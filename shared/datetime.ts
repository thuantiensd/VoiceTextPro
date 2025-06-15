// Utility functions for handling Vietnam timezone (UTC+7)

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date/time in Vietnam timezone
 */
export function getVietnamTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));
}

/**
 * Convert any date to Vietnam timezone
 */
export function toVietnamTime(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));
}

/**
 * Format date for Vietnam locale
 */
export function formatVietnamDate(date: Date | string | null | undefined, includeTime = true): string {
  // Handle null, undefined, or invalid date values
  if (!date) {
    return 'Không xác định';
  }

  let dateObj: Date;
  
  // Convert string to Date if necessary
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Ngày không hợp lệ';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }

  try {
    return new Intl.DateTimeFormat('vi-VN', options).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Lỗi định dạng ngày';
  }
}

/**
 * Get Vietnam time string for database insertion
 */
export function getVietnamTimeForDB(): string {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));
  return vietnamTime.toISOString();
}

/**
 * Create a new Date with Vietnam timezone offset
 */
export function createVietnamDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const vietnamTime = new Date(utc + (7 * 3600000)); // UTC+7
  return vietnamTime;
}