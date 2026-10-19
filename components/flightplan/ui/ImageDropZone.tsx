'use client';

import React, { useRef, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ImagePlus, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import type { ImageDropZoneProps } from '@/types/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from '../design-tokens';

interface ImageDropZoneInternalProps extends ImageDropZoneProps {
  compact?: boolean;
}

export const ImageDropZone = forwardRef<HTMLInputElement, ImageDropZoneInternalProps>(
  function ImageDropZone({
    images,
    onUpload,
    onRemove,
    maxImages = FLIGHTPLAN_CONSTANTS.MAX_IMAGES_PER_POST,
    isUploading = false,
    isDragging = false,
    setIsDragging,
    fileInputRef,
    compact = false,
  }, ref) {
    const internalFileInputRef = useRef<HTMLInputElement>(null);

    // Expose ref to parent
    React.useImperativeHandle(ref, () => internalFileInputRef.current, []);

    // Also expose to passed ref
    React.useImperativeHandle(fileInputRef, () => internalFileInputRef.current, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging?.(true);
    }, [setIsDragging]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging?.(false);
    }, [setIsDragging]);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging?.(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    }, [onUpload, setIsDragging]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUpload(e.target.files);
        e.target.value = '';
      }
    }, [onUpload]);

    const handleClick = useCallback(() => {
      internalFileInputRef.current?.click();
    }, []);

    const canAddMore = images.length < maxImages;

    if (compact) {
      return (
        <div className="space-y-1.5">
          {images.length > 0 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex flex-wrap gap-1.5 p-1.5 rounded-xl border transition-colors"
              style={{
                backgroundColor: B.bg,
                borderColor: isDragging ? B.accent : 'transparent',
                background: isDragging ? B.accentBg : 'transparent',
              }}
            >
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border shadow-xs" style={{ borderColor: B.border }}>
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={isUploading}
                  className="w-12 h-12 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-colors hover:border-solid hover:opacity-80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    backgroundColor: B.card,
                    borderColor: B.border,
                    color: B.textMuted,
                    focusRingColor: B.accent,
                    focusRingOffsetColor: B.card,
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-[9px] font-medium">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {images.length === 0 && canAddMore && (
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: B.bg,
                borderColor: isDragging ? B.accent : B.border,
                background: isDragging ? B.accentBg : 'transparent',
                focusRingColor: B.accent,
                focusRingOffsetColor: B.card,
              }}
            >
              <ImagePlus className="w-5 h-5" style={{ color: B.textMuted }} />
              <span className="text-xs font-medium" style={{ color: B.text }}>
                No images
              </span>
              <span className="text-[10px]" style={{ color: B.textMuted }}>
                Drop or click (max {maxImages})
              </span>
            </div>
          )}
        </div>
      );
    }

    // Full-size version
    return (
      <div className="space-y-1.5">
        {images.length > 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-wrap gap-2.5 p-2 rounded-xl border transition-colors"
            style={{
              backgroundColor: B.bg,
              borderColor: isDragging ? B.accent : 'transparent',
              background: isDragging ? B.accentBg : 'transparent',
            }}
          >
            {images.map((imgUrl, idx) => (
              <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border shadow-xs" style={{ borderColor: B.border }}>
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                type="button"
                onClick={handleClick}
                disabled={isUploading}
                className="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-colors hover:border-solid hover:opacity-80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: B.card,
                  borderColor: B.border,
                  color: B.textMuted,
                  focusRingColor: B.accent,
                  focusRingOffsetColor: B.card,
                }}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-4 h-4" />
                    <span className="text-[9px] font-medium">Add Image</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {images.length === 0 && canAddMore && (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: B.bg,
              borderColor: isDragging ? B.accent : B.border,
              background: isDragging ? B.accentBg : 'transparent',
              focusRingColor: B.accent,
              focusRingOffsetColor: B.card,
            }}
          >
            <ImagePlus className="w-6 h-6" style={{ color: B.textMuted }} />
            <span className="text-xs font-medium" style={{ color: B.text }}>
              No images attached yet
            </span>
            <span className="text-[10px]" style={{ color: B.textMuted }}>
              Drop images here or click to browse (PNG, JPG, WebP)
            </span>
          </div>
        )}

        <input
          ref={internalFileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }
);

ImageDropZone.displayName = 'ImageDropZone';