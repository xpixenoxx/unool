'use client';

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { HashtagInputProps } from '@/types/flightplan';
import { B, MOTION, SPACING, RADIUS, SHADOW } from '../design-tokens';

export const HashtagInput = forwardRef<HTMLInputElement, HashtagInputProps>(
  function HashtagInput({ tags, onAdd, onRemove, placeholder = 'add tag...', maxTags = 30, inputRef }, ref) {
    const internalRef = useRef<HTMLInputElement>(null);
    const [newTag, setNewTag] = React.useState('');

    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement, []);
    useImperativeHandle(inputRef, () => internalRef.current as HTMLInputElement, []);

    const handleAdd = () => {
      const clean = newTag.trim().replace(/^#+/, '');
      if (!clean || tags.includes(clean) || tags.length >= maxTags) return;
      onAdd(clean);
      setNewTag('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    };

    const handleRemove = (tag: string) => {
      onRemove(tag);
    };

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: B.cardHover,
              color: B.textSecondary,
              border: `1px solid ${B.border}`,
            }}
          >
            #{tag}
            <button
              onClick={() => handleRemove(tag)}
              className="ml-0.5 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: B.textMuted, focusRingColor: B.accent, focusRingOffsetColor: B.card }}
              aria-label={`Remove hashtag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {tags.length < maxTags && (
          <div className="inline-flex items-center gap-1">
            <input
              ref={internalRef}
              type="text"
              placeholder={placeholder}
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-xs px-2.5 py-1 rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 w-24"
              style={{
                backgroundColor: B.card,
                borderColor: B.border,
                color: B.text,
                focusRingColor: B.accent,
                focusRingOffsetColor: B.card,
              }}
              aria-label="Add hashtag"
            />
            <button
              onClick={handleAdd}
              disabled={!newTag.trim() || tags.length >= maxTags}
              className="p-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: B.accentBg,
                color: B.accentHover,
                focusRingColor: B.accent,
                focusRingOffsetColor: B.card,
              }}
              aria-label="Add hashtag"
            >
              +
            </button>
          </div>
        )}

        {tags.length >= maxTags && (
          <span className="text-[10px]" style={{ color: B.textMuted }}>Max tags reached</span>
        )}
      </div>
    );
  }
);

HashtagInput.displayName = 'HashtagInput';