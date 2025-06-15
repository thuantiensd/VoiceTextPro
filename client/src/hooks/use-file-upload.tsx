import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseFileUploadOptions {
  onSuccess?: (text: string, filename: string) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({ onSuccess, onError }: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      const error = 'Invalid file type. Only PDF, Word, and TXT files are allowed.';
      onError?.(error);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const error = 'File size exceeds 10MB limit.';
      onError?.(error);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to extract text from file');
      }

      const data = await response.json();
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      onSuccess?.(data.text, data.filename || file.name);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess, onError]);

  const dragProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
  };

  return {
    isUploading,
    uploadFile,
    dragProps,
  };
}
