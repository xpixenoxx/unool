'use client';

import React from 'react';

export type SupportedPlatform =
  | 'linkedin'
  | 'x'
  | 'twitter'
  | 'threads'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'pinterest'
  | 'bluesky'
  | 'mastodon'
  | 'slack'
  | 'reddit'
  | 'twitch'
  | 'telegram'
  | 'discord'
  | 'dribbble'
  | 'kick'
  | 'warpcast'
  | 'farcaster'
  | 'skool'
  | 'whop'
  | 'mewe'
  | 'nostr'
  | 'medium'
  | 'lemmy'
  | 'listmonk'
  | 'hashnode'
  | 'devto'
  | 'dev.to'
  | 'whatsapp'
  | 'manual'
  | 'tiktok';

export interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'app-icon' | 'glyph';
}

export type PlatformLogoComponent = React.FC<LogoProps>;

export interface PlatformConfig {
  name: string;
  color: string;
  bg?: string;
  logo: PlatformLogoComponent;
}

// ── Official, Authentic & High-Contrast Platform SVGs ─────────────────────────

export const PlatformSVGs: Record<string, PlatformLogoComponent> = {
  // 1. LinkedIn (Official blue squircle with pure white "in")
  linkedin: ({ size = 20, className = '', variant = 'app-icon' }) => {
    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37z" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#0A66C2" />
        <path fill="#FFFFFF" d="M6.94 19H4.25V9.6h2.69V19zM5.6 8.32a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12zm12.9 10.68h-2.69v-4.22c0-1.01-.02-2.31-1.41-2.31-1.41 0-1.63 1.1-1.63 2.24v4.29h-2.69V9.6h2.58v1.18h.04c.36-.68 1.24-1.39 2.55-1.39 2.73 0 3.23 1.8 3.23 4.14V19z" />
      </svg>
    );
  },

  // 2. X / Twitter (Official black squircle with pure white X)
  x: ({ size = 20, className = '', variant = 'app-icon' }) => {
    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#000000" />
        <path
          fill="#FFFFFF"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          transform="translate(2.4, 2.4) scale(0.8)"
        />
      </svg>
    );
  },

  // 3. Threads (Official complete @ spiral on black squircle)
  threads: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const threadPath =
      'M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={threadPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#000000" />
        <path fill="#FFFFFF" d={threadPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 4. Instagram (Authentic multi-stop gradient squircle with solid white camera)
  instagram: ({ size = 20, className = '', variant = 'app-icon' }) => {
    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <defs>
          <linearGradient id="ig-brand-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD521" />
            <stop offset="25%" stopColor="#F50000" />
            <stop offset="50%" stopColor="#B900B4" />
            <stop offset="75%" stopColor="#7B00E0" />
            <stop offset="100%" stopColor="#1B00E0" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5.5" fill="url(#ig-brand-gradient)" />
        <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="#FFFFFF" strokeWidth="1.7" />
        <circle cx="16.2" cy="7.8" r="0.9" fill="#FFFFFF" />
      </svg>
    );
  },

  // 5. Facebook (Official blue roundel with solid white "f")
  facebook: ({ size = 20, className = '', variant = 'app-icon' }) => {
    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path
          fill="#FFFFFF"
          d="M14.07 12.044h2.51l.37-2.43h-2.88V7.95c0-.7.2-1.18 1.2-1.18h1.28V4.6c-.22-.03-.98-.1-1.87-.1-1.85 0-3.12 1.13-3.12 3.2v1.91H9.2v2.43h2.35v7.45c.82.13 1.66.2 2.52.2V12.044z"
        />
      </svg>
    );
  },

  // 6. Bluesky (Official sky-blue squircle with white butterfly)
  bluesky: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const butterflyPath =
      'M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={butterflyPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#0085FF" />
        <path fill="#FFFFFF" d={butterflyPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 7. WhatsApp (Official green circle with solid white handset bubble)
  whatsapp: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const waPath =
      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={waPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#25D366" />
        <path fill="#FFFFFF" d={waPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 8. YouTube (Official red rounded rectangle with solid white play triangle)
  youtube: ({ size = 20, className = '', variant = 'app-icon' }) => {
    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        />
        <polygon points="9.75,8.75 15.75,12 9.75,15.25" fill="#FFFFFF" />
      </svg>
    );
  },

  // 9. Pinterest (Official red roundel with solid white "P")
  pinterest: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const pinPath =
      'M12 2C6.48 2 2 6.48 2 12c0 4.23 2.64 7.84 6.38 9.24-.09-.78-.17-1.98.04-2.83.19-.77 1.25-5.3 1.25-5.3s-.32-.64-.32-1.58c0-1.48.86-2.59 1.93-2.59.91 0 1.35.68 1.35 1.5 0 .91-.58 2.28-.88 3.55-.25 1.06.53 1.93 1.58 1.93 1.9 0 3.36-2 3.36-4.89 0-2.56-1.84-4.35-4.47-4.35-3.05 0-4.84 2.29-4.84 4.65 0 .92.35 1.91.8 2.45.09.11.1.2.07.31-.08.33-.26 1.07-.3 1.22-.05.2-.16.24-.36.14-1.34-.62-2.18-2.58-2.18-4.15 0-3.38 2.46-6.49 7.09-6.49 3.73 0 6.62 2.66 6.62 6.2 0 3.7-2.33 6.68-5.57 6.68-1.09 0-2.11-.57-2.46-1.24l-.67 2.56c-.24.93-.9 2.1-1.34 2.81 1.02.32 2.1.49 3.22.49 5.52 0 10-4.48 10-10S17.52 2 12 2z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={pinPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#E60023" />
        <path fill="#FFFFFF" d={pinPath} />
      </svg>
    );
  },

  // 10. Mastodon (Official purple squircle with solid white mammoth M)
  mastodon: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const mPath =
      'M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61C16.924 2.213 14.1 2.016 12.022 2c-2.079.016-4.903.213-6.463.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.18.046 3.447.24 4.673 2.454 9.177 8.685 9.53 3.65.207 6.466-.757 6.466-.757l-.147-1.74s-2.585.819-5.503.737c-2.899-.082-4.137-1.157-4.277-2.126-.038-.26-.057-.542-.057-.841 0-.01 0-.02.001-.03 2.87.697 5.753.518 8.441.229 2.502-.27 4.148-1.554 4.316-2.07.457-1.411.666-4.223.666-6.235zm-2.923 5.922h-2.17V8.97c0-1.714-.73-2.586-2.193-2.586-1.536 0-2.305.992-2.305 2.977v4.116H9.566V9.361c0-1.985-.769-2.977-2.305-2.977-1.463 0-2.193.872-2.193 2.586v5.518H2.897V8.804c0-1.715.437-3.08 1.31-4.095.874-1.015 2.018-1.523 3.432-1.523 1.637 0 2.871.628 3.702 1.884L12 6.16l.659-1.09c.831-1.256 2.065-1.884 3.702-1.884 1.414 0 2.558.508 3.432 1.523.873 1.015 1.31 2.38 1.31 4.095v5.684z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={mPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#6364FF" />
        <path fill="#FFFFFF" d={mPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 11. Slack (Official 4-color authentic octothorpe logo)
  slack: ({ size = 20, className = '', variant = 'app-icon' }) => {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="none"
        className={`flex-shrink-0 ${className}`}
        style={{ stroke: 'none' }}
      >
        <g stroke="none" fillRule="evenodd">
          {/* Blue - top left */}
          <path
            d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
            fill="#36C5F0"
            stroke="none"
          />
          {/* Green - top right */}
          <path
            d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
            fill="#2EB67D"
            stroke="none"
          />
          {/* Yellow - bottom right */}
          <path
            d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
            fill="#ECB22E"
            stroke="none"
          />
          {/* Red - bottom left */}
          <path
            d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
            fill="#E01E5A"
            stroke="none"
          />
        </g>
      </svg>
    );
  },

  // 12. Reddit (Official orange circle with solid white Snoo alien head)
  reddit: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const snooPath =
      'M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.612a1.24 1.24 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.095.327.327 0 0 0 0 .462c.969.969 2.525.969 3.494 0a.327.327 0 0 0 0-.462.327.327 0 0 0-.462 0c-.714.714-1.856.714-2.57 0a.327.327 0 0 0-.231-.095z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={snooPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#FF4500" />
        <path fill="#FFFFFF" d={snooPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 13. Twitch (Official purple squircle with solid white Glitch icon)
  twitch: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const twitchPath =
      'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={twitchPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#9146FF" />
        <path fill="#FFFFFF" d={twitchPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 14. Telegram (Official blue circle with solid white paper airplane)
  telegram: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const telePath =
      'M17.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.85.93z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.85.93z" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#229ED9" />
        <path fill="#FFFFFF" d={telePath} transform="translate(-0.8, 0.4) scale(1.08)" />
      </svg>
    );
  },

  // 15. Discord (Official blurple squircle with solid white Clyde)
  discord: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const clydePath =
      'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={clydePath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#5865F2" />
        <path fill="#FFFFFF" d={clydePath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 16. Dribbble (Official pink roundel with solid white basketball seams)
  dribbble: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const dribPath =
      'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.849 9.876c-.365-.116-3.236-.97-6.525-.444 1.365 3.754 1.924 6.812 2.031 7.448 2.344-1.585 4.013-4.1 4.494-7.004zm-6.234 7.958c-.156-.917-.765-4.11-2.232-7.92-.067.02-5.9 2.053-8.196 6.524 1.764 1.385 3.996 2.208 6.413 2.208 1.447 0 2.823-.295 4.015-.812zm-11.847-2.63c.232-.407 3.104-5.152 8.492-6.897.138-.046.275-.086.413-.122-.265-.596-.55-1.189-.848-1.774-4.887 1.439-9.946 1.372-10.405 1.362-.004.318-.004.64-.004.965 0 2.684 1.018 5.136 2.352 6.466zm-2.467-9.13c.47.008 4.774.026 9.66-1.272-1.73-3.076-3.6-5.666-3.876-6.044-2.924 1.376-5.108 4.068-5.784 7.316zm6.814-7.307c.287.387 2.187 2.97 3.896 6.115 3.716-1.391 5.291-3.507 5.477-3.774-1.845-1.641-4.272-2.636-6.928-2.636-.84 0-1.661.102-2.445.295zm10.536 3.55c-.222.296-1.973 2.542-5.835 4.118.245.5.479 1.004.693 1.515.082.183.153.367.224.54 3.477-.438 6.932.265 7.279.336-.021-2.467-.898-4.73-2.361-6.509z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={dribPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#FFFFFF" />
        <path fill="#EA4C89" d={dribPath} />
      </svg>
    );
  },

  // 17. Kick (Official dark squircle with bold neon green #53FC18 pixelated K)
  kick: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const kickPath =
      'M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#53FC18" className={`flex-shrink-0 ${className}`}>
          <path d={kickPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="4.5" fill="#0B0E0F" />
        <path fill="#53FC18" d={kickPath} transform="translate(3.5, 3.5) scale(0.71)" />
      </svg>
    );
  },


  // 19. Farcaster / Warpcast (Official purple squircle with solid white arch)
  warpcast: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const warpPath =
      'M18.24.24H5.76A5.52 5.52 0 0 0 .24 5.76v12.48a5.52 5.52 0 0 0 5.52 5.52h12.48a5.52 5.52 0 0 0 5.52-5.52V5.76A5.52 5.52 0 0 0 18.24.24zm-1.8 17.52h-2.16v-6.36c0-1.19-.97-2.16-2.16-2.16h-.24c-1.19 0-2.16.97-2.16 2.16v6.36H7.56V8.16h2.16v1.44c.66-.99 1.77-1.56 2.97-1.56h.24c1.98 0 3.51 1.62 3.51 3.6v6.12z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={warpPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#8A63D2" />
        <path fill="#FFFFFF" d={warpPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 20. Skool (Official amber squircle with crisp black emblem)
  skool: ({ size = 20, className = '', variant = 'app-icon' }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        {variant !== 'glyph' && <rect width="24" height="24" rx="5" fill="#FFC83B" />}
        <path
          fill="none"
          stroke={variant === 'glyph' ? 'currentColor' : '#1A1A1A'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 16c.5.4 1.1.6 2.3.6h.6c1 0 1.8-.8 1.8-1.7 0-1-.8-1.7-1.8-1.7h-1.3c-1 0-1.8-.8-1.8-1.7 0-1 .8-1.7 1.8-1.7h.6c1.2 0 1.8.2 2.3.6 M13 6.5v11 M14.5 13l4 4 M13 14.5l5-5"
        />
      </svg>
    );
  },

  // 21. Whop (Official bright orange squircle with solid white geometric W)
  whop: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const whopPath =
      'M60.9 0C35.7 0 18.4 11.1 5.2 23.5c0 0-5.3 5-5.2 5.2l55.2 55.2 55.2-55.2C99.9 14.3 80.2 0 60.9 0z M197.2 0c-25.2 0-42.5 11.1-55.7 23.5c0 0-4.8 4.9-5.1 5.2L68.2 96.9l55.1 55.1L246.6 28.7C236.1 14.3 216.5 0 197.2 0z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 250 160" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={whopPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#FF5A00" />
        <path fill="#FFFFFF" d={whopPath} transform="translate(3, 4.5) scale(0.075)" />
      </svg>
    );
  },

  // 22. MeWe (Official slate squircle with solid white speech bubble)
  mewe: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const mewePath =
      'M12 2C6.477 2 2 6.477 2 12c0 2.21.72 4.25 1.94 5.9L2.5 21.5l3.77-1.38C7.88 21.31 9.87 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.8 13.8h-1.6l-1.8-6.4h1.6l1 4.2 1-4.2h1.6l1 4.2 1-4.2h1.6l-1.8 6.4h-1.6l-1-4-1 4z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={mewePath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#2F435E" />
        <path fill="#FFFFFF" d={mewePath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 23. Nostr (Official purple squircle with solid white ostrich emblem)
  nostr: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const nostrPath =
      'M210.8 199.4c0 3.1-2.5 5.7-5.7 5.7h-68c-3.1 0-5.7-2.5-5.7-5.7v-15.5c.3-19 2.3-37.2 6.5-45.5 2.5-5 6.7-7.7 11.5-9.1 9.1-2.7 24.9-.9 31.7-1.2 0 0 20.4.8 20.4-10.7s-9.1-8.6-9.1-8.6c-10 .3-17.7-.4-22.6-2.4-8.3-3.3-8.6-9.2-8.6-11.2-.4-23.1-34.5-25.9-64.5-20.1-32.8 6.2.4 53.3.4 116.1v8.4c0 3.1-2.6 5.6-5.7 5.6H57.7c-3.1 0-5.7-2.5-5.7-5.7v-144c0-3.1 2.5-5.7 5.7-5.7h31.7c3.1 0 5.7 2.5 5.7 5.7 0 4.7 5.2 7.2 9 4.5 11.4-8.2 26-12.5 42.4-12.5 36.6 0 64.4 21.4 64.4 68.7v83.2ZM150 99.3c0-6.7-5.4-12.1-12.1-12.1s-12.1 5.4-12.1 12.1 5.4 12.1 12.1 12.1S150 106 150 99.3Z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={nostrPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#8B3FE8" />
        <path fill="#FFFFFF" d={nostrPath} transform="translate(3, 3) scale(0.07)" />
      </svg>
    );
  },

  // 24. Medium (Official black squircle with solid white 3-ellipses)
  medium: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const medPath =
      'M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={medPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#12100E" />
        <path fill="#FFFFFF" d={medPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 25. Lemmy (Official teal squircle with solid white mascot)
  lemmy: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const lemmyPath =
      'M2.9595 4.2228a3.9132 3.9132 0 0 0-.332.019c-.8781.1012-1.67.5699-2.155 1.3862-.475.8-.5922 1.6809-.35 2.4971.2421.8162.8297 1.5575 1.6982 2.1449.0053.0035.0106.0076.0163.0114.746.4498 1.492.7431 2.2877.8994-.02.3318-.0272.6689-.006 1.0181.0634 1.0432.4368 2.0006.996 2.8492l-2.0061.8189a.4163.4163 0 0 0-.2276.2239.416.416 0 0 0 .0879.455.415.415 0 0 0 .2941.1231.4156.4156 0 0 0 .1595-.0312l2.2093-.9035c.408.4859.8695.9315 1.3723 1.318.0196.0151.0407.0264.0603.0423l-1.2918 1.7103a.416.416 0 0 0 .664.501l1.314-1.7385c.7185.4548 1.4782.7927 2.2294 1.0242.3833.7209 1.1379 1.1871 2.0202 1.1871.8907 0 1.6442-.501 2.0242-1.2072.744-.2347 1.4959-.5729 2.2073-1.0262l1.332 1.7606a.4157.4157 0 0 0 .7439-.1936.4165.4165 0 0 0-.0799-.3074l-1.3099-1.7345c.0083-.0075.0178-.0113.0261-.0188.4968-.3803.9549-.8175 1.3622-1.2939l2.155.8794a.4156.4156 0 0 0 .5412-.2276.4151.4151 0 0 0-.2273-.5432l-1.9438-.7928c.577-.8538.9697-1.8183 1.0504-2.8693.0268-.3507.0242-.6914.0079-1.0262.7905-.1572 1.5321-.4502 2.2737-.8974.0053-.0033.011-.0076.0163-.0113.8684-.5874 1.456-1.3287 1.6982-2.145.2421-.8161.125-1.697-.3501-2.497-.4849-.8163-1.2768-1.2852-2.155-1.3863a3.2175 3.2175 0 0 0-.332-.0189c-.7852-.0151-1.6231.229-2.4286.6942-.5926.342-1.1252.867-1.5433 1.4387-1.1699-.6703-2.6923-1.0476-4.5635-1.0785a15.5768 15.5768 0 0 0-.5111 0c-2.085.034-3.7537.43-5.0142 1.1449-.0033-.0038-.0045-.0114-.008-.0152-.4233-.5916-.973-1.1365-1.5835-1.489-.8055-.465-1.6434-.7083-2.4286-.6941Zm.2858.7365c.5568.042 1.1696.2358 1.7787.5875.485.28.9757.7554 1.346 1.2696a5.6875 5.6875 0 0 0-.4969.4085c-.9201.8516-1.4615 1.9597-1.668 3.2335-.6809-.1402-1.3183-.3945-1.984-.7948-.7553-.5128-1.2159-1.1225-1.4004-1.7445-.1851-.624-.1074-1.2712.2776-1.9196.3743-.63.9275-.9534 1.6118-1.0322a2.796 2.796 0 0 1 .5352-.0076Zm17.5094 0a2.797 2.797 0 0 1 .5353.0075c.6842.0786 1.2374.4021 1.6117 1.0322.385.6484.4627 1.2957.2776 1.9196-.1845.622-.645 1.2317-1.4004 1.7445-.6578.3955-1.2881.6472-1.9598.7888-.1942-1.2968-.7375-2.4338-1.666-3.302a5.5639 5.5639 0 0 0-.4709-.3923c.3645-.49.8287-.9428 1.2938-1.2113.6091-.3515 1.2219-.5454 1.7787-.5875ZM12.006 6.0036a14.832 14.832 0 0 1 .487 0c2.3901.0393 4.0848.67 5.1631 1.678 1.1501 1.0754 1.6423 2.6006 1.499 4.467-.1311 1.7079-1.2203 3.2281-2.652 4.324-.694.5313-1.4626.9354-2.2254 1.2294.0031-.0453.014-.0888.014-.1349.0029-1.1964-.9313-2.2133-2.2918-2.2133-1.3606 0-2.3222 1.0154-2.2918 2.2213.0013.0507.014.0972.0181.1471-.781-.2933-1.5696-.7013-2.2777-1.2456-1.4239-1.0945-2.4997-2.6129-2.6037-4.322-.1129-1.8567.3778-3.3382 1.5212-4.3965C7.5094 6.7 9.352 6.047 12.006 6.0036Zm-3.6419 6.8291c-.6053 0-1.0966.4903-1.0966 1.0966 0 .6063.4913 1.0986 1.0966 1.0986s1.0966-.4923 1.0966-1.0986c0-.6063-.4913-1.0966-1.0966-1.0966zm7.2819.0113c-.5998 0-1.0866.4859-1.0866 1.0866s.4868 1.0885 1.0866 1.0885c.5997 0 1.0865-.4878 1.0865-1.0885s-.4868-1.0866-1.0865-1.0866zM12 16.0835c1.0237 0 1.5654.638 1.5634 1.4829-.0018.7849-.6723 1.485-1.5634 1.485-.9167 0-1.54-.5629-1.5634-1.493-.0212-.8347.5397-1.4749 1.5634-1.4749Z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={lemmyPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#00BC8C" />
        <path fill="#FFFFFF" d={lemmyPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 26. Listmonk (Official blue roundel with white concentric rings)
  listmonk: ({ size = 20, className = '', variant = 'app-icon' }) => {
    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0m0 5.1953A6.8047 6.8047 0 0 1 18.8047 12 6.8047 6.8047 0 0 1 12 18.8047 6.8047 6.8047 0 0 1 5.1953 12 6.8047 6.8047 0 0 1 12 5.1953" />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <circle cx="12" cy="12" r="12" fill="#0045FF" />
        <circle cx="12" cy="12" r="5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      </svg>
    );
  },

  // 27. Hashnode (Official blue squircle with solid white faceted gem)
  hashnode: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const hashPath =
      'M22.351 8.019l-6.37-6.37a5.63 5.63 0 0 0-7.962 0l-6.37 6.37a5.63 5.63 0 0 0 0 7.962l6.37 6.37a5.63 5.63 0 0 0 7.962 0l6.37-6.37a5.63 5.63 0 0 0 0-7.962zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={hashPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#2962FF" />
        <path fill="#FFFFFF" d={hashPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 28. Dev.to (Official black squircle with solid white DEV badge)
  devto: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const devPath =
      'M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.21v4.24h1.37c.38 0 .66-.05.84-.16.18-.11.32-.28.41-.53.09-.24.14-.58.14-1.02v-.83c0-.45-.05-.79-.14-1.03-.09-.24-.23-.4-.41-.5zm14.39-7.86H2.19C.98 2.19 0 3.17 0 4.38v15.24c0 1.21.98 2.19 2.19 2.19h19.62c1.21 0 2.19-.98 2.19-2.19V4.38c0-1.21-.98-2.19-2.19-2.19zm-13.62 13h-4.4V8.81h4.4c.83 0 1.5.15 2.01.44.51.3.89.74 1.14 1.33.25.59.38 1.34.38 2.25v.34c0 .91-.13 1.66-.38 2.25-.25.59-.63 1.03-1.14 1.33-.51.29-1.18.44-2.01.44zm6.05 0h-3.41V8.81h3.41v1.17h-2.13v1.88h1.89v1.17h-1.89v1.88h2.13v1.28zm5.72-3.92-1.63 3.92h-1.45l-1.63-3.92V17.3h-1.28V8.81h1.7l1.94 4.67 1.94-4.67h1.7v8.49h-1.28v-4.08z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size * 0.75} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={devPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="4.5" fill="#0A0A0A" />
        <path fill="#FFFFFF" d={devPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },

  // 29. TikTok (Official black squircle with authentic multi-color note)
  tiktok: ({ size = 20, className = '', variant = 'app-icon' }) => {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        {variant !== 'glyph' && <rect width="24" height="24" rx="5" fill="#000000" />}
        <g transform={variant === 'glyph' ? '' : 'translate(1.2, 1.2) scale(0.9)'}>
          <path
            fill="#25F4EE"
            d="M17.5 6.5a4.5 4.5 0 0 1-3.5-3.8h-2.5v11.8a2.5 2.5 0 1 1-2.5-2.5c.3 0 .7.1 1 .2V9.7a5.5 5.5 0 1 0 4 5.3V8.2a7.5 7.5 0 0 0 3.5 1.2V6.5z"
            transform="translate(-0.4, -0.4)"
          />
          <path
            fill="#FE2C55"
            d="M17.5 6.5a4.5 4.5 0 0 1-3.5-3.8h-2.5v11.8a2.5 2.5 0 1 1-2.5-2.5c.3 0 .7.1 1 .2V9.7a5.5 5.5 0 1 0 4 5.3V8.2a7.5 7.5 0 0 0 3.5 1.2V6.5z"
            transform="translate(0.4, 0.4)"
          />
          <path
            fill="#FFFFFF"
            d="M17.5 6.5a4.5 4.5 0 0 1-3.5-3.8h-2.5v11.8a2.5 2.5 0 1 1-2.5-2.5c.3 0 .7.1 1 .2V9.7a5.5 5.5 0 1 0 4 5.3V8.2a7.5 7.5 0 0 0 3.5 1.2V6.5z"
          />
        </g>
      </svg>
    );
  },

  // 30. Manual / Other (Slate squircle with clean link icon)
  manual: ({ size = 20, className = '', variant = 'app-icon' }) => {
    const linkPath =
      'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z';

    if (variant === 'glyph') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
          <path d={linkPath} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
        <rect width="24" height="24" rx="5" fill="#4B5563" />
        <path fill="#FFFFFF" d={linkPath} transform="translate(2.4, 2.4) scale(0.8)" />
      </svg>
    );
  },
};

// Aliases
PlatformSVGs['twitter'] = PlatformSVGs['x'];
PlatformSVGs['dev.to'] = PlatformSVGs['devto'];
PlatformSVGs['farcaster'] = PlatformSVGs['warpcast'];

// ── Complete Platform Config Map (Logos, Names, Brand Colors) ─────────────────

export const PlatformLogos: Record<string, PlatformConfig> = {
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    bg: '#0A66C2',
    logo: PlatformSVGs.linkedin,
  },
  x: {
    name: 'X',
    color: '#000000',
    bg: '#000000',
    logo: PlatformSVGs.x,
  },
  twitter: {
    name: 'X',
    color: '#000000',
    bg: '#000000',
    logo: PlatformSVGs.x,
  },
  threads: {
    name: 'Threads',
    color: '#101010',
    bg: '#101010',
    logo: PlatformSVGs.threads,
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    bg: '#E1306C',
    logo: PlatformSVGs.instagram,
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bg: '#1877F2',
    logo: PlatformSVGs.facebook,
  },
  bluesky: {
    name: 'Bluesky',
    color: '#0085FF',
    bg: '#0085FF',
    logo: PlatformSVGs.bluesky,
  },
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    bg: '#25D366',
    logo: PlatformSVGs.whatsapp,
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    bg: '#FF0000',
    logo: PlatformSVGs.youtube,
  },
  pinterest: {
    name: 'Pinterest',
    color: '#E60023',
    bg: '#E60023',
    logo: PlatformSVGs.pinterest,
  },
  mastodon: {
    name: 'Mastodon',
    color: '#6364FF',
    bg: '#6364FF',
    logo: PlatformSVGs.mastodon,
  },
  slack: {
    name: 'Slack',
    color: '#E01E5A',
    bg: '#E01E5A',
    logo: PlatformSVGs.slack,
  },
  reddit: {
    name: 'Reddit',
    color: '#FF4500',
    bg: '#FF4500',
    logo: PlatformSVGs.reddit,
  },
  twitch: {
    name: 'Twitch',
    color: '#9146FF',
    bg: '#9146FF',
    logo: PlatformSVGs.twitch,
  },
  telegram: {
    name: 'Telegram',
    color: '#229ED9',
    bg: '#229ED9',
    logo: PlatformSVGs.telegram,
  },
  discord: {
    name: 'Discord',
    color: '#5865F2',
    bg: '#5865F2',
    logo: PlatformSVGs.discord,
  },
  dribbble: {
    name: 'Dribbble',
    color: '#EA4C89',
    bg: '#EA4C89',
    logo: PlatformSVGs.dribbble,
  },
  skool: {
    name: 'Skool',
    color: '#FFC83B',
    bg: '#FFC83B',
    logo: PlatformSVGs.skool,
  },
  whop: {
    name: 'Whop',
    color: '#FF5A00',
    bg: '#FF5A00',
    logo: PlatformSVGs.whop,
  },
  kick: {
    name: 'Kick',
    color: '#53FC18',
    bg: '#53FC18',
    logo: PlatformSVGs.kick,
  },

  warpcast: {
    name: 'Farcaster',
    color: '#8A63D2',
    bg: '#8A63D2',
    logo: PlatformSVGs.warpcast,
  },
  farcaster: {
    name: 'Farcaster',
    color: '#8A63D2',
    bg: '#8A63D2',
    logo: PlatformSVGs.warpcast,
  },
  mewe: {
    name: 'MeWe',
    color: '#2F435E',
    bg: '#2F435E',
    logo: PlatformSVGs.mewe,
  },
  nostr: {
    name: 'Nostr',
    color: '#9B51E0',
    bg: '#9B51E0',
    logo: PlatformSVGs.nostr,
  },
  medium: {
    name: 'Medium',
    color: '#12100E',
    bg: '#12100E',
    logo: PlatformSVGs.medium,
  },
  lemmy: {
    name: 'Lemmy',
    color: '#00BC8C',
    bg: '#00BC8C',
    logo: PlatformSVGs.lemmy,
  },
  listmonk: {
    name: 'Listmonk',
    color: '#0045FF',
    bg: '#0045FF',
    logo: PlatformSVGs.listmonk,
  },
  hashnode: {
    name: 'Hashnode',
    color: '#2962FF',
    bg: '#2962FF',
    logo: PlatformSVGs.hashnode,
  },
  devto: {
    name: 'Dev.to',
    color: '#0A0A0A',
    bg: '#0A0A0A',
    logo: PlatformSVGs.devto,
  },
  'dev.to': {
    name: 'Dev.to',
    color: '#0A0A0A',
    bg: '#0A0A0A',
    logo: PlatformSVGs.devto,
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    bg: '#000000',
    logo: PlatformSVGs.tiktok,
  },
  manual: {
    name: 'Manual',
    color: '#6B7280',
    bg: '#6B7280',
    logo: PlatformSVGs.manual,
  },
};

/**
 * Safe accessor that returns a valid PlatformConfig for any platform key.
 * Normalizes case, handles aliases, and provides a polished fallback.
 */
export function getPlatformConfig(platform: string): PlatformConfig {
  const normalized = (platform || '').trim().toLowerCase();
  if (PlatformLogos[normalized]) {
    return PlatformLogos[normalized];
  }

  // Fallback for unknown platform
  const prettyName = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Platform';
  return {
    name: prettyName,
    color: '#6B7280',
    bg: '#6B7280',
    logo: PlatformSVGs.manual,
  };
}

/**
 * Universal PlatformBrandLogo component
 */
export function PlatformBrandLogo({
  platform,
  size = 20,
  className = '',
  variant = 'app-icon',
}: {
  platform: string;
  size?: number;
  className?: string;
  variant?: 'app-icon' | 'glyph';
}) {
  const cfg = getPlatformConfig(platform);
  const Logo = cfg.logo;
  return <Logo size={size} className={className} variant={variant} />;
}
