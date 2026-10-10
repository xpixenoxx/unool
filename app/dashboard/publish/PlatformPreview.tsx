'use client';

import React from 'react';

type Platform = 'linkedin' | 'x' | 'threads' | 'manual' | 'facebook' | 'instagram' | 'youtube' | 'pinterest' | 'bluesky' | 'slack' | 'mastodon' | 'twitch' | 'telegram' | 'discord' | 'dribbble' | 'skool' | 'whop' | 'kick' | 'vk' | 'warpcast';

interface PlatformPreviewProps {
  platform: Platform;
  content: string;
  mediaUrls?: { url: string; type: 'image' | 'video'; alt?: string }[];
  username?: string;
  displayName?: string;
}

/** Renders content preserving newlines */
function PostContent({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {text}
    </div>
  );
}

/** Avatar placeholder */
function Avatar({ size = 40, bg = '#6366f1' }: { size?: number; bg?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
      }}
    >
      U
    </div>
  );
}

/* ─── X / Twitter ─── */
function XPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#000', color: '#e7e9ea', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #2f3336' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#e7e9ea"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </div>
      {/* Post */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Avatar size={40} bg="#6366f1" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{displayName || 'User'}</span>
              <svg viewBox="0 0 22 22" width="16" height="16" fill="#1d9bf0"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.607-.274 1.264-.144 1.897.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>
              <span style={{ color: '#71767b', fontSize: 15 }}>@{username || 'user'} · now</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 15, lineHeight: '20px', maxHeight: 280, overflowY: 'auto' }}>
              <PostContent text={content} />
            </div>
            {mediaUrls && mediaUrls.length > 0 && (
              <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', border: '1px solid #2f3336' }}>
                <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
              </div>
            )}
            {/* Engagement */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: '#71767b', fontSize: 13, maxWidth: 360 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>
                48
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>
                312
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.56-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.7-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.97.846 4.17-.514 6.67z"/></svg>
                1.2K
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21v-5h2v5H4z"/></svg>
                45K
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── LinkedIn ─── */
function LinkedInPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#1b1f23', color: '#e8e6df', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 12, overflow: 'hidden', border: '1px solid #38434f' }}>
      {/* Post header */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar size={48} bg="#0a66c2" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName || 'User'}</div>
            <div style={{ fontSize: 12, color: '#ffffffa6' }}>@{username || 'user'} · 1st</div>
            <div style={{ fontSize: 12, color: '#ffffffa6' }}>Just now · 🌐</div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: '20px', maxHeight: 280, overflowY: 'auto' }}>
        <PostContent text={content} />
      </div>
      {mediaUrls && mediaUrls.length > 0 && (
        <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
      )}
      {/* Engagement */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #38434f', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ffffffa6' }}>
        <span>👍 24</span>
        <span>5 comments · 2 reposts</span>
      </div>
      <div style={{ padding: '4px 16px 12px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #38434f' }}>
        {['👍 Like', '💬 Comment', '🔄 Repost', '📤 Send'].map(a => (
          <span key={a} style={{ fontSize: 12, color: '#ffffffa6', padding: '8px 0' }}>{a}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Threads ─── */
function ThreadsPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#101010', color: '#f3f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Avatar size={36} bg="#333" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{username || 'user'}</span>
              <svg viewBox="0 0 22 22" width="14" height="14" fill="#0095f6"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.607-.274 1.264-.144 1.897.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>
              <span style={{ color: '#777', fontSize: 13 }}>· now</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 14, lineHeight: '20px', maxHeight: 280, overflowY: 'auto' }}>
              <PostContent text={content} />
            </div>
            {mediaUrls && mediaUrls.length > 0 && (
              <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
                <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
              </div>
            )}
            {/* Engagement */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, color: '#777', fontSize: 13 }}>
              <span>♡ 86</span>
              <span>💬 12</span>
              <span>⟲ 24</span>
              <span>↗ Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Instagram ─── */
function InstagramPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#000', color: '#f5f5f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #262626' }}>
        <Avatar size={32} bg="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{username || 'user'}</span>
        <span style={{ marginLeft: 'auto', color: '#a8a8a8', fontSize: 18, cursor: 'pointer' }}>···</span>
      </div>
      {/* Image area */}
      {mediaUrls && mediaUrls.length > 0 ? (
        <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 120, background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 36 }}>📸</span>
        </div>
      )}
      {/* Actions */}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 16, fontSize: 22 }}>
        <span>♡</span>
        <span>💬</span>
        <span>↗</span>
        <span style={{ marginLeft: 'auto' }}>🔖</span>
      </div>
      {/* Likes */}
      <div style={{ padding: '0 14px', fontWeight: 600, fontSize: 13 }}>142 likes</div>
      {/* Caption */}
      <div style={{ padding: '4px 14px 14px', fontSize: 13, lineHeight: '18px', maxHeight: 140, overflowY: 'auto' }}>
        <span style={{ fontWeight: 600, marginRight: 6 }}>{username || 'user'}</span>
        <PostContent text={content} className="inline" />
      </div>
    </div>
  );
}

/* ─── Bluesky ─── */
function BlueskyPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#16202a', color: '#e4e6eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 12, overflow: 'hidden', border: '1px solid #2a3a4a' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar size={42} bg="#0085ff" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{displayName || 'User'}</span>
              <span style={{ color: '#7b8c9e', fontSize: 13 }}>@{username || 'user'}.bsky.social</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 14, lineHeight: '20px', maxHeight: 280, overflowY: 'auto' }}>
              <PostContent text={content} />
            </div>
            {mediaUrls && mediaUrls.length > 0 && (
              <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden' }}>
                <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 24, marginTop: 10, color: '#7b8c9e', fontSize: 13 }}>
              <span>💬 8</span>
              <span>🔁 34</span>
              <span>♡ 210</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Facebook ─── */
function FacebookPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#242526', color: '#e4e6eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar size={40} bg="#1877f2" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName || 'User'}</div>
            <div style={{ fontSize: 12, color: '#b0b3b8' }}>Just now · 🌐</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: '20px', maxHeight: 280, overflowY: 'auto' }}>
        <PostContent text={content} />
      </div>
      {mediaUrls && mediaUrls.length > 0 && (
        <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
      )}
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#b0b3b8', borderTop: '1px solid #3e4042' }}>
        <span>👍😂 52</span>
        <span>8 comments · 3 shares</span>
      </div>
      <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #3e4042' }}>
        {['👍 Like', '💬 Comment', '↗ Share'].map(a => (
          <span key={a} style={{ fontSize: 13, color: '#b0b3b8', padding: '8px 0', fontWeight: 600 }}>{a}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── YouTube ─── */
function YouTubePreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#0f0f0f', color: '#f1f1f1', fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', borderRadius: 12, overflow: 'hidden' }}>
      {/* Video thumbnail */}
      {mediaUrls && mediaUrls.length > 0 ? (
        <div style={{ position: 'relative' }}>
          <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: '#000000cc', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>3:42</div>
        </div>
      ) : (
        <div style={{ width: '100%', height: 120, background: 'linear-gradient(135deg, #282828, #181818)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <svg viewBox="0 0 68 48" width="48" height="34"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/><path d="M45 24L27 14v20" fill="#fff"/></svg>
        </div>
      )}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar size={36} bg="#ff0000" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 14, lineHeight: '20px', maxHeight: 40, overflow: 'hidden' }}>
              {content.split('\n')[0] || 'Video Post'}
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
              {displayName || 'User'} · 1 view · just now
            </div>
          </div>
        </div>
        {content.split('\n').length > 1 && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#aaa', lineHeight: '18px', maxHeight: 120, overflowY: 'auto' }}>
            <PostContent text={content.split('\n').slice(1).join('\n')} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Pinterest ─── */
function PinterestPreview({ content, mediaUrls, username, displayName }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#1e1e1e', color: '#efefef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', borderRadius: 16, overflow: 'hidden' }}>
      {mediaUrls && mediaUrls.length > 0 ? (
        <img src={mediaUrls[0].url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg, #e60023, #bd081c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 36 }}>📌</span>
        </div>
      )}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: '22px', maxHeight: 44, overflow: 'hidden' }}>
          {content.split('\n')[0] || 'Pin'}
        </div>
        {content.split('\n').length > 1 && (
          <div style={{ marginTop: 6, fontSize: 13, color: '#b0b0b0', lineHeight: '18px', maxHeight: 80, overflowY: 'auto' }}>
            <PostContent text={content.split('\n').slice(1).join('\n')} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <Avatar size={24} bg="#e60023" />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{username || 'user'}</span>
        </div>
      </div>
    </div>
  );
}


/* ─── Manual (generic) ─── */
function ManualPreview({ content }: Omit<PlatformPreviewProps, 'platform'>) {
  return (
    <div style={{ background: '#1a1a2e', color: '#e0e0e0', fontFamily: 'monospace', borderRadius: 12, padding: 16, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Manual Post Preview</div>
      <div style={{ fontSize: 14, lineHeight: '20px', maxHeight: 280, overflowY: 'auto' }}>
        <PostContent text={content} />
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export function PlatformPreview({ platform, content, mediaUrls, username, displayName }: PlatformPreviewProps) {
  const props = { content, mediaUrls, username, displayName };

  const previewMap: Record<Platform, React.ReactNode> = {
    x: <XPreview {...props} />,
    linkedin: <LinkedInPreview {...props} />,
    threads: <ThreadsPreview {...props} />,
    instagram: <InstagramPreview {...props} />,
    bluesky: <BlueskyPreview {...props} />,
    facebook: <FacebookPreview {...props} />,
    youtube: <YouTubePreview {...props} />,
    pinterest: <PinterestPreview {...props} />,
    mastodon: <ManualPreview {...props} />,
    slack: <ManualPreview {...props} />,
    twitch: <ManualPreview {...props} />,
    telegram: <ManualPreview {...props} />,
    discord: <ManualPreview {...props} />,
    dribbble: <ManualPreview {...props} />,
    skool: <ManualPreview {...props} />,
    whop: <ManualPreview {...props} />,
    kick: <ManualPreview {...props} />,
    vk: <ManualPreview {...props} />,
    warpcast: <ManualPreview {...props} />,
    manual: <ManualPreview {...props} />,
  };

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', maxHeight: 450, overflowY: 'auto' }}>
      {previewMap[platform] || <ManualPreview {...props} />}
    </div>
  );
}
