'use client';

import React, { useRef, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ImagePlus, Image as ImageIcon, Loader2, Trash2, Film, FileText, Presentation, File } from 'lucide-react';
import type { ImageDropZoneProps } from '@/types/flightplan';
import { FLIGHTPLAN_CONSTANTS } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from '../design-tokens';

interface ImageDropZoneInternalProps extends ImageDropZoneProps {
  compact?: boolean;
}

function renderMediaItem(url: string) {
  const isVideo = /\.(mp4|mov|webm|ogg|m4v)(\?.*)?$/i.test(url) || url.startsWith('data:video/');
  const isPdf = /\.pdf(\?.*)?$/i.test(url) || url.startsWith('data:application/pdf');
  const isPpt = /\.(ppt|pptx)(\?.*)?$/i.test(url) || url.startsWith('data:application/vnd.ms-powerpoint') || url.startsWith('data:application/vnd.openxmlformats');

  if (isVideo) {
    return (
      <div className="relative w-full h-full bg-stone-900 flex items-center justify-center overflow-hidden">
        <video src={url} className="w-full h-full object-cover" muted playsInline />
        <span className="absolute bottom-1 left-1 bg-black/80 text-white rounded px-1 py-0.5 text-[8px] font-bold flex items-center gap-0.5">
          <Film className="w-2.5 h-2.5 text-amber-400" /> VIDEO
        </span>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full h-full bg-red-50 text-red-700 flex flex-col items-center justify-center p-1 text-center font-bold text-[9px] border" style={{ borderColor: '#FCA5A5' }}>
        <FileText className="w-4 h-4 mb-0.5 text-red-600" />
        <span>PDF</span>
      </div>
    );
  }

  if (isPpt) {
    return (
      <div className="w-full h-full bg-amber-50 text-amber-800 flex flex-col items-center justify-center p-1 text-center font-bold text-[9px] border" style={{ borderColor: '#FCD34D' }}>
        <Presentation className="w-4 h-4 mb-0.5 text-amber-700" />
        <span>PPT</span>
      </div>
    );
  }

  return <img src={url} alt="" className="w-full h-full object-cover" />;
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
    React.useImperativeHandle(ref, () => internalFileInputRef.current as HTMLInputElement, []);

    // Also expose to passed ref
    React.useImperativeHandle(fileInputRef, () => internalFileInputRef.current as HTMLInputElement, []);

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
                borderColor: isDragging ? B.accent : isUploading ? B.accent : 'transparent',
                background: isDragging || isUploading ? B.accentBg : 'transparent',
              }}
            >
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border shadow-xs" style={{ borderColor: B.border }}>
                  {renderMediaItem(imgUrl)}
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                    title="Remove media"
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

              {/* Upload progress overlay when uploading to existing images */}
              {isUploading && (
                <div className="w-full flex items-center gap-2 px-1 py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin flex-none" style={{ color: B.accent }} />
                  <span className="text-[10px] font-medium" style={{ color: B.accent }}>Uploading media...</span>
                </div>
              )}
            </div>
          )}

          {images.length === 0 && canAddMore && (
            <div
              onClick={!isUploading ? handleClick : undefined}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="py-1.5 px-3 rounded-lg border-2 flex items-center justify-center gap-2 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: B.bg,
                borderColor: isDragging ? B.accent : isUploading ? B.accent : B.border,
                borderStyle: isDragging || isUploading ? 'solid' : 'dashed',
                background: isDragging ? B.accentBg : isUploading ? B.accentBg : 'transparent',
                cursor: isUploading ? 'wait' : 'pointer',
                focusRingColor: B.accent,
                focusRingOffsetColor: B.card,
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin flex-none" style={{ color: B.accent }} />
                  <span className="text-xs font-semibold" style={{ color: B.accent }}>Uploading...</span>
                </>
              ) : isDragging ? (
                <>
                  <ImagePlus className="w-4 h-4" style={{ color: B.accent }} />
                  <span className="text-xs font-medium" style={{ color: B.accent }}>Drop to attach</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" style={{ color: B.textMuted }} />
                  <span className="text-xs font-medium" style={{ color: B.text }}>No media attached</span>
                  <span className="text-[10px]" style={{ color: B.textMuted }}>(Drop media)</span>
                </>
              )}
            </div>
          )}

          <input
            ref={internalFileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={handleFileChange}
          />
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
                {renderMediaItem(imgUrl)}
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                  title="Remove media"
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
                    <span className="text-[9px] font-medium">Add Media</span>
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
              No media attached yet
            </span>
            <span className="text-[10px]" style={{ color: B.textMuted }}>
              Drop images, videos, PDFs or presentations (max {maxImages}) or click to browse
            </span>
          </div>
        )}

        <input
          ref={internalFileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }
);

ImageDropZone.displayName = 'ImageDropZone';