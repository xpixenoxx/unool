'use client';

import React, { useState } from 'react';
import type { MobilePreviewProps } from './previewTypes';

/** Helper Avatar component */
export function AvatarCircle({
  initials,
  avatarUrl,
  size = 40,
  bg = 'linear-gradient(135deg, #C4A265, #8B7355)',
  className = '',
}: {
  initials: string;
  avatarUrl?: string;
  size?: number;
  bg?: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.38,
      }}
    >
      {initials || 'U'}
    </div>
  );
}

/** Expandable text block */
export function ExpandableText({
  content,
  maxLength = 160,
  isEmpty,
  color,
  highlightColor = '#0A66C2',
}: {
  content: string;
  maxLength?: number;
  isEmpty: boolean;
  color: string;
  highlightColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = content.length > maxLength && !expanded;
  const displayContent = shouldTruncate ? content.slice(0, maxLength) + '...' : content;

  return (
    <p
      className="cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      style={{
        fontSize: 14,
        color: isEmpty ? '#999' : color,
        lineHeight: 1.45,
        fontStyle: isEmpty ? 'italic' : 'normal',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {displayContent}
      {shouldTruncate && (
        <span style={{ color: highlightColor, fontWeight: 600 }}> see more</span>
      )}
    </p>
  );
}

/** Standard Media Area */
export function MediaArea({
  media,
  aspectRatio = '16/9',
  maxHeight = 220,
}: {
  media: MobilePreviewProps['media'];
  aspectRatio?: string;
  maxHeight?: number;
}) {
  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl overflow-hidden" style={{ maxHeight }}>
      {videos.length > 0 && (
        <video
          src={videos[0].url}
          className="w-full object-cover bg-black"
          style={{ maxHeight }}
          muted
          playsInline
        />
      )}
      {images.length === 1 && (
        <img
          src={images[0].url}
          alt=""
          className="w-full object-cover"
          style={{ maxHeight }}
        />
      )}
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-0.5">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative aspect-square">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

