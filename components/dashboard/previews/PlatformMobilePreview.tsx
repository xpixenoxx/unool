'use client';

import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Repeat2,
  Share,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Send,
  Eye,
  Zap,
  Play,
  ArrowUp,
  ArrowDown,
  ArrowBigUp,
  ArrowBigDown,
  Check,
  CheckCircle2,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  Radio,
  Camera,
  Pin,
  Rocket,
  PartyPopper,
  Users,
  Flame,
  BadgeCheck,
  BarChart2,
} from 'lucide-react';
import { PlatformBrandLogo } from '@/components/dashboard/PlatformLogos';

export type SupportedPlatformType =
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'pinterest'
  | 'bluesky'
  | 'mastodon'
  | 'slack'
  | 'twitch'
  | 'telegram'
  | 'discord'
  | 'dribbble'
  | 'skool'
  | 'whop'
  | 'kick'
  | 'warpcast'
  | 'mewe'
  | 'nostr'
  | 'medium'
  | 'lemmy'
  | 'listmonk'
  | 'reddit'
  | 'hashnode'
  | 'devto'
  | 'whatsapp'
  | 'twitter';

export interface MobilePreviewProps {
  platform: SupportedPlatformType;
  content: string;
  isEmpty: boolean;
  media: { url: string; type: 'image' | 'video' | 'document'; alt?: string }[];
  profileName: string;
  profileHeadline?: string;
  initials: string;
  avatarUrl?: string;
}

/** Check if platform uses dark background theme */
export function isPlatformDark(platform: SupportedPlatformType): boolean {
  return [
    'x',
    'threads',
    'youtube',
    'bluesky',
    'mastodon',
    'discord',
    'slack',
    'reddit',
    'twitch',
    'kick',
    'warpcast',
    'nostr',
    'skool',
    'whop',
    'lemmy',
  ].includes(platform);
}

/** Get background color for the screen area */
export function getPlatformBgColor(platform: SupportedPlatformType): string {
  switch (platform) {
    case 'x': return '#000000';
    case 'threads': return '#101010';
    case 'youtube': return '#0F0F0F';
    case 'bluesky': return '#16202A';
    case 'mastodon': return '#191B22';
    case 'discord': return '#313338';
    case 'slack': return '#1A1D21';
    case 'reddit': return '#0E1113';
    case 'twitch': return '#0E0E10';
    case 'kick': return '#0B0E0F';
    case 'warpcast': return '#141416';
    case 'nostr': return '#111116';
    case 'skool': return '#1F2023';
    case 'whop': return '#121212';
    case 'lemmy': return '#1B1E21';
    case 'linkedin': return '#F3F2EF';
    case 'facebook': return '#F0F2F5';
    case 'telegram': return '#0E1621';
    case 'devto': return '#F5F5F5';
    case 'listmonk': return '#F8FAFC';
    case 'mewe': return '#F2F4F7';
    case 'dribbble':
    case 'pinterest':
    case 'medium':
    case 'hashnode':
    case 'instagram':
    default:
      return '#FFFFFF';
  }
}

/** Helper Avatar component */
function AvatarCircle({
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
function ExpandableText({
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
function MediaArea({
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

export { PlatformBrandLogo };

/* ─────────────────────────────────────────────────────────────
   1. LinkedIn
   ───────────────────────────────────────────────────────────── */
function LinkedInMobile({ content, isEmpty, media, profileName, profileHeadline, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const toggleRepost = () => {
    setReposted(!reposted);
    setRepostCount(c => reposted ? c - 1 : c + 1);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-[#EBEBEB]">
        <PlatformBrandLogo platform="linkedin" size={24} />
        <div className="flex-1 px-3">
          <div className="w-full h-7 bg-[#EEF3F8] rounded-md flex items-center px-2.5 gap-2 text-xs text-[#666]">
            <Search className="w-3.5 h-3.5 text-[#666]" />
            <span>Search</span>
          </div>
        </div>
        <div className="text-[#666] p-1">
          <MessageSquare className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white my-2 border-y border-[#EBEBEB]">
        <div className="flex items-start gap-2.5 px-4 pt-3 pb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={44} bg="#0A66C2" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-black leading-tight truncate">{profileName || 'Your Name'}</p>
              <span className="text-[10px] text-[#666] font-medium px-1 bg-[#F3F2EF] rounded">1st</span>
            </div>
            <p className="text-xs text-[#666] leading-tight truncate mt-0.5">{profileHeadline || 'Professional'}</p>
            <p className="text-[11px] text-[#666] flex items-center gap-1 mt-0.5">
              <span>Just now ·</span>
              <Globe className="w-3 h-3 text-[#666]" />
            </p>
          </div>
          <button type="button" onClick={() => setBookmarked(!bookmarked)} className="text-[#666] hover:text-[#0A66C2] p-1 transition-colors">
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#0A66C2] text-[#0A66C2]' : ''}`} />
          </button>
        </div>

        <div className="px-4 pb-2">
          <ExpandableText content={content} maxLength={160} isEmpty={isEmpty} color="#000" highlightColor="#666" />
        </div>

        <MediaArea media={media} />

        <div className="px-4 py-2 flex items-center justify-between text-xs text-[#666] border-b border-[#EBEBEB]">
          <span className="flex items-center gap-1.5">
            <span className="flex -space-x-1 items-center">
              <span className="w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center text-white ring-1 ring-white">
                <ThumbsUp className="w-2.5 h-2.5 fill-white" />
              </span>
              <span className="w-4 h-4 rounded-full bg-[#DF704D] flex items-center justify-center text-white ring-1 ring-white">
                <Heart className="w-2.5 h-2.5 fill-white" />
              </span>
            </span>
            <span className="font-medium text-[#666] text-[11px]">{likeCount}</span>
          </span>
          <span className="text-[11px]">3 comments · {repostCount} repost{repostCount !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center justify-around py-1 text-xs text-[#666]">
          <button
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 font-medium rounded-md transition-all active:scale-95 cursor-pointer ${
              liked ? 'text-[#0A66C2] font-semibold bg-[#E8F3FF]' : 'hover:bg-[#F3F2EF]'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-[#0A66C2]' : ''}`} />
            <span>Like</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-2.5 font-medium rounded-md hover:bg-[#F3F2EF] transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>
          <button
            type="button"
            onClick={toggleRepost}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 font-medium rounded-md transition-all active:scale-95 cursor-pointer ${
              reposted ? 'text-[#057642] font-semibold bg-[#EBF5EE]' : 'hover:bg-[#F3F2EF]'
            }`}
          >
            <Repeat2 className="w-3.5 h-3.5" />
            <span>Repost</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-2.5 font-medium rounded-md hover:bg-[#F3F2EF] transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. X (Twitter)
   ───────────────────────────────────────────────────────────── */
function XMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(180);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(34);
  const [bookmarked, setBookmarked] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > 280;

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const toggleRepost = () => {
    setReposted(!reposted);
    setRepostCount(c => reposted ? c - 1 : c + 1);
  };

  return (
    <div style={{ background: '#000', color: '#E7E9EA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2F3336]">
        <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={28} bg="#6366F1" />
        <PlatformBrandLogo platform="x" size={20} variant="glyph" className="text-white" />
        <div className="w-7 flex justify-end">
          <Sparkles className="w-4 h-4 text-[#71767B]" />
        </div>
      </div>

      <div className="flex border-b border-[#2F3336] text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('foryou')}
          className={`flex-1 text-center py-2.5 font-bold relative transition-colors cursor-pointer ${activeTab === 'foryou' ? 'text-white' : 'text-[#71767B]'}`}
        >
          For you
          {activeTab === 'foryou' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1D9BF0] rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={`flex-1 text-center py-2.5 font-medium relative transition-colors cursor-pointer ${activeTab === 'following' ? 'text-white' : 'text-[#71767B]'}`}
        >
          Following
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1D9BF0] rounded-full" />
          )}
        </button>
      </div>

      <div className="px-3.5 py-3 border-b border-[#2F3336]">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={38} bg="#6366F1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 overflow-hidden text-xs">
              <span className="font-bold text-white truncate">{profileName || 'Your Name'}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#1D9BF0] fill-[#1D9BF0] flex-shrink-0" />
              <span className="text-[#71767B] truncate">@{profileName?.toLowerCase().replace(/\s+/g, '') || 'username'}</span>
              <span className="text-[#71767B] flex-shrink-0">· 1m</span>
              <MoreHorizontal className="w-3.5 h-3.5 text-[#71767B] ml-auto" />
            </div>

            <p className="mt-1 text-sm text-[#E7E9EA] leading-snug whitespace-pre-wrap break-words" style={{ fontStyle: isEmpty ? 'italic' : 'normal', color: isEmpty ? '#71767B' : '#E7E9EA' }}>
              {content || 'Start typing to see your post come alive...'}
            </p>

            {isOverLimit && (
              <p className="text-xs text-[#F4212E] mt-1 font-medium">{charCount}/280 · {charCount - 280} over limit</p>
            )}

            <MediaArea media={media} />

            <div className="flex items-center justify-between mt-3 text-xs text-[#71767B] select-none">
              <button type="button" className="flex items-center gap-1.5 hover:text-[#1D9BF0] transition-colors cursor-pointer">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>12</span>
              </button>
              <button
                type="button"
                onClick={toggleRepost}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${reposted ? 'text-[#00BA7C]' : 'hover:text-[#00BA7C]'}`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{repostCount}</span>
              </button>
              <button
                type="button"
                onClick={toggleLike}
                className={`flex items-center gap-1.5 transition-all active:scale-125 cursor-pointer ${liked ? 'text-[#F91880]' : 'hover:text-[#F91880]'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#F91880]' : ''}`} />
                <span>{likeCount}</span>
              </button>
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>2.4K</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBookmarked(!bookmarked)}
                  className={`transition-colors cursor-pointer ${bookmarked ? 'text-[#1D9BF0]' : 'hover:text-[#1D9BF0]'}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#1D9BF0]' : ''}`} />
                </button>
                <button type="button" className="hover:text-[#1D9BF0] transition-colors cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. Threads
   ───────────────────────────────────────────────────────────── */
function ThreadsMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(86);
  const [reposted, setReposted] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <div style={{ background: '#101010', color: '#F3F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-center py-2.5 border-b border-[#262626]">
        <PlatformBrandLogo platform="threads" size={22} variant="glyph" className="text-white" />
      </div>

      <div className="px-3.5 py-3 border-b border-[#262626]">
        <div className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#333" />
            <div className="w-0.5 flex-1 bg-[#262626] rounded-full my-2 min-h-[30px]" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-white">{profileName?.toLowerCase().replace(/\s+/g, '') || 'username'}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6]" />
              <span className="text-[#777] ml-auto">1m</span>
              <MoreHorizontal className="w-3.5 h-3.5 text-[#777] ml-1.5" />
            </div>

            <p className="mt-1 text-sm leading-snug whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#777' : '#F3F5F7', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'Start a thread...'}
            </p>

            <MediaArea media={media} />

            <div className="flex items-center gap-4 mt-3 text-sm text-[#F3F5F7]">
              <button
                type="button"
                onClick={toggleLike}
                className={`flex items-center gap-1 transition-all active:scale-125 cursor-pointer ${liked ? 'text-[#FF3040]' : 'hover:text-[#FF3040]'}`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-[#FF3040]' : ''}`} />
                <span className="text-xs text-[#777]">{likeCount}</span>
              </button>
              <button type="button" className="hover:text-white cursor-pointer">
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setReposted(!reposted)}
                className={`cursor-pointer transition-colors ${reposted ? 'text-[#00BA7C]' : 'hover:text-[#00BA7C]'}`}
              >
                <Repeat2 className="w-4 h-4" />
              </button>
              <button type="button" className="hover:text-white cursor-pointer">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. Instagram
   ───────────────────────────────────────────────────────────── */
function InstagramMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [bookmarked, setBookmarked] = useState(false);

  const hasImage = media.some(m => m.type === 'image');
  const imageUrl = hasImage ? media.find(m => m.type === 'image')!.url : null;

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <div style={{ background: '#FFFFFF', color: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#EFEFEF]">
        <div className="flex items-center gap-2">
          <PlatformBrandLogo platform="instagram" size={22} />
          <span className="font-bold text-lg tracking-tight font-serif">Instagram</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="text-black p-0.5 hover:opacity-70 transition-opacity">
            <Heart className="w-5 h-5 text-black" />
          </button>
          <button type="button" className="text-black p-0.5 hover:opacity-70 transition-opacity">
            <Send className="w-5 h-5 text-black -rotate-12" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="rounded-full p-0.5" style={{ background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)' }}>
          <div className="rounded-full p-0.5 bg-white">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={28} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold leading-tight">{profileName?.toLowerCase().replace(/\s+/g, '') || 'username'}</span>
          <span className="text-[10px] text-[#737373] leading-tight">Original audio</span>
        </div>
        <MoreHorizontal className="w-4 h-4 ml-auto text-black" />
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-amber-500/10 flex flex-col items-center justify-center text-[#999] text-xs gap-1.5">
          <Camera className="w-8 h-8 text-[#999]" />
          <span>Add image or reel for Instagram</span>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={toggleLike}
              className={`transition-all active:scale-125 cursor-pointer ${liked ? 'text-[#ED4956]' : 'text-black'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-[#ED4956] text-[#ED4956]' : ''}`} />
            </button>
            <button type="button" className="text-black cursor-pointer hover:opacity-70">
              <MessageCircle className="w-5 h-5 -rotate-90 scale-x-[-1]" />
            </button>
            <button type="button" className="text-black cursor-pointer hover:opacity-70">
              <Send className="w-5 h-5 -rotate-12" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBookmarked(!bookmarked)}
            className="text-black cursor-pointer hover:opacity-70"
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-black' : ''}`} />
          </button>
        </div>

        <p className="text-xs font-semibold mb-1">
          Liked by <span className="font-bold">alex_design</span> and <span className="font-bold">{likeCount} others</span>
        </p>

        <p className="text-xs leading-relaxed">
          <span className="font-semibold mr-1.5">{profileName?.toLowerCase().replace(/\s+/g, '') || 'username'}</span>
          <span style={{ color: isEmpty ? '#999' : '#000', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {content || 'Start typing your caption...'}
          </span>
        </p>

        <p className="text-[11px] text-[#737373] mt-1 cursor-pointer">View all 24 comments</p>
        <p className="text-[10px] text-[#999] uppercase mt-1">12 minutes ago</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. Facebook
   ───────────────────────────────────────────────────────────── */
function FacebookMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(38);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <div style={{ background: '#F0F2F5', color: '#050505', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2 bg-white border-b border-[#E4E6E9]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="facebook" size={22} />
          <span className="text-[#1877F2] font-black text-xl tracking-tight">facebook</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#050505]">
          <div className="w-8 h-8 rounded-full bg-[#E4E6EB] flex items-center justify-center">
            <Search className="w-4 h-4 text-[#050505]" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#E4E6EB] flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-[#050505]" />
          </div>
        </div>
      </div>

      <div className="bg-white my-2 shadow-sm">
        <div className="flex items-center gap-2.5 p-3 pb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={38} bg="#1877F2" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold flex items-center gap-1">
              <span>{profileName || 'Your Name'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1877F2] fill-[#1877F2]" />
            </p>
            <p className="text-[11px] text-[#65676B] flex items-center gap-1 mt-0.5">
              <span>Just now ·</span>
              <Globe className="w-3 h-3 text-[#65676B]" />
            </p>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[#65676B]" />
        </div>

        <div className="px-3 pb-2">
          <ExpandableText content={content} maxLength={150} isEmpty={isEmpty} color="#050505" highlightColor="#050505" />
        </div>

        <MediaArea media={media} />

        <div className="px-3 py-1.5 flex items-center justify-between text-xs text-[#65676B] border-b border-[#CED0D4]">
          <span className="flex items-center gap-1.5">
            <span className="flex -space-x-1 items-center">
              <span className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center text-white ring-1 ring-white">
                <ThumbsUp className="w-2.5 h-2.5 fill-white" />
              </span>
              <span className="w-4 h-4 rounded-full bg-[#FA383E] flex items-center justify-center text-white ring-1 ring-white">
                <Heart className="w-2.5 h-2.5 fill-white" />
              </span>
            </span>
            <span>{likeCount}</span>
          </span>
          <span>6 comments · 2 shares</span>
        </div>

        <div className="flex items-center justify-around py-1 text-xs text-[#65676B] font-semibold">
          <button
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors cursor-pointer ${liked ? 'text-[#1877F2]' : 'hover:bg-[#F2F2F2]'}`}
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-[#1877F2]' : ''}`} />
            <span>Like</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 py-1.5 px-3 rounded-md hover:bg-[#F2F2F2] cursor-pointer">
            <MessageSquare className="w-4 h-4" />
            <span>Comment</span>
          </button>
          <button type="button" className="flex items-center gap-1.5 py-1.5 px-3 rounded-md hover:bg-[#F2F2F2] cursor-pointer">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. YouTube
   ───────────────────────────────────────────────────────────── */
function YouTubeMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const imageUrl = media.find(m => m.type === 'image' || m.type === 'video')?.url;

  return (
    <div style={{ background: '#0F0F0F', color: '#F1F1F1', fontFamily: 'Roboto, -apple-system, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#272727]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="youtube" size={24} />
          <span className="font-bold text-sm tracking-tighter text-white">YouTube</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Radio className="w-4 h-4 text-white" />
          <Search className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2.5 mb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={34} bg="#FF0000" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">{profileName || 'Your Channel'}</p>
            <p className="text-[10px] text-[#AAAAAA]">Community post · Just now</p>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[#AAA]" />
        </div>

        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#777' : '#F1F1F1', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {content || 'Share an update with your channel subscribers...'}
        </p>

        {imageUrl ? (
          <div className="mt-2.5 relative rounded-lg overflow-hidden border border-[#272727]">
            <img src={imageUrl} alt="" className="w-full aspect-video object-cover" />
            <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-medium">4:18</div>
          </div>
        ) : (
          <div className="mt-2.5 rounded-lg border border-[#272727] aspect-video bg-[#181818] flex flex-col items-center justify-center text-[#777] text-xs gap-1.5">
            <Play className="w-7 h-7 text-white/70 fill-white/70" />
            <span>16:9 Video / Post Media</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-[#AAA] border-t border-[#272727] pt-2">
          <div className="flex items-center gap-1 bg-[#272727] rounded-full px-2 py-1">
            <button
              type="button"
              onClick={() => { setLiked(!liked); setDisliked(false); }}
              className={`flex items-center gap-1 pr-2 border-r border-white/20 cursor-pointer ${liked ? 'text-white' : ''}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-white' : ''}`} />
              <span className="text-[11px]">1.2K</span>
            </button>
            <button
              type="button"
              onClick={() => { setDisliked(!disliked); setLiked(false); }}
              className={`pl-1 cursor-pointer ${disliked ? 'text-white' : ''}`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${disliked ? 'fill-white' : ''}`} />
            </button>
          </div>
          <button type="button" className="flex items-center gap-1 bg-[#272727] rounded-full px-2.5 py-1 cursor-pointer text-[11px]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>48</span>
          </button>
          <button type="button" className="flex items-center gap-1 bg-[#272727] rounded-full px-2.5 py-1 cursor-pointer text-[11px]">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. Pinterest
   ───────────────────────────────────────────────────────────── */
function PinterestMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#FFFFFF', color: '#111111', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#EEE]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="pinterest" size={22} />
          <span className="text-xs font-semibold text-[#111]">Pinterest</span>
        </div>
        <button
          type="button"
          onClick={() => setSaved(!saved)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            saved ? 'bg-[#111] text-white' : 'bg-[#E60023] text-white'
          }`}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="p-3">
        <div className="rounded-2xl overflow-hidden shadow-sm border border-[#E0E0E0] bg-[#F7F7F7]">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full max-h-[260px] object-cover" />
          ) : (
            <div className="w-full h-[220px] bg-gradient-to-b from-[#E60023]/10 to-[#E60023]/20 flex flex-col items-center justify-center text-[#E60023] gap-1.5">
              <Pin className="w-8 h-8 text-[#E60023]" />
              <span className="text-xs font-semibold">2:3 Pin Image Recommended</span>
            </div>
          )}

          <div className="p-3 bg-white">
            <h3 className="font-bold text-sm text-[#111] line-clamp-2">
              {content.split('\n')[0] || (isEmpty ? 'Title of your pin...' : 'Pin Title')}
            </h3>
            {content.split('\n').length > 1 && (
              <p className="text-xs text-[#555] mt-1 line-clamp-2">
                {content.split('\n').slice(1).join(' ')}
              </p>
            )}

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={24} bg="#E60023" />
                <span className="text-xs font-semibold truncate max-w-[120px]">{profileName || 'Your Brand'}</span>
              </div>
              <button
                type="button"
                onClick={() => setFollowing(!following)}
                className={`text-xs font-bold transition-colors cursor-pointer ${
                  following ? 'text-[#777]' : 'text-[#E60023]'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. Bluesky
   ───────────────────────────────────────────────────────────── */
function BlueskyMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(24);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const toggleRepost = () => {
    setReposted(!reposted);
    setRepostCount(c => reposted ? c - 1 : c + 1);
  };

  return (
    <div style={{ background: '#16202A', color: '#FFFFFF', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2A3A4A]">
        <div className="flex items-center gap-2">
          <PlatformBrandLogo platform="bluesky" size={20} />
          <span className="font-bold text-sm text-white">Bluesky</span>
        </div>
        <Search className="w-4 h-4 text-[#7B8C9E]" />
      </div>

      <div className="p-3 border-b border-[#2A3A4A]">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#0085FF" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-white truncate">{profileName || 'Your Name'}</span>
              <span className="text-[#7B8C9E] truncate">@{profileName?.toLowerCase().replace(/\s+/g, '') || 'user'}.bsky.social</span>
            </div>

            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#7B8C9E' : '#FFFFFF', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'What is on your mind?'}
            </p>

            <MediaArea media={media} />

            <div className="flex items-center justify-between mt-3 text-xs text-[#7B8C9E]">
              <button type="button" className="flex items-center gap-1 hover:text-white cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>8</span>
              </button>
              <button
                type="button"
                onClick={toggleRepost}
                className={`flex items-center gap-1 cursor-pointer ${reposted ? 'text-[#0085FF]' : 'hover:text-[#0085FF]'}`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{repostCount}</span>
              </button>
              <button
                type="button"
                onClick={toggleLike}
                className={`flex items-center gap-1 cursor-pointer ${liked ? 'text-[#E0245E]' : 'hover:text-[#E0245E]'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#E0245E]' : ''}`} />
                <span>{likeCount}</span>
              </button>
              <MoreHorizontal className="w-3.5 h-3.5 text-[#7B8C9E]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. Mastodon
   ───────────────────────────────────────────────────────────── */
function MastodonMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [boosted, setBoosted] = useState(false);
  const [boostCount, setBoostCount] = useState(18);
  const [favorited, setFavorited] = useState(false);
  const [favCount, setFavCount] = useState(76);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div style={{ background: '#191B22', color: '#D9E1E8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#282C37]">
        <div className="flex items-center gap-2">
          <PlatformBrandLogo platform="mastodon" size={20} />
          <span className="font-bold text-sm text-white">mastodon</span>
        </div>
        <span className="text-[11px] text-[#9BAEC8]">@mastodon.social</span>
      </div>

      <div className="p-3 border-b border-[#282C37]">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#6364FF" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-white truncate">{profileName || 'Author'}</span>
              <span className="text-[#9BAEC8] truncate">@{profileName?.toLowerCase().replace(/\s+/g, '') || 'user'}</span>
              <span className="text-[#9BAEC8] text-[10px] flex items-center gap-0.5">
                <span>·</span>
                <Globe className="w-3 h-3 text-[#9BAEC8]" />
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#9BAEC8' : '#D9E1E8', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'Toot your thoughts across the fediverse...'}
            </p>

            <MediaArea media={media} />

            <div className="flex items-center justify-between mt-3 text-xs text-[#9BAEC8]">
              <button type="button" className="flex items-center gap-1 hover:text-white cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>4</span>
              </button>
              <button
                type="button"
                onClick={() => { setBoosted(!boosted); setBoostCount(c => boosted ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 cursor-pointer ${boosted ? 'text-[#6364FF]' : 'hover:text-[#6364FF]'}`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{boostCount}</span>
              </button>
              <button
                type="button"
                onClick={() => { setFavorited(!favorited); setFavCount(c => favorited ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 cursor-pointer ${favorited ? 'text-[#FFAC33]' : 'hover:text-[#FFAC33]'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-[#FFAC33]' : ''}`} />
                <span>{favCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setBookmarked(!bookmarked)}
                className={`cursor-pointer ${bookmarked ? 'text-[#6364FF]' : 'hover:text-white'}`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-[#6364FF]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   10. Dribbble
   ───────────────────────────────────────────────────────────── */
function DribbbleMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(342);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#FFFFFF', color: '#0D0C22', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="dribbble" size={20} />
          <span className="font-black text-base text-[#EA4C89] tracking-tight">Dribbble</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#EA4C89] bg-pink-50 px-2 py-0.5 rounded-full">PRO</span>
          <Search className="w-3.5 h-3.5 text-[#9E9EA7]" />
        </div>
      </div>

      <div className="p-3">
        <div className="rounded-xl overflow-hidden border border-[#E7E7E9] shadow-sm relative group bg-[#F8F8F8]">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full aspect-[4/3] object-cover" />
          ) : (
            <div className="w-full aspect-[4/3] bg-gradient-to-tr from-pink-50 via-purple-50 to-indigo-50 flex flex-col items-center justify-center text-[#EA4C89] p-4 text-center">
              <PlatformBrandLogo platform="dribbble" size={32} className="mb-1" />
              <span className="font-bold text-xs text-[#0D0C22]">4:3 Dribbble Shot</span>
              <span className="text-[10px] text-[#9E9EA7] mt-0.5">High-fidelity visual design preview</span>
            </div>
          )}

          <div className="p-2.5 bg-white flex items-center justify-between border-t border-[#F0F0F0]">
            <div className="flex items-center gap-2">
              <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={24} bg="#EA4C89" />
              <span className="text-xs font-bold text-[#0D0C22] truncate max-w-[130px]">{profileName || 'Designer'}</span>
              <span className="text-[9px] font-bold text-[#EA4C89] bg-pink-50 px-1.5 py-0.2 rounded">PRO</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#9E9EA7]">
              <button
                type="button"
                onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 font-medium cursor-pointer transition-colors ${liked ? 'text-[#EA4C89]' : ''}`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#EA4C89]' : ''}`} />
                <span>{likeCount}</span>
              </button>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>4.1k</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-xs font-bold text-[#0D0C22] line-clamp-1">
            {content.split('\n')[0] || (isEmpty ? 'Title of your shot...' : 'New Design Shot')}
          </h4>
          <p className="text-[11px] text-[#6E6D7A] mt-1 line-clamp-2 leading-relaxed" style={{ fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {content || 'A quick look at the latest design concept and exploration...'}
          </p>

          <div className="flex flex-wrap gap-1 mt-2">
            {['ui', 'design', 'web', 'branding'].map(tag => (
              <span key={tag} className="text-[9px] font-medium text-[#6E6D7A] bg-[#F3F3F4] px-1.5 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   11. Telegram
   ───────────────────────────────────────────────────────────── */
function TelegramMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [thumb, setThumb] = useState(42);
  const [fire, setFire] = useState(19);
  const [heart, setHeart] = useState(28);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#0E1621', color: '#F5F5F5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#17212B] border-b border-[#232E3C]">
        <PlatformBrandLogo platform="telegram" size={28} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{profileName || 'Telegram Channel'}</p>
          <p className="text-[10px] text-[#229ED9]">3,420 subscribers</p>
        </div>
        <Search className="w-4 h-4 text-[#6C7883]" />
      </div>

      <div className="p-3">
        <div className="bg-[#182533] rounded-2xl rounded-tl-sm p-3 max-w-[92%] border border-[#232E3C] shadow-sm">
          {imageUrl && (
            <div className="rounded-xl overflow-hidden mb-2">
              <img src={imageUrl} alt="" className="w-full max-h-[180px] object-cover" />
            </div>
          )}

          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#6C7883' : '#F5F5F5', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {content || 'Type your message to broadcast to your channel subscribers...'}
          </p>

          <div className="flex items-center justify-end gap-1.5 text-[10px] text-[#6C7883] mt-1.5">
            <span>11:20</span>
            <span className="flex text-[#229ED9] -space-x-1">
              <Check className="w-3 h-3" />
              <Check className="w-3 h-3" />
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              <span>842</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2 select-none">
          <button
            type="button"
            onClick={() => setThumb(c => c + 1)}
            className="text-[11px] bg-[#17212B] hover:bg-[#202E3D] border border-[#232E3C] px-2 py-0.5 rounded-full text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ThumbsUp className="w-3 h-3 text-[#229ED9]" />
            <span>{thumb}</span>
          </button>
          <button
            type="button"
            onClick={() => setFire(c => c + 1)}
            className="text-[11px] bg-[#17212B] hover:bg-[#202E3D] border border-[#232E3C] px-2 py-0.5 rounded-full text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{fire}</span>
          </button>
          <button
            type="button"
            onClick={() => setHeart(c => c + 1)}
            className="text-[11px] bg-[#17212B] hover:bg-[#202E3D] border border-[#232E3C] px-2 py-0.5 rounded-full text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>{heart}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   12. Discord
   ───────────────────────────────────────────────────────────── */
function DiscordMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [rocket, setRocket] = useState(14);
  const [party, setParty] = useState(22);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#313338', color: '#DBDEE1', fontFamily: 'gg sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#2B2D31] border-b border-[#1F2023]">
        <PlatformBrandLogo platform="discord" size={20} />
        <span className="text-xs font-bold text-white"># announcements</span>
        <div className="ml-auto text-xs text-gray-400">
          <Users className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="p-3">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#5865F2" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-white">{profileName || 'Community Bot'}</span>
              <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.2 rounded font-bold">APP</span>
              <span className="text-[10px] text-[#949BA4]">Today at 11:20 AM</span>
            </div>

            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#949BA4' : '#DBDEE1', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'Enter announcement message for server members...'}
            </p>

            {imageUrl && (
              <div className="mt-2.5 rounded-lg overflow-hidden border-l-4 border-[#5865F2] bg-[#2B2D31] p-1.5 max-w-[240px]">
                <img src={imageUrl} alt="" className="w-full rounded object-cover max-h-[160px]" />
              </div>
            )}

            <div className="flex items-center gap-1 mt-2.5">
              <button
                type="button"
                onClick={() => setRocket(c => c + 1)}
                className="bg-[#2B2D31] hover:bg-[#35373C] px-2 py-0.5 rounded text-[11px] text-[#DBDEE1] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Rocket className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px]">{rocket}</span>
              </button>
              <button
                type="button"
                onClick={() => setParty(c => c + 1)}
                className="bg-[#2B2D31] hover:bg-[#35373C] px-2 py-0.5 rounded text-[11px] text-[#DBDEE1] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PartyPopper className="w-3 h-3 text-amber-400" />
                <span className="text-[10px]">{party}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   13. Slack
   ───────────────────────────────────────────────────────────── */
function SlackMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [clap, setClap] = useState(12);
  const [rocket, setRocket] = useState(8);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#FFFFFF', color: '#1D1C1D', fontFamily: 'Lato, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#4A154B] text-white">
        <PlatformBrandLogo platform="slack" size={18} />
        <span className="font-bold text-xs"># announcements</span>
        <Search className="ml-auto w-3.5 h-3.5 text-white/80" />
      </div>

      <div className="p-3">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#4A154B" className="rounded-md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-[#1D1C1D]">{profileName || 'Workspace Post'}</span>
              <span className="text-[9px] bg-gray-200 text-gray-700 px-1 rounded font-bold">APP</span>
              <span className="text-[10px] text-[#616061]">11:20 AM</span>
            </div>

            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#616061' : '#1D1C1D', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'Post a message to your team channel...'}
            </p>

            {imageUrl && (
              <div className="mt-2 rounded border border-[#E2E8F0] overflow-hidden max-w-[220px]">
                <img src={imageUrl} alt="" className="w-full object-cover max-h-[140px]" />
              </div>
            )}

            <div className="flex items-center gap-1 mt-2">
              <button
                type="button"
                onClick={() => setClap(c => c + 1)}
                className="bg-[#F8F8F8] hover:bg-[#EEF2F6] border border-[#E2E8F0] px-2 py-0.5 rounded-full text-[10px] text-[#616061] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Award className="w-3 h-3 text-amber-500" />
                <span>{clap}</span>
              </button>
              <button
                type="button"
                onClick={() => setRocket(c => c + 1)}
                className="bg-[#F8F8F8] hover:bg-[#EEF2F6] border border-[#E2E8F0] px-2 py-0.5 rounded-full text-[10px] text-[#616061] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Rocket className="w-3 h-3 text-emerald-500" />
                <span>{rocket}</span>
              </button>
            </div>
            <p className="text-[10px] text-[#1264A3] mt-1.5 font-medium">3 replies · Last reply 4m ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   14. Reddit
   ───────────────────────────────────────────────────────────── */
function RedditMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(482);
  const [joined, setJoined] = useState(false);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  const handleUp = () => {
    if (vote === 'up') {
      setVote(null);
      setScore(s => s - 1);
    } else {
      setVote('up');
      setScore(s => vote === 'down' ? s + 2 : s + 1);
    }
  };

  const handleDown = () => {
    if (vote === 'down') {
      setVote(null);
      setScore(s => s + 1);
    } else {
      setVote('down');
      setScore(s => vote === 'up' ? s - 2 : s - 1);
    }
  };

  return (
    <div style={{ background: '#0E1113', color: '#D7DADC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1A1A1B] border-b border-[#343536]">
        <div className="flex items-center gap-2">
          <PlatformBrandLogo platform="reddit" size={22} />
          <span className="text-xs font-bold text-white">r/technology</span>
          <span className="text-[10px] text-[#818384]">· 2h</span>
        </div>
        <button
          type="button"
          onClick={() => setJoined(!joined)}
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
            joined ? 'bg-[#343536] text-[#D7DADC]' : 'bg-[#0079D3] text-white'
          }`}
        >
          {joined ? 'Joined' : 'Join'}
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm text-white mb-1.5">
          {content.split('\n')[0] || (isEmpty ? 'Title of your Reddit post...' : 'Post Title')}
        </h3>

        {content.split('\n').length > 1 && (
          <p className="text-xs text-[#D7DADC] leading-relaxed line-clamp-3">
            {content.split('\n').slice(1).join('\n')}
          </p>
        )}

        {imageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-[#343536]">
            <img src={imageUrl} alt="" className="w-full max-h-[180px] object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-[#818384]">
          <div className="flex items-center bg-[#1A1A1B] rounded-full px-2 py-1 gap-1.5">
            <button
              type="button"
              onClick={handleUp}
              className={`cursor-pointer transition-colors ${vote === 'up' ? 'text-[#FF4500]' : 'hover:text-[#FF4500]'}`}
            >
              <ArrowBigUp className={`w-4 h-4 ${vote === 'up' ? 'fill-[#FF4500]' : ''}`} />
            </button>
            <span className={`font-bold text-[11px] ${vote === 'up' ? 'text-[#FF4500]' : vote === 'down' ? 'text-[#7193FF]' : 'text-white'}`}>
              {score}
            </span>
            <button
              type="button"
              onClick={handleDown}
              className={`cursor-pointer transition-colors ${vote === 'down' ? 'text-[#7193FF]' : 'hover:text-[#7193FF]'}`}
            >
              <ArrowBigDown className={`w-4 h-4 ${vote === 'down' ? 'fill-[#7193FF]' : ''}`} />
            </button>
          </div>
          <button type="button" className="bg-[#1A1A1B] hover:bg-[#272729] rounded-full px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer text-[#818384]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>64</span>
          </button>
          <button type="button" className="bg-[#1A1A1B] hover:bg-[#272729] rounded-full px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer text-[#818384]">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   15. Twitch
   ───────────────────────────────────────────────────────────── */
function TwitchMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#0E0E10', color: '#EFEFF1', fontFamily: 'Roobert, -apple-system, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#18181B] border-b border-[#26262C]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="twitch" size={20} />
          <span className="font-bold text-sm text-[#9146FF]">Twitch</span>
        </div>
        <span className="text-[10px] bg-[#9146FF] text-white px-2 py-0.5 rounded font-bold">LIVE</span>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-0.5 rounded-full border border-[#9146FF]">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={30} bg="#9146FF" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{profileName || 'Streamer'}</p>
            <p className="text-[10px] text-[#ADADB8]">Creator Broadcast</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#ADADB8' : '#EFEFF1', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {content || 'Stream announcement or channel update...'}
        </p>

        {imageUrl && (
          <div className="mt-2.5 rounded-lg overflow-hidden border border-[#9146FF]/30">
            <img src={imageUrl} alt="" className="w-full max-h-[160px] object-cover" />
          </div>
        )}

        <div className="mt-3 bg-[#18181B] p-2 rounded-lg flex items-center justify-between text-xs text-[#ADADB8]">
          <span className="flex items-center gap-1 text-[11px]">
            <Heart className="w-3.5 h-3.5 text-[#9146FF] fill-[#9146FF]" />
            <span>240 watching</span>
          </span>
          <button type="button" className="text-[#9146FF] font-bold hover:underline cursor-pointer">
            Watch Stream
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   16. Kick
   ───────────────────────────────────────────────────────────── */
function KickMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(128);

  const imageUrl = media.find(m => m.type === 'image')?.url;

  return (
    <div style={{ background: '#0B0E0F', color: '#FFFFFF', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#131719] border-b border-[#21272A]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="kick" size={18} />
          <span className="font-black text-sm text-[#53FC18] tracking-wider">KICK</span>
        </div>
        <span className="text-[10px] font-bold text-black bg-[#53FC18] px-2 py-0.5 rounded">STREAM</span>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={32} bg="#53FC18" className="text-black" />
          <div>
            <p className="text-xs font-bold text-white">{profileName || 'Kick Creator'}</p>
            <p className="text-[10px] text-[#53FC18]">Verified Creator</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#7A8B94' : '#FFFFFF', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {content || 'Kick community update...'}
        </p>

        {imageUrl && (
          <div className="mt-2.5 rounded-lg overflow-hidden border border-[#53FC18]/30">
            <img src={imageUrl} alt="" className="w-full max-h-[160px] object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3.5 mt-3 text-xs text-[#7A8B94]">
          <button
            type="button"
            onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${liked ? 'text-[#53FC18]' : ''}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#53FC18]' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <button type="button" className="flex items-center gap-1 hover:text-white cursor-pointer">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>24</span>
          </button>
          <button type="button" className="hover:text-white cursor-pointer">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   17. Medium
   ───────────────────────────────────────────────────────────── */
function MediumMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [claps, setClaps] = useState(340);
  const [bookmarked, setBookmarked] = useState(false);

  const imageUrl = media.find(m => m.type === 'image')?.url;
  const lines = content.trim().split('\n');
  const title = lines[0] || (isEmpty ? 'Title of your story...' : 'Story Title');
  const excerpt = lines.slice(1).join(' ') || (isEmpty ? 'Write your story narrative...' : 'Story narrative...');

  return (
    <div style={{ background: '#FFFFFF', color: '#242424', fontFamily: 'Georgia, Cambria, serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#F2F2F2] font-sans">
        <div className="flex items-center gap-2">
          <PlatformBrandLogo platform="medium" size={22} className="text-black" />
          <span className="font-serif font-black text-lg">Medium</span>
        </div>
        <span className="text-xs text-[#6B6B6B]">Open App</span>
      </div>

      <div className="p-3.5">
        <div className="flex items-center gap-2 font-sans mb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={24} bg="#000" />
          <span className="text-xs font-semibold text-[#242424]">{profileName || 'Writer'}</span>
          <span className="text-[10px] text-[#6B6B6B]">· 4 min read</span>
        </div>

        <h2 className="font-bold text-base text-[#242424] leading-snug mb-1">
          {title}
        </h2>

        <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-3">
          {excerpt}
        </p>

        {imageUrl && (
          <div className="mt-2.5 rounded-lg overflow-hidden">
            <img src={imageUrl} alt="" className="w-full max-h-[160px] object-cover" />
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F2F2F2] text-xs font-sans text-[#6B6B6B]">
          <button
            type="button"
            onClick={() => setClaps(c => c + 1)}
            className="flex items-center gap-1 hover:text-black cursor-pointer active:scale-110 transition-transform"
          >
            <Award className="w-3.5 h-3.5 text-[#242424]" />
            <span>{claps}</span>
          </button>
          <button type="button" className="flex items-center gap-1 hover:text-black cursor-pointer">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>19</span>
          </button>
          <button
            type="button"
            onClick={() => setBookmarked(!bookmarked)}
            className={`cursor-pointer hover:text-black ${bookmarked ? 'text-black' : ''}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-black' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   18. DEV.to
   ───────────────────────────────────────────────────────────── */
function DevtoMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [reactions, setReactions] = useState(48);
  const [reacted, setReacted] = useState(false);

  const imageUrl = media.find(m => m.type === 'image')?.url;
  const lines = content.trim().split('\n');
  const title = lines[0] || (isEmpty ? 'DEV article title...' : 'DEV Article');

  return (
    <div style={{ background: '#F5F5F5', color: '#171717', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="devto" size={26} className="text-black" />
          <span className="text-xs font-bold">DEV Community</span>
        </div>
        <span className="text-[10px] bg-[#EEF0F6] text-[#3B49DF] font-bold px-2 py-0.5 rounded">dev.to</span>
      </div>

      <div className="p-3">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-sm">
          {imageUrl && (
            <div className="rounded-lg overflow-hidden mb-2.5 -mx-3 -mt-3">
              <img src={imageUrl} alt="" className="w-full max-h-[140px] object-cover" />
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={28} bg="#090909" />
            <div>
              <p className="text-xs font-bold">{profileName || 'DEV Developer'}</p>
              <p className="text-[10px] text-[#717171]">Today · 3 min read</p>
            </div>
          </div>

          <h3 className="font-extrabold text-sm text-[#090909] leading-snug mb-1.5">
            {title}
          </h3>

          <div className="flex flex-wrap gap-1 mb-2">
            {['webdev', 'programming', 'beginners'].map(t => (
              <span key={t} className="text-[10px] text-[#525252]">#{t}</span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[#525252] pt-2 border-t border-[#F3F4F6]">
            <button
              type="button"
              onClick={() => { setReacted(!reacted); setReactions(c => reacted ? c - 1 : c + 1); }}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${reacted ? 'text-rose-600 font-semibold' : ''}`}
            >
              <Heart className={`w-3.5 h-3.5 text-rose-500 ${reacted ? 'fill-rose-500' : ''}`} />
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{reactions}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>12 comments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   19. Hashnode
   ───────────────────────────────────────────────────────────── */
function HashnodeMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [reactions, setReactions] = useState(46);
  const [reacted, setReacted] = useState(false);

  const imageUrl = media.find(m => m.type === 'image')?.url;
  const lines = content.trim().split('\n');
  const title = lines[0] || (isEmpty ? 'Hashnode blog post title...' : 'Blog Article');

  return (
    <div style={{ background: '#FFFFFF', color: '#0F172A', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="hashnode" size={20} />
          <span className="text-xs font-bold text-[#2962FF]">hashnode</span>
        </div>
        <span className="text-[10px] bg-blue-50 text-[#2962FF] font-medium px-2 py-0.5 rounded-full">blog</span>
      </div>

      <div className="p-3">
        {imageUrl && (
          <div className="rounded-xl overflow-hidden mb-2.5 border border-[#E2E8F0]">
            <img src={imageUrl} alt="" className="w-full max-h-[140px] object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={26} bg="#2962FF" />
          <span className="text-xs font-semibold">{profileName || 'Author'}</span>
          <span className="text-[10px] text-[#64748B]">· 4 min</span>
        </div>

        <h3 className="font-extrabold text-sm text-[#0F172A] leading-snug mb-1">
          {title}
        </h3>

        <div className="flex items-center justify-between text-xs text-[#64748B] mt-3 pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={() => { setReacted(!reacted); setReactions(c => reacted ? c - 1 : c + 1); }}
            className={`flex items-center gap-1 cursor-pointer ${reacted ? 'text-[#2962FF] font-semibold' : ''}`}
          >
            <Heart className={`w-3.5 h-3.5 text-[#2962FF] ${reacted ? 'fill-[#2962FF]' : ''}`} />
            <span>{reactions} reactions</span>
          </button>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   20. Listmonk (Email Newsletter)
   ───────────────────────────────────────────────────────────── */
function ListmonkMobile({ content, isEmpty, media, profileName, initials }: MobilePreviewProps) {
  const imageUrl = media.find(m => m.type === 'image')?.url;
  const lines = content.trim().split('\n');
  const subject = lines[0]?.replace(/^#+\s*/, '') || (isEmpty ? 'Newsletter Subject Line...' : 'Newsletter Campaign');
  const body = lines.slice(1).join('\n') || (isEmpty ? 'Email newsletter body copy...' : 'Newsletter body...');

  return (
    <div style={{ background: '#F8FAFC', color: '#1E293B', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="px-3.5 py-2 bg-white border-b border-[#E2E8F0] flex items-center justify-between text-xs text-[#0045FF]">
        <span className="font-medium">‹ Inbox</span>
        <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
          <PlatformBrandLogo platform="listmonk" size={16} />
          <span>Newsletter</span>
        </div>
        <span className="text-[10px] text-[#64748B]">11:20 AM</span>
      </div>

      <div className="p-3">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-sm">
          <div className="border-b border-[#F1F5F9] pb-2 mb-2">
            <span className="text-[9px] bg-blue-50 text-[#0045FF] px-1.5 py-0.2 rounded font-bold uppercase">Listmonk</span>
            <h2 className="font-bold text-sm text-[#0F172A] mt-1 leading-snug">{subject}</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">From: {profileName || 'Newsletter Team'} &lt;mail@domain.com&gt;</p>
          </div>

          {imageUrl && (
            <div className="rounded-lg overflow-hidden mb-2.5">
              <img src={imageUrl} alt="" className="w-full max-h-[140px] object-cover" />
            </div>
          )}

          <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap break-words">
            {body}
          </p>

          <div className="mt-3 pt-2 border-t border-[#F1F5F9] text-center text-[10px] text-[#94A3B8]">
            <span>Unsubscribe · Powered by Listmonk</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   21. Farcaster
   ───────────────────────────────────────────────────────────── */
function WarpcastMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(84);
  const [recasted, setRecasted] = useState(false);
  const [recastCount, setRecastCount] = useState(26);

  return (
    <div style={{ background: '#141416', color: '#FFFFFF', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1C1C1E] border-b border-[#2C2C2E]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="warpcast" size={20} />
          <span className="font-bold text-sm text-[#8A63D2]">Farcaster</span>
        </div>
        <span className="text-[10px] bg-[#8A63D2]/20 text-[#8A63D2] px-2 py-0.5 rounded font-bold">Farcaster</span>
      </div>

      <div className="p-3 border-b border-[#2C2C2E]">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#8A63D2" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-white">{profileName || 'Caster'}</span>
              <span className="text-[#8A63D2] text-[10px]">@{profileName?.toLowerCase().replace(/\s+/g, '') || 'user'}.eth</span>
            </div>

            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#7A7A85' : '#FFFFFF', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'Cast to the Farcaster network...'}
            </p>

            <MediaArea media={media} />

            <div className="flex items-center justify-between mt-3 text-xs text-[#7A7A85]">
              <button type="button" className="flex items-center gap-1 hover:text-white cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>12</span>
              </button>
              <button
                type="button"
                onClick={() => { setRecasted(!recasted); setRecastCount(c => recasted ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 cursor-pointer ${recasted ? 'text-[#00BA7C]' : 'hover:text-[#00BA7C]'}`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{recastCount}</span>
              </button>
              <button
                type="button"
                onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 cursor-pointer ${liked ? 'text-[#8A63D2]' : 'hover:text-[#8A63D2]'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#8A63D2]' : ''}`} />
                <span>{likeCount}</span>
              </button>
              <button type="button" className="flex items-center gap-1 hover:text-[#8A63D2] cursor-pointer">
                <Zap className="w-3.5 h-3.5 text-[#8A63D2]" />
                <span>Tip</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   22. Nostr
   ───────────────────────────────────────────────────────────── */
function NostrMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(52);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(14);
  const [zaps, setZaps] = useState(1000);

  return (
    <div style={{ background: '#111116', color: '#EDEDED', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#191922] border-b border-[#262635]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="nostr" size={20} />
          <span className="font-bold text-sm text-[#9B51E0]">nostr</span>
        </div>
        <span className="text-[10px] text-[#FFB000] font-bold">Lightning Ready</span>
      </div>

      <div className="p-3">
        <div className="flex gap-2.5">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={36} bg="#9B51E0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-white">{profileName || 'Nostr Key'}</span>
              <span className="text-[#888899] text-[10px] font-mono">npub1...3z8k</span>
            </div>

            <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#888899' : '#EDEDED', fontStyle: isEmpty ? 'italic' : 'normal' }}>
              {content || 'Publish decentralized note to relays...'}
            </p>

            <MediaArea media={media} />

            <div className="flex items-center justify-between mt-3 text-xs text-[#888899]">
              <button type="button" className="flex items-center gap-1 hover:text-white cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>6</span>
              </button>
              <button
                type="button"
                onClick={() => { setReposted(!reposted); setRepostCount(c => reposted ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 cursor-pointer ${reposted ? 'text-[#9B51E0]' : 'hover:text-[#9B51E0]'}`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{repostCount}</span>
              </button>
              <button
                type="button"
                onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}
                className={`flex items-center gap-1 cursor-pointer ${liked ? 'text-[#E0245E]' : 'hover:text-[#E0245E]'}`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#E0245E]' : ''}`} />
                <span>{likeCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setZaps(z => z + 21)}
                className="flex items-center gap-1 text-[#FFB000] font-bold hover:brightness-125 cursor-pointer active:scale-110 transition-transform"
              >
                <Zap className="w-3.5 h-3.5 fill-[#FFB000]" />
                <span>Zap {zaps}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   23. Skool
   ───────────────────────────────────────────────────────────── */
function SkoolMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(32);

  return (
    <div style={{ background: '#1F2023', color: '#F0F0F0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#2B2C30] border-b border-[#38393E]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="skool" size={20} />
          <span className="font-bold text-sm text-[#E2AD44]">Skool</span>
        </div>
        <span className="text-[10px] bg-[#E2AD44]/20 text-[#E2AD44] font-bold px-2 py-0.5 rounded">Community</span>
      </div>

      <div className="p-3">
        <div className="bg-[#2B2C30] rounded-xl p-3 border border-[#38393E]">
          <div className="flex items-center gap-2 mb-2">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={30} bg="#E2AD44" />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1">
                {profileName || 'Community Member'}
                <span className="text-[9px] bg-[#E2AD44] text-black font-extrabold px-1 rounded">Lv 4</span>
              </p>
              <p className="text-[10px] text-[#A0A0A5]">General Discussion</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#A0A0A5' : '#F0F0F0', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {content || 'Start a discussion in your Skool group...'}
          </p>

          <MediaArea media={media} />

          <div className="flex items-center justify-between mt-3 text-xs text-[#A0A0A5] pt-2 border-t border-[#38393E]">
            <button
              type="button"
              onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}
              className={`flex items-center gap-1 cursor-pointer ${liked ? 'text-[#E2AD44] font-semibold' : 'hover:text-white'}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-[#E2AD44]' : ''}`} />
              <span>{likeCount} likes</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>16 comments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   24. Whop
   ───────────────────────────────────────────────────────────── */
function WhopMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  return (
    <div style={{ background: '#121212', color: '#FFFFFF', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1E1E1E] border-b border-[#2D2D2D]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="whop" size={20} />
          <span className="font-black text-sm text-[#FF5A00]">whop</span>
        </div>
        <span className="text-[10px] bg-[#FF5A00] text-white px-2 py-0.5 rounded font-bold">STORE UPDATE</span>
      </div>

      <div className="p-3">
        <div className="bg-[#1E1E1E] rounded-xl p-3 border border-[#2D2D2D]">
          <div className="flex items-center gap-2 mb-2">
            <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={30} bg="#FF5A00" />
            <div>
              <p className="text-xs font-bold text-white">{profileName || 'Company Admin'}</p>
              <p className="text-[10px] text-[#FF5A00]">Product Announcement</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#888' : '#FFFFFF', fontStyle: isEmpty ? 'italic' : 'normal' }}>
            {content || 'Broadcast update to your Whop customers...'}
          </p>

          <MediaArea media={media} />

          <button type="button" className="w-full mt-3 bg-[#FF5A00] hover:bg-[#FF6A15] text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <span>View in Whop</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────
   26. MeWe
   ───────────────────────────────────────────────────────────── */
function MeweMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(28);

  return (
    <div style={{ background: '#F2F4F7', color: '#2F435E', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-[#E1E5EB]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="mewe" size={20} />
          <span className="font-black text-sm text-[#2F435E]">MeWe</span>
        </div>
        <span className="text-[10px] text-[#6E8299]">Privacy-First Feed</span>
      </div>

      <div className="bg-white my-2 p-3 border-y border-[#E1E5EB]">
        <div className="flex items-center gap-2 mb-2">
          <AvatarCircle initials={initials} avatarUrl={avatarUrl} size={32} bg="#2F435E" />
          <div>
            <p className="text-xs font-bold text-[#2F435E]">{profileName || 'Member'}</p>
            <p className="text-[10px] text-[#6E8299]">Public Post</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ color: isEmpty ? '#6E8299' : '#2F435E', fontStyle: isEmpty ? 'italic' : 'normal' }}>
          {content || 'MeWe social post preview...'}
        </p>

        <MediaArea media={media} />

        <div className="flex items-center gap-3.5 mt-3 text-xs text-[#6E8299] pt-2 border-t border-[#F0F2F5]">
          <button
            type="button"
            onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}
            className={`flex items-center gap-1 cursor-pointer ${liked ? 'text-[#2F435E] font-semibold' : ''}`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-[#2F435E]' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>7</span>
          </div>
          <button type="button" className="flex items-center gap-1 hover:text-[#2F435E] cursor-pointer">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   27. Lemmy
   ───────────────────────────────────────────────────────────── */
function LemmyMobile({ content, isEmpty, media, profileName, initials, avatarUrl }: MobilePreviewProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [score, setScore] = useState(42);

  return (
    <div style={{ background: '#1B1E21', color: '#E0E0E0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#252A2E] border-b border-[#31373D]">
        <div className="flex items-center gap-1.5">
          <PlatformBrandLogo platform="lemmy" size={20} />
          <span className="font-bold text-sm text-[#00BC8C]">Lemmy</span>
        </div>
        <span className="text-[10px] text-[#8C98A4]">c/tech@lemmy.world</span>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-xs text-white mb-1">
          {content.split('\n')[0] || (isEmpty ? 'Title for Lemmy community post...' : 'Community Post')}
        </h3>

        {content.split('\n').length > 1 && (
          <p className="text-xs text-[#ADB5BD] leading-relaxed line-clamp-3">
            {content.split('\n').slice(1).join(' ')}
          </p>
        )}

        <MediaArea media={media} />

        <div className="flex items-center gap-3 mt-3 text-xs text-[#00BC8C]">
          <button
            type="button"
            onClick={() => { setUpvoted(!upvoted); setScore(s => upvoted ? s - 1 : s + 1); }}
            className={`flex items-center gap-1 cursor-pointer ${upvoted ? 'font-bold' : ''}`}
          >
            <ArrowBigUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-[#00BC8C]' : ''}`} />
            <span>{score}</span>
          </button>
          <div className="flex items-center gap-1 text-[#ADB5BD]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>18</span>
          </div>
          <span className="text-[#8C98A4] text-[10px] ml-auto">@{profileName || 'user'}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Export: PlatformMobilePreview
   ───────────────────────────────────────────────────────────── */
export function PlatformMobilePreview(props: MobilePreviewProps) {
  switch (props.platform) {
    case 'linkedin':
      return <LinkedInMobile {...props} />;
    case 'x':
      return <XMobile {...props} />;
    case 'threads':
      return <ThreadsMobile {...props} />;
    case 'instagram':
      return <InstagramMobile {...props} />;
    case 'facebook':
      return <FacebookMobile {...props} />;
    case 'youtube':
      return <YouTubeMobile {...props} />;
    case 'pinterest':
      return <PinterestMobile {...props} />;
    case 'bluesky':
      return <BlueskyMobile {...props} />;
    case 'mastodon':
      return <MastodonMobile {...props} />;
    case 'dribbble':
      return <DribbbleMobile {...props} />;
    case 'telegram':
      return <TelegramMobile {...props} />;
    case 'discord':
      return <DiscordMobile {...props} />;
    case 'slack':
      return <SlackMobile {...props} />;
    case 'reddit':
      return <RedditMobile {...props} />;
    case 'twitch':
      return <TwitchMobile {...props} />;
    case 'kick':
      return <KickMobile {...props} />;
    case 'medium':
      return <MediumMobile {...props} />;
    case 'devto':
      return <DevtoMobile {...props} />;
    case 'hashnode':
      return <HashnodeMobile {...props} />;
    case 'listmonk':
      return <ListmonkMobile {...props} />;
    case 'warpcast':
      return <WarpcastMobile {...props} />;
    case 'nostr':
      return <NostrMobile {...props} />;
    case 'skool':
      return <SkoolMobile {...props} />;
    case 'whop':
      return <WhopMobile {...props} />;
    case 'mewe':
      return <MeweMobile {...props} />;
    case 'lemmy':
      return <LemmyMobile {...props} />;
    default:
      return <LinkedInMobile {...props} />;
  }
}
