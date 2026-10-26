'use client';

import { useState, useCallback, useRef } from 'react';
import { studioToast } from '@/components/dashboard/StudioToast';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import type { UseImageUploadResult } from '@/types/flightplan';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (supports videos and presentations)

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif',
  // Videos
  'video/mp4', 'video/quicktime', 'video/webm', 'video/mpeg', 'video/ogg', 'video/x-msvideo',
  // Documents: PDF, PPT, PPTX, Keynote, Docs
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif',
  '.mp4', '.mov', '.webm', '.mpeg', '.avi', '.ogg',
  '.pdf', '.ppt', '.pptx', '.doc', '.docx'
];

function getFileContentType(file: File): string {
  if (file.type && file.type.length > 0) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'm4v'].includes(ext)) return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'ppt') return 'application/vnd.ms-powerpoint';
  if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (ext === 'png') return 'image/png';
  if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'application/octet-stream';
}

function getMediaCategory(file: File): 'image' | 'video' | 'document' {
  const type = getFileContentType(file);
  if (type.startsWith('video/')) return 'video';
  if (type === 'application/pdf' || /\.(pdf|ppt|pptx|doc|docx)$/i.test(file.name)) return 'document';
  return 'image';
}

/**
 * Hook for handling multi-image/video/document upload with drag-drop, validation, and progress
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
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValid = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
      if (!isValid) {
        errors.push(`${file.name}: Unsupported file format. Please upload images, videos, PDFs, or presentations.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 100MB).`);
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
      const contentType = getFileContentType(file);
      // Step 1: Get signed URL
      const res = await fetch('/api/composer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      // Step 2: Upload to storage
      const uploadRes = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
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
      studioToast.success(`${urls.length} media file${urls.length > 1 ? 's' : ''} uploaded`);
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
    // Handled in component state
  }, []);

  const setIsDraggingState = useCallback((postIdx: number, dragging: boolean) => {
    setIsDragging(prev => ({ ...prev, [postIdx]: dragging }));
  }, []);

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
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValid = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
      if (!isValid) {
        errors.push(`${file.name}: Unsupported file format. Only images, videos, PDFs, or presentations allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 100MB).`);
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
      const mediaType = getMediaCategory(file);
      let uploadSucceeded = false;

      // 1. Try server storage upload
      try {
        const contentType = getFileContentType(file);
        const res = await fetch('/api/composer/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType }),
        });

        const data = await res.json();
        if (res.ok && data.signedUrl) {
          const uploadRes = await fetch(data.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file,
          });

          if (uploadRes.ok && data.url) {
            uploadedMedia.push({ url: data.url, type: mediaType });
            uploadSucceeded = true;
          }
        }
      } catch {
        // Fall through to Data URI fallback
      }

      // 2. Fallback to base64 Data URI
      if (!uploadSucceeded) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        uploadedMedia.push({ url: dataUrl, type: mediaType });
      }
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
      studioToast.success(`${media.length} media file${media.length > 1 ? 's' : ''} uploaded`);
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