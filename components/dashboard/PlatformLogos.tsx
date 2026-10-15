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
  | 'vk'
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

export interface PlatformConfig {
  name: string;
  color: string;
  bg?: string;
  logo: React.FC<{ size?: number; className?: string }>;
}

// ── Official & Authentic SVG Logos ───────────────────────────────────────────

export const PlatformSVGs: Record<string, React.FC<{ size?: number; className?: string }>> = {
  // 1. LinkedIn (Official "in" badge)
  linkedin: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2" className={`flex-shrink-0 ${className}`}>
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a1.66 1.66 0 000 1.14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  ),

  // 2. X / Twitter (Official stylized X)
  x: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),

  // 3. Threads (Official @ monogram)
  threads: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor" className={`flex-shrink-0 ${className}`}>
      <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.745C82.2364 44.745 70.1369 51.5765 63.5765 63.3545L75.2024 70.6031C80.0505 62.2784 88.2266 58.2497 97.222 58.2497C97.302 58.2497 97.3826 58.2497 97.4632 58.2504C108.311 58.3263 116.373 63.2067 121.072 72.5739C124.474 79.3627 125.795 87.5692 125.011 97.0684C118.716 93.8805 111.245 92.2816 103.087 92.2816C78.5459 92.2816 62.2275 105.888 63.285 126.383C63.8385 137.188 69.2854 146.683 78.4808 152.904C86.4024 158.267 96.3883 160.734 106.667 160.173C120.063 159.443 130.581 154.26 137.955 144.781C143.578 137.601 147.258 128.527 149.104 117.317C154.118 120.112 157.935 123.802 160.351 128.423C164.651 136.891 165.029 150.511 155.909 159.773C147.762 168.041 137.856 171.894 122.933 172.032C106.162 171.878 93.5498 167.049 85.2527 157.723C77.3733 148.852 73.2517 136.543 72.9765 121.148C73.2517 105.752 77.3733 93.4436 85.2527 84.573C93.5498 75.2477 106.162 70.4181 122.933 70.264Z" />
    </svg>
  ),

  // 4. Instagram (Authentic multi-stop gradient camera)
  instagram: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
      <defs>
        <radialGradient id="ig-brand-gradient" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="50%" stopColor="#fd5949" />
          <stop offset="68%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path fill="url(#ig-brand-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),

  // 5. Facebook (Official blue roundel)
  facebook: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2" className={`flex-shrink-0 ${className}`}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),

  // 6. Bluesky (Official butterfly)
  bluesky: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 360 320" fill="#0085FF" className={`flex-shrink-0 ${className}`}>
      <path d="M180 141.964C163.699 110.262 119.308 51.1817 78.0834 31.0445C38.4622 11.6012 1.01713 22.5943 1.01713 74.2913C1.01713 84.0502 6.28388 149.135 9.29108 160.994C21.6498 207.979 70.8174 219.185 115.124 212.405C175.154 202.921 256.555 190.651 180 141.964ZM180 141.964C196.301 110.262 240.692 51.1817 281.917 31.0445C321.538 11.6012 358.983 22.5943 358.983 74.2913C358.983 84.0502 353.716 149.135 350.709 160.994C338.35 207.979 289.183 219.185 244.876 212.405C184.846 202.921 103.445 190.651 180 141.964Z" />
      <path d="M180.026 194.895C180.026 194.895 133.738 210.527 118.981 242.765C109.649 263.297 112.956 295.538 155.77 301.622C169.285 303.566 185.24 302.805 199.999 299.375C214.747 295.949 228.248 288.741 237.019 277.879C250.534 261.146 247.888 225.469 232.975 212.205C218.076 198.953 180.026 194.895 180.026 194.895Z" />
    </svg>
  ),

  // 7. WhatsApp (Official chat bubble & handset)
  whatsapp: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" className={`flex-shrink-0 ${className}`}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),

  // 8. YouTube (Official red play rectangle)
  youtube: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000" className={`flex-shrink-0 ${className}`}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),

  // 9. Pinterest (Official red P monogram)
  pinterest: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#E60023" className={`flex-shrink-0 ${className}`}>
      <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.99-.1-2.52.21-3.6.28-.97 1.83-6.22 1.83-6.22s-.47-.94-.47-2.33c0-2.18 1.26-3.81 2.84-3.81 1.34 0 1.99 1.01 1.99 2.22 0 1.35-.86 3.37-1.3 5.24-.37 1.57.79 2.85 2.34 2.85 2.81 0 4.97-2.96 4.97-7.23 0-3.78-2.72-6.42-6.6-6.42-4.5 0-7.14 3.38-7.14 6.86 0 1.36.52 2.82 1.18 3.61.13.16.15.3.11.46-.12.51-.39 1.58-.44 1.8-.07.29-.23.35-.53.21-1.98-.92-3.22-3.81-3.22-6.13 0-4.99 3.63-9.58 10.46-9.58 5.5 0 9.77 3.92 9.77 9.15 0 5.46-3.44 9.86-8.22 9.86-1.61 0-3.12-.84-3.64-1.83l-.99 3.77c-.36 1.38-1.33 3.11-1.98 4.16A12 12 0 1 0 12 0z" />
    </svg>
  ),

  // 10. Mastodon (Official mammoth M glyph)
  mastodon: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#6364FF" className={`flex-shrink-0 ${className}`}>
      <path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61C16.924 2.213 14.1 2.016 12.022 2c-2.079.016-4.903.213-6.463.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.18.046 3.447.24 4.673 2.454 9.177 8.685 9.53 3.65.207 6.466-.757 6.466-.757l-.147-1.74s-2.585.819-5.503.737c-2.899-.082-4.137-1.157-4.277-2.126-.038-.26-.057-.542-.057-.841 0-.01 0-.02.001-.03 2.87.697 5.753.518 8.441.229 2.502-.27 4.148-1.554 4.316-2.07.457-1.411.666-4.223.666-6.235zm-2.923 5.922h-2.17V8.97c0-1.714-.73-2.586-2.193-2.586-1.536 0-2.305.992-2.305 2.977v4.116H9.566V9.361c0-1.985-.769-2.977-2.305-2.977-1.463 0-2.193.872-2.193 2.586v5.518H2.897V8.804c0-1.715.437-3.08 1.31-4.095.874-1.015 2.018-1.523 3.432-1.523 1.637 0 2.871.628 3.702 1.884L12 6.16l.659-1.09c.831-1.256 2.065-1.884 3.702-1.884 1.414 0 2.558.508 3.432 1.523.873 1.015 1.31 2.38 1.31 4.095v5.684z" />
    </svg>
  ),

  // 11. Slack (Authentic 4-color octothorpe)
  slack: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E" />
    </svg>
  ),

  // 12. Reddit (Official Snoo alien head)
  reddit: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF4500" className={`flex-shrink-0 ${className}`}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.612a1.24 1.24 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.095.327.327 0 0 0 0 .462c.969.969 2.525.969 3.494 0a.327.327 0 0 0 0-.462.327.327 0 0 0-.462 0c-.714.714-1.856.714-2.57 0a.327.327 0 0 0-.231-.095z" />
    </svg>
  ),

  // 13. Twitch (Official Glitch icon)
  twitch: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#9146FF" className={`flex-shrink-0 ${className}`}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  ),

  // 14. Telegram (Official paper airplane roundel)
  telegram: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#229ED9" className={`flex-shrink-0 ${className}`}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.85.93z" />
    </svg>
  ),

  // 15. Discord (Official Clyde game pad)
  discord: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#5865F2" className={`flex-shrink-0 ${className}`}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),

  // 16. Dribbble (Official basketball emblem)
  dribbble: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#EA4C89" className={`flex-shrink-0 ${className}`}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.118-10.424c-.389-.12-2.787-.84-5.617-.384.887 2.438 1.247 4.5 1.343 5.111 2.508-1.127 4.274-3.515 4.274-6.327v-.4zm-5.785 6.012c-.12-.768-.504-2.892-1.428-5.351-.048.012-.096.024-.144.036-6.192 1.944-8.411 5.832-8.543 6.072 1.584 1.092 3.492 1.74 5.556 1.74 1.668 0 3.228-.432 4.559-1.497zm-11.231-.768c.24-.396 2.64-4.2 8.687-6.036.192-.06.384-.108.576-.156-.372-.828-.78-1.644-1.224-2.436-5.064 1.524-9.924 1.524-10.428 1.524-.012.216-.012.432-.012.66 0 2.508.972 4.8 2.401 6.444zm-3.085-8.496c.72-.012 4.968-.072 9.84-1.464-1.572-2.796-3.276-5.184-3.528-5.532-3.132 1.344-5.4 4.176-6.312 7zm8.136-7.8c.264.36 1.956 2.724 3.516 5.484 2.928-.792 5.568-.78 5.868-.768A9.974 9.974 0 0012 2.016c-.66 0-1.308.06-1.86.108zm10.74 6.372c-.444-.012-3.216-.024-6.3 1.008.384.744.732 1.512 1.056 2.292 2.724-.396 5.088.192 5.376.264.084-.696.12-1.392.12-2.1 0-.504-.072-1-.252-1.464z" />
    </svg>
  ),

  // 17. Kick (Official pixelated K block)
  kick: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#53FC18" className={`flex-shrink-0 ${className}`}>
      <path d="M1.333 0h8v5.333H6.667v2.667h2.666V16H6.667v2.667h2.666V24h-8zm13.334 5.333h5.333v2.667h-2.667V10.667h-2.666zm5.333 5.334H24v2.666h-4.001zm-2.667 2.666h2.667v2.667h-2.667V16zm-2.667 2.667h2.667v2.667H14.667z" />
    </svg>
  ),

  // 18. VK (VKontakte official monogram)
  vk: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0077FF" className={`flex-shrink-0 ${className}`}>
      <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.072-1.785.748-2.38 1.637-1.464 1.155 1.19 1.767 2.379 3.036 2.379h2.32c1.077 0 1.543-.53 1.185-1.503-.545-1.47-2.148-3.136-2.91-4.086-.484-.593-.362-.857 0-1.428.026-.041 2.374-3.323 2.613-4.523.126-.628-.27-.854-.972-.854h-2.52c-.63 0-.89.317-1.074.757-.59 1.41-1.634 3.738-2.227 4.14-.378.257-.549.171-.549-.343V8.45c0-.756-.221-1.096-.85-1.096h-3.955c-.49 0-.783.364-.783.708 0 .717 1.073.882 1.183 2.901v3.292c0 .72-.13.85-.417.85-.765 0-2.628-2.766-3.732-5.926-.264-.748-.528-1.033-1.282-1.033H2.032c-.818 0-.982.386-.982.812 0 .762.977 4.542 4.544 9.541 2.378 3.326 5.727 4.495 7.568 4.495z" />
    </svg>
  ),

  // 19. Farcaster (Official arch W)
  warpcast: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#8A63D2" className={`flex-shrink-0 ${className}`}>
      <path d="M18.24.24H5.76A5.52 5.52 0 0 0 .24 5.76v12.48a5.52 5.52 0 0 0 5.52 5.52h12.48a5.52 5.52 0 0 0 5.52-5.52V5.76A5.52 5.52 0 0 0 18.24.24zm-1.8 17.52h-2.16v-6.36c0-1.19-.97-2.16-2.16-2.16h-.24c-1.19 0-2.16.97-2.16 2.16v6.36H7.56V8.16h2.16v1.44c.66-.99 1.77-1.56 2.97-1.56h.24c1.98 0 3.51 1.62 3.51 3.6v6.12z" />
    </svg>
  ),

  // 20. Skool (Official academic emblem)
  skool: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#E2AD44" className={`flex-shrink-0 ${className}`}>
      <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2zm-7 9.88v4.24C5 19.3 8.13 22 12 22s7-2.7 7-5.88v-4.24l-7 3.18-7-3.06z" />
    </svg>
  ),

  // 21. Whop (Official orange geometric W)
  whop: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF5A00" className={`flex-shrink-0 ${className}`}>
      <path d="M3.2 4h3.6l3.2 11.2L12.8 8h2.4l2.8 7.2L21.2 4h3.6l-4.8 16h-3.6L14 12.8 11.6 20H8L3.2 4z" />
    </svg>
  ),

  // 22. MeWe (Official speech bubble badge)
  mewe: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#2F435E" className={`flex-shrink-0 ${className}`}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 2.21.72 4.25 1.94 5.9L2.5 21.5l3.77-1.38C7.88 21.31 9.87 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-1.8 13.8h-1.6l-1.8-6.4h1.6l1 4.2 1-4.2h1.6l1 4.2 1-4.2h1.6l-1.8 6.4h-1.6l-1-4-1 4z" />
    </svg>
  ),

  // 23. Nostr (Official purple roundel with lightning)
  nostr: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`flex-shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="11" fill="#9B51E0" />
      <path d="M13 4.5L6.5 13.5H12l-1.5 6 7-9.5h-5.5l1-5.5z" fill="#FFD700" />
    </svg>
  ),

  // 24. Medium (Official 3-ellipse glyph)
  medium: ({ size = 20, className = '' }) => (
    <svg width={size} height={size * 0.7} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  ),

  // 25. Lemmy (Official spiral mascot emblem)
  lemmy: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#00BC8C" className={`flex-shrink-0 ${className}`}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3.5c2.48 0 4.5 2.02 4.5 4.5 0 1.25-.51 2.38-1.33 3.19l1.41 1.41c1.18-1.18 1.92-2.8 1.92-4.6 0-3.59-2.91-6.5-6.5-6.5S5.5 6.41 5.5 10c0 1.8.74 3.42 1.92 4.6l1.41-1.41C8.01 12.38 7.5 11.25 7.5 10c0-2.48 2.02-4.5 4.5-4.5zm0 6c-.83 0-1.5-.67-1.5-1.5S11.17 8.5 12 8.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  ),

  // 26. Listmonk (Official newsletter envelope)
  listmonk: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0045FF" className={`flex-shrink-0 ${className}`}>
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),

  // 27. Hashnode (Official blue faceted gem)
  hashnode: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#2962FF" className={`flex-shrink-0 ${className}`}>
      <path d="M22.351 8.019l-6.37-6.37a5.63 5.63 0 0 0-7.962 0l-6.37 6.37a5.63 5.63 0 0 0 0 7.962l6.37 6.37a5.63 5.63 0 0 0 7.962 0l6.37-6.37a5.63 5.63 0 0 0 0-7.962zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
    </svg>
  ),

  // 28. Dev.to (Official DEV badge)
  devto: ({ size = 20, className = '' }) => (
    <svg width={size} height={size * 0.75} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
      <path d="M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.21v4.24h1.37c.38 0 .66-.05.84-.16.18-.11.32-.28.41-.53.09-.24.14-.58.14-1.02v-.83c0-.45-.05-.79-.14-1.03-.09-.24-.23-.4-.41-.5zm14.39-7.86H2.19C.98 2.19 0 3.17 0 4.38v15.24c0 1.21.98 2.19 2.19 2.19h19.62c1.21 0 2.19-.98 2.19-2.19V4.38c0-1.21-.98-2.19-2.19-2.19zm-13.62 13h-4.4V8.81h4.4c.83 0 1.5.15 2.01.44.51.3.89.74 1.14 1.33.25.59.38 1.34.38 2.25v.34c0 .91-.13 1.66-.38 2.25-.25.59-.63 1.03-1.14 1.33-.51.29-1.18.44-2.01.44zm6.05 0h-3.41V8.81h3.41v1.17h-2.13v1.88h1.89v1.17h-1.89v1.88h2.13v1.28zm5.72-3.92-1.63 3.92h-1.45l-1.63-3.92V17.3h-1.28V8.81h1.7l1.94 4.67 1.94-4.67h1.7v8.49h-1.28v-4.08z" />
    </svg>
  ),

  // 29. TikTok (Official music note logo)
  tiktok: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${className}`}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.28 6.28 0 0 0 1.94-4.54V8.41a8.3 8.3 0 0 0 4.83 1.54V6.5a4.78 4.78 0 0 1-1-.19z" />
    </svg>
  ),

  // 30. Manual / Other (Clean clipboard link icon)
  manual: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#6B7280" className={`flex-shrink-0 ${className}`}>
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  ),
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
    color: '#4A154B',
    bg: '#4A154B',
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
    color: '#E2AD44',
    bg: '#E2AD44',
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
  vk: {
    name: 'VK',
    color: '#0077FF',
    bg: '#0077FF',
    logo: PlatformSVGs.vk,
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
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const cfg = getPlatformConfig(platform);
  const Logo = cfg.logo;
  return <Logo size={size} className={className} />;
}
