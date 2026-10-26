'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface HashtagEditorProps {
  hashtags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  editable?: boolean;
  className?: string;
}

export function HashtagEditor({
  hashtags = [],
  onAdd,
  onRemove,
  editable = true,
  className,
}: HashtagEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const commitInput = () => {
    const raw = inputValue.trim();
    if (!raw) return;

    // Split multiple tags separated by commas or spaces
    const tags = raw
      .split(/[\s,]+/)
      .map(t => t.trim().replace(/^#+/, ''))
      .filter(Boolean)
      .map(t => `#${t}`);

    tags.forEach(t => onAdd(t));
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        commitInput();
        // Keep focus so user can type subsequent hashtags rapidly
        inputRef.current?.focus();
      } else {
        setIsAdding(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue('');
      setIsAdding(false);
    }
  };

  if (!editable && (!hashtags || hashtags.length === 0)) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 pt-1', className)}>
      {hashtags.map(tag => (
        <Badge
          key={tag}
          variant="outline"
          className="text-xs group inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full border-border bg-background hover:bg-muted/50 transition-colors shadow-xs"
        >
          <span className="font-mono text-[11px] font-medium text-foreground">{tag}</span>
          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(tag);
              }}
              className="h-3.5 w-3.5 ml-0.5 rounded-full inline-flex items-center justify-center text-muted-foreground/70 hover:text-destructive hover:bg-destructive/15 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-destructive"
              title={`Remove ${tag}`}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </Badge>
      ))}

      {editable && (
        isAdding ? (
          <div className="inline-flex items-center gap-1">
            <div className="relative inline-flex items-center">
              <span className="absolute left-2.5 text-xs text-muted-foreground/60 select-none pointer-events-none font-mono">
                #
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (inputValue.trim()) {
                    commitInput();
                  }
                  setIsAdding(false);
                }}
                placeholder="hashtag"
                className="h-6 w-32 pl-6 pr-2 rounded-full border border-primary/50 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-mono"
              />
            </div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commitInput();
                inputRef.current?.focus();
              }}
              className="h-6 px-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-xs flex items-center justify-center"
            >
              Add
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setInputValue('');
                setIsAdding(false);
              }}
              className="h-6 w-6 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Cancel"
              aria-label="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#231C16] px-3 py-1 text-xs font-semibold text-[#231C16] bg-white hover:bg-[#FAF7F2] transition-all cursor-pointer shadow-2xs focus:outline-none"
            title="Add a hashtag to this draft"
          >
            <Plus className="w-3 h-3 text-[#231C16]" />
            <span>Add hashtag</span>
          </button>
        )
      )}
    </div>
  );
}
