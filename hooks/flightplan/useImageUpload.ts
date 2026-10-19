'use client';

import { useState, useCallback, useRef } from 'react';
import { studioToast } from '@/components/dashboard/StudioToast';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { UseImageUploadResult } from '@/types/flightplan';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Hook for handling multi-image upload with drag-drop, validation, and progress
 * Used by both ReviewScreen (per-day) and ScheduledPostModal (per-variant)
 */
export function useImageUpload(
  onUploadComplete: (postIdx: number, urls: string[]) => void
): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState<Record<number, boolean>>({});
  const [isDragging, setIsDragging] = useState<Record<number, boolean>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, GIF allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB).`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      studioToast.generationFailed(errors.join(' '), {
        knowMoreUrl: '/terms',
      });
    }

    return validFiles;
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Step 1: Get signed URL
      const res = await fetch('/api/composer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      // Step 2: Upload to storage
      const uploadRes = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      uploadedUrls.push(data.url);
    }

    return uploadedUrls;
  }, []);

  const upload = useCallback(async (files: FileList | File[], postIdx: number) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    setIsUploading(prev => ({ ...prev, [postIdx]: true }));

    try {
      const urls = await uploadFiles(validFiles);
      onUploadComplete(postIdx, urls);
      studioToast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
    } catch (error) {
      studioToast.generationFailed(
        error instanceof Error ? error.message : 'Upload failed. Please try again.',
        { knowMoreUrl: '/terms' }
      );
    } finally {
      setIsUploading(prev => ({ ...prev, [postIdx]: false }));
      // Reset file input
      if (fileInputRefs.current[postIdx]) {
        fileInputRefs.current[postIdx].value = '';
      }
    }
  }, [validateFiles, uploadFiles, onUploadComplete]);

  const remove = useCallback((postIdx: number, imageIdx: number) => {
    // This is handled by the parent component's state
    // The hook just provides the interface
  }, []);

  const setIsDraggingState = useCallback((postIdx: number, dragging: boolean) => {
    setIsDragging(prev => ({ ...prev, [postIdx]: dragging }));
  }, []);

  // Register file input ref
  const registerFileInput = useCallback((postIdx: number, el: HTMLInputElement | null) => {
    fileInputRefs.current[postIdx] = el;
  }, []);

  return {
    upload,
    remove,
    isUploading,
    isDragging,
    setIsDragging: setIsDraggingState,
    registerFileInput,
  };
}

/**
 * Simplified version for modal (single post, multiple variants)
 */
export function useModalImageUpload(
  onUploadComplete: (variantId: string, urls: Array<{ url: string; type: string }>) => void
) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, GIF allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB).`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      studioToast.generationFailed(errors.join(' '), { knowMoreUrl: '/terms' });
    }

    return validFiles;
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<Array<{ url: string; type: string }>> => {
    const uploadedMedia: Array<{ url: string; type: string }> = [];

    for (const file of files) {
      const res = await fetch('/api/composer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const uploadRes = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      uploadedMedia.push({ url: data.url, type: 'image' });
    }

    return uploadedMedia;
  }, []);

  const upload = useCallback(async (files: FileList | File[], variantId: string) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const media = await uploadFiles(validFiles);
      onUploadComplete(variantId, media);
      studioToast.success(`${media.length} image${media.length > 1 ? 's' : ''} uploaded`);
    } catch (error) {
      studioToast.generationFailed(
        error instanceof Error ? error.message : 'Upload failed. Please try again.',
        { knowMoreUrl: '/terms' }
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [validateFiles, uploadFiles, onUploadComplete]);

  return {
    upload,
    isUploading,
    isDragging,
    setIsDragging,
    fileInputRef,
  };
}