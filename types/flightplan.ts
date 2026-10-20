/**
 * Flight Plan Type Definitions
 * Complete type system for the weekly content scheduling engine
 */

import type React from 'react';
import type { SupportedPlatform } from '@/lib/platforms';

declare module 'react' {
  interface CSSProperties {
    focusRingColor?: string;
    focusRingOffsetColor?: string;
    '--accent'?: string;
    '--gap'?: string;
    '--status-color'?: string;
    '--padding'?: string;
    '--font-size'?: string;
  }
}

declare module 'framer-motion' {
  interface MotionStyle {
    focusRingColor?: string;
    focusRingOffsetColor?: string;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PLATFORM CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════════ */

export interface PlatformConfig {
  icon: React.ElementType;
  name: string;
  maxChars: number;
  color: string;
}

export interface PlatformMeta {
  name: string;
  color: string;
  bg: string;
  icon: string;
}

export type PlatformType = SupportedPlatform;

export const PLATFORM_CONFIG: Record<PlatformType, PlatformConfig> = {
  linkedin: { icon: {} as React.ElementType, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: {} as React.ElementType, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800' },
  threads: { icon: {} as React.ElementType, name: 'Threads', maxChars: 500, color: 'bg-black' },
  facebook: { icon: {} as React.ElementType, name: 'Facebook', maxChars: 63206, color: 'bg-blue-600' },
  instagram: { icon: {} as React.ElementType, name: 'Instagram', maxChars: 2200, color: 'bg-pink-600' },
  youtube: { icon: {} as React.ElementType, name: 'YouTube', maxChars: 5000, color: 'bg-red-600' },
  pinterest: { icon: {} as React.ElementType, name: 'Pinterest', maxChars: 500, color: 'bg-red-600' },
  bluesky: { icon: {} as React.ElementType, name: 'Bluesky', maxChars: 300, color: 'bg-blue-400' },
  mastodon: { icon: {} as React.ElementType, name: 'Mastodon', maxChars: 500, color: 'bg-purple-600' },
  slack: { icon: {} as React.ElementType, name: 'Slack', maxChars: 40000, color: 'bg-[#4A154B]' },
  twitch: { icon: {} as React.ElementType, name: 'Twitch', maxChars: 500, color: 'bg-[#9146FF]' },
  telegram: { icon: {} as React.ElementType, name: 'Telegram', maxChars: 4096, color: 'bg-[#229ED9]' },
  discord: { icon: {} as React.ElementType, name: 'Discord', maxChars: 2000, color: 'bg-[#5865F2]' },
  skool: { icon: {} as React.ElementType, name: 'Skool', maxChars: 10000, color: 'bg-[#E2AD44]' },
  whop: { icon: {} as React.ElementType, name: 'Whop', maxChars: 10000, color: 'bg-[#FF5A00]' },
  kick: { icon: {} as React.ElementType, name: 'Kick', maxChars: 10000, color: 'bg-[#53FC18]' },
  warpcast: { icon: {} as React.ElementType, name: 'Farcaster', maxChars: 320, color: 'bg-[#8A63D2]' },
  mewe: { icon: {} as React.ElementType, name: 'MeWe', maxChars: 4000, color: 'bg-[#2F435E]' },
  nostr: { icon: {} as React.ElementType, name: 'Nostr', maxChars: 65535, color: 'bg-[#9B51E0]' },
  dribbble: { icon: {} as React.ElementType, name: 'Dribbble', maxChars: 250, color: 'bg-[#EA4C89]' },
  medium: { icon: {} as React.ElementType, name: 'Medium', maxChars: 100000, color: 'bg-black' },
  lemmy: { icon: {} as React.ElementType, name: 'Lemmy', maxChars: 10000, color: 'bg-[#00BC8C]' },
  listmonk: { icon: {} as React.ElementType, name: 'Listmonk', maxChars: 100000, color: 'bg-[#0045ff]' },
  hashnode: { icon: {} as React.ElementType, name: 'Hashnode', maxChars: 100000, color: 'bg-[#2962FF]' },
  devto: { icon: {} as React.ElementType, name: 'DEV.to', maxChars: 100000, color: 'bg-neutral-900' },
  reddit: { icon: {} as React.ElementType, name: 'Reddit', maxChars: 40000, color: 'bg-[#FF4500]' },
  manual: { icon: {} as React.ElementType, name: 'Manual', maxChars: 5000, color: 'bg-zinc-600' },
};

export const PLATFORM_META: Record<string, PlatformMeta> = {
  linkedin: { name: 'LinkedIn', color: '#0A66C2', bg: '#E8F0FA', icon: 'in' },
  x: { name: 'X', color: '#000000', bg: '#F0F0F0', icon: '𝕏' },
  twitter: { name: 'X', color: '#000000', bg: '#F0F0F0', icon: '𝕏' },
  threads: { name: 'Threads', color: '#1A1A1A', bg: '#F0F0F0', icon: '@' },
  bluesky: { name: 'Bluesky', color: '#0085FF', bg: '#E6F3FF', icon: 'bsky' },
  instagram: { name: 'Instagram', color: '#E1306C', bg: '#FDE8F0', icon: 'ig' },
  facebook: { name: 'Facebook', color: '#1877F2', bg: '#E8F0FE', icon: 'f' },
  pinterest: { name: 'Pinterest', color: '#E60023', bg: '#FDE8E8', icon: 'p' },
  youtube: { name: 'YouTube', color: '#FF0000', bg: '#FDE8E8', icon: 'yt' },
  reddit: { name: 'Reddit', color: '#FF4500', bg: '#FFEBE5', icon: 'r/' },
  mastodon: { name: 'Mastodon', color: '#6364FF', bg: '#F0F0FF', icon: 'm' },
  discord: { name: 'Discord', color: '#5865F2', bg: '#EEF0FD', icon: 'dc' },
  slack: { name: 'Slack', color: '#4A154B', bg: '#F5ECF5', icon: 'sl' },
  telegram: { name: 'Telegram', color: '#229ED9', bg: '#E9F5FA', icon: 'tg' },
  twitch: { name: 'Twitch', color: '#9146FF', bg: '#F3ECFF', icon: 'tw' },
  kick: { name: 'Kick', color: '#53FC18', bg: '#EBFDE7', icon: 'k' },
  whop: { name: 'Whop', color: '#FF5A00', bg: '#FFF0E6', icon: 'w' },
  dribbble: { name: 'Dribbble', color: '#EA4C89', bg: '#FDEDF3', icon: 'dr' },
  skool: { name: 'Skool', color: '#E2AD44', bg: '#FDF7EB', icon: 'sk' },
  warpcast: { name: 'Farcaster', color: '#8A63D2', bg: '#F4EFFB', icon: 'fc' },
  farcaster: { name: 'Farcaster', color: '#8A63D2', bg: '#F4EFFB', icon: 'fc' },
  mewe: { name: 'MeWe', color: '#2F435E', bg: '#EDEFF2', icon: 'mw' },
  nostr: { name: 'Nostr', color: '#9B51E0', bg: '#F4EEFB', icon: 'nos' },
  medium: { name: 'Medium', color: '#000000', bg: '#F0F0F0', icon: 'med' },
  devto: { name: 'DEV.to', color: '#0A0A0A', bg: '#F0F0F0', icon: 'dev' },
  hashnode: { name: 'Hashnode', color: '#2962FF', bg: '#ECF2FE', icon: 'hn' },
  whatsapp: { name: 'WhatsApp', color: '#25D366', bg: '#E7F9EE', icon: 'wa' },
  lemmy: { name: 'Lemmy', color: '#00BC8C', bg: '#E6F7EF', icon: 'lem' },
  listmonk: { name: 'Listmonk', color: '#0045ff', bg: '#E8EBFF', icon: 'lm' },
  manual: { name: 'Manual', color: '#71717A', bg: '#27272A', icon: 'mn' },
};

export interface PlatformDraft {
  platform: PlatformType;
  content: string;
  characterCount: number;
  hashtags: string[];
  firstCommentHint?: string | null;
  autoFirstComment?: string | null;
  schedulingOffsetMinutes?: number;
  enabled?: boolean;
  variantId?: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   STORY INTAKE TYPES
   ════════════════════════════════════════════════════════════════════════════ */

export interface StoryIntakeData {
  coreStory: string;
  whatChanged: string;
  whatWentWrong: string;
  oneRealNumber: string;
  weekStartDate: string;
  selectedPlatforms: PlatformType[];
  audienceTimezone?: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  placeholder: string;
  required: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
   WEEK ARC (GENERATED PLAN)
   ════════════════════════════════════════════════════════════════════════════ */

export interface ArcPost {
  day: number;                    // 0 = Monday, 6 = Sunday
  dayLabel: string;               // "Mon", "Tue", etc.
  arcBeat: string;                // "Hook", "Value", "Proof", etc.
  arcBeatReason: string;          // Why this beat on this day
  scheduledHour: number;          // 0-23
  scheduledMinute: number;        // 0-59
  platforms: ArcPlatformDraft[];
  imageUrl?: string | null;       // Legacy single image (backwards compat)
  imageUrls?: string[];           // Up to 10 images
  deleted?: boolean;
}

export interface ArcPlatformDraft extends PlatformDraft {
  // Inherits all PlatformDraft fields
}

export interface WeekArc {
  arcTitle: string;
  storyType: string;
  storyTypeReason: string;
  weekPosts: ArcPost[];
}

export type ViewMode = 'story' | 'review' | 'canvas';

/* ════════════════════════════════════════════════════════════════════════════
   WEEK CANVAS TYPES (SCHEDULED POSTS)
   ════════════════════════════════════════════════════════════════════════════ */

export interface CanvasPlatformVariant {
  variantId: string;
  platform: PlatformType;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt: string | null;
  autoFirstComment: string | null;
  firstCommentHint?: string | null;
  mediaUrls: Array<{ url: string; type?: string }>;
  hashtags: string[];
  error?: string | null;
  schedulingOffsetMinutes?: number;
}

export interface CanvasPost {
  postId: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt: string | null;
  scheduleStrategy: string;
  arcId: string | null;
  platforms: CanvasPlatformVariant[];
}

export interface WeekCanvasState {
  posts: CanvasPost[];
  isLoading: boolean;
  weekOffset: number;             // 0 = current week, 1 = next week
  holdActive: boolean;
  selectedPost: CanvasPost | null;
}

/* ════════════════════════════════════════════════════════════════════════════
   API REQUEST/RESPONSE TYPES
   ════════════════════════════════════════════════════════════════════════════ */

export interface GenerateArcRequest {
  coreStory: string;
  whatChanged: string;
  whatWentWrong: string;
  oneRealNumber: string;
  weekStartDate: string;
  audienceTimezone: string;
  selectedPlatforms: PlatformType[];
}

export interface GenerateArcResponse {
  arc: WeekArc;
  isPreviewOnly: boolean;
  idempotencyKey?: string;
}

export interface ScheduleFlightPlanRequest {
  arcTitle: string;
  coreStory: string;
  storyType: string;
  weekStartDate: string;
  userTimezone: string;
  scheduleMode: 'arc';
  posts: SchedulePostRequest[];
  idempotencyKey: string;
}

export interface SchedulePostRequest {
  day: number;
  scheduledHour: number;
  scheduledMinute: number;
  strategy: 'cascading' | 'simultaneous';
  arcBeat: string;
  imageUrl: string | null;
  imageUrls: string[];
  platforms: SchedulePlatformRequest[];
}

export interface SchedulePlatformRequest {
  platform: PlatformType;
  content: string;
  hashtags: string[];
  firstCommentHint: string | null;
  autoFirstComment: string | null;
  schedulingOffsetMinutes: number;
  mediaUrls: Array<{ url: string; type: string }>;
}

export interface ScheduleFlightPlanResponse {
  scheduled: Array<{
    postId: string;
    variantIds: string[];
    scheduledAt: string;
  }>;
  arcId: string;
}

export interface UpdateVariantRequest {
  content: string;
  hashtags: string[];
  mediaUrls: Array<{ url: string; type: string }>;
}

export interface UpdateVariantResponse {
  success: boolean;
  variant: CanvasPlatformVariant;
}

export interface ReschedulePostRequest {
  newScheduledAt: string;  // ISO 8601
}

export interface ReschedulePostResponse {
  success: boolean;
  post: CanvasPost;
}

/* ════════════════════════════════════════════════════════════════════════════
   EDITOR STATE TYPES
   ════════════════════════════════════════════════════════════════════════════ */

export interface PostEditorState {
  expandedPost: number | -1;
  activePlatformTab: Record<number, number>;
  isDraggingPost: Record<number, boolean>;
  isUploadingImage: Record<number, boolean>;
  fileInputRefs: Record<number, HTMLInputElement | null>;
}

export interface ModalEditorState {
  activeVariantIndex: number;
  editedContent: Record<string, string>;
  editedHashtags: Record<string, string[]>;
  editedMediaUrls: Record<string, Array<{ url: string; type?: string }>>;
  newTag: string;
  isSaving: boolean;
  isRescheduling: boolean;
  rescheduleTime: string;
  isCancelling: boolean;
  showRescheduleInput: boolean;
  isUploadingMedia: boolean;
  confirmCancel: boolean;
  isModalDragging: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
   HOOK RETURN TYPES
   ════════════════════════════════════════════════════════════════════════════ */

export interface UseImageUploadResult {
  upload: (files: FileList | File[], postIdx: number) => Promise<void>;
  remove: (postIdx: number, imageIdx: number) => void;
  isUploading: Record<number, boolean>;
  isDragging: Record<number, boolean>;
  setIsDragging: (postIdx: number, dragging: boolean) => void;
  registerFileInput?: (postIdx: number, el: HTMLInputElement | null) => void;
}

export interface UseTimeSelectorResult {
  hour: number;
  minute: number;
  setHour: (h: number) => void;
  setMinute: (m: number) => void;
  quickPresets: Array<{ label: string; minutes: number; icon?: React.ReactNode; isPrimary?: boolean }>;
  applyQuickPreset: (minutes: number) => void;
  isPastTime: boolean;
  minuteOptions: number[];
}

export interface UseTimezoneResult {
  timezone: string;
  setTimezone: (tz: string) => void;
  offset: string;              // e.g., "-07:00"
  label: string;               // e.g., "Pacific Time (PT)"
  allTimezones: Array<{ value: string; label: string; offset: string }>;
}

export interface UseFlightPlanDraftResult {
  draft: StoryIntakeData | null;
  saveDraft: (data: Partial<StoryIntakeData>) => void;
  clearDraft: () => void;
  hasDraft: boolean;
  lastSaved: number | null;
}

export interface UseFlightPlanActionsResult {
  generate: (data: StoryIntakeData) => Promise<WeekArc | null>;
  approve: (arc: WeekArc, storyData: StoryIntakeData) => Promise<boolean>;
  loadCanvas: (weekOffset: number) => Promise<CanvasPost[]>;
  updateVariant: (variantId: string, data: UpdateVariantRequest) => Promise<CanvasPlatformVariant | null>;
  reschedulePost: (postId: string, newDate: Date) => Promise<CanvasPost | null>;
  cancelPost: (postId: string) => Promise<boolean>;
  holdQueue: (hold: boolean, hours?: number) => Promise<boolean>;
}

/* ════════════════════════════════════════════════════════════════════════════
   UI PRIMITIVE PROP TYPES
   ════════════════════════════════════════════════════════════════════════════ */

export interface ContentValidationBannerProps {
  isBlocked: boolean;
  isOverLimit: boolean;
  violationMessage?: string;
  platformName?: string;
  currentCount?: number;
  maxChars?: number;
  onKnowMore?: () => void;
}

export interface PlatformTabsProps {
  platforms: PlatformDraft[];
  activeIndex: number;
  onChange: (index: number) => void;
  enabledMap?: Record<number, boolean>;
  onToggleEnabled?: (index: number) => void;
  compact?: boolean;
}

export interface TimeSelectorProps {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  isPastTime?: boolean;
  quickPresets?: Array<{ label: string; minutes: number; icon?: React.ReactNode; isPrimary?: boolean }>;
  onQuickPreset?: (minutes: number) => void;
  disabled?: boolean;
}

export interface HashtagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  maxTags?: number;
  inputRef?: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>;
}

export interface AutoFirstCommentProps {
  content: string;
  label?: string;
}

export interface ImageDropZoneProps {
  images: string[];
  onUpload: (files: FileList | File[]) => Promise<void>;
  onRemove: (index: number) => void;
  maxImages?: number;
  isUploading?: boolean;
  isDragging?: boolean;
  setIsDragging?: (dragging: boolean) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>;
  compact?: boolean;
}

/* ════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════════════════ */

export const FLIGHTPLAN_CONSTANTS = {
  MAX_IMAGES_PER_POST: 10,
  MAX_HASHTAGS_PER_PLATFORM: 30,
  DEFAULT_HOLD_HOURS: 3,
  MAX_WEEK_OFFSET: 1,
  STAGGER_OFFSETS: [0, 15, 30, 45, 60] as const,
  COMPACT_THRESHOLD: 4,
  ULTRA_COMPACT_THRESHOLD: 6,
  GENERATION_TIMEOUT_MS: 60000,
  AUTO_SAVE_DEBOUNCE_MS: 1000,
  DRAFT_STORAGE_KEY: 'unool_flightplan_draft_v1',
  IDEMPOTENCY_KEY_PREFIX: 'flightplan_',
} as const;

export type StaggerOffset = typeof FLIGHTPLAN_CONSTANTS.STAGGER_OFFSETS[number];

/* ════════════════════════════════════════════════════════════════════════════
   EDGE CASE DEFENSE TYPES
   ════════════════════════════════════════════════════════════════════════════ */

export interface EdgeCaseDefense {
  id: string;
  name: string;
  description: string;
  implemented: boolean;
  testCase: string;
}

export const EDGE_CASES: EdgeCaseDefense[] = [
  {
    id: 'EC-01',
    name: 'Generation Timeout Protection',
    description: 'AbortController with 60s timeout for arc generation',
    implemented: true,
    testCase: 'Simulate 70s API delay - should show timeout toast, not hang',
  },
  {
    id: 'EC-02',
    name: 'Idempotent Scheduling',
    description: 'Client-generated idempotency key prevents double-scheduling on retry',
    implemented: true,
    testCase: 'Click "Schedule All" twice rapidly - only one arc created',
  },
  {
    id: 'EC-03',
    name: 'ContentGuard XSS Prevention',
    description: 'All user content validated through ContentGuard before render/save',
    implemented: true,
    testCase: 'Paste <script>alert(1)</script> - should be blocked with violation message',
  },
  {
    id: 'EC-04',
    name: 'Draft Auto-Persistence',
    description: 'localStorage autosave every 1s with versioned key, restores on reload',
    implemented: true,
    testCase: 'Type story, close tab, reopen - draft restored with all fields',
  },
  {
    id: 'EC-05',
    name: 'Image Upload Validation',
    description: 'File type (image/*), size (≤10MB), count (≤10) enforced client + server',
    implemented: true,
    testCase: 'Upload 15MB video - rejected with clear error message',
  },
  {
    id: 'EC-06',
    name: 'Timezone-Aware Scheduling',
    description: 'IANA timezone selector + validation; no UTC drift; DST handled',
    implemented: true,
    testCase: 'Schedule for 2:30 AM during DST transition - correct local time stored',
  },
  {
    id: 'EC-07',
    name: 'Platform Media Caps Enforcement',
    description: 'Per-platform image/video limits enforced in UI and API (IG=10, X=4, etc.)',
    implemented: true,
    testCase: 'Select 10 images for X post - UI caps at 4 with explanation',
  },
  {
    id: 'EC-08',
    name: 'Past-Time Prevention',
    description: 'Hour/minute selectors disable past slots; quick presets skip past times',
    implemented: true,
    testCase: 'At 3:45 PM, try to schedule for 3:30 PM - option disabled',
  },
  {
    id: 'EC-09',
    name: 'Queue Hold/Release Atomicity',
    description: 'Hold API uses POST/DELETE with 3h default; race-condition safe',
    implemented: true,
    testCase: 'Hold queue, immediately release - no posts skipped incorrectly',
  },
  {
    id: 'EC-10',
    name: 'Responsive Breakpoint Integrity',
    description: '3 breakpoints (≤640, 641-1024, ≥1025) tested; no horizontal overflow',
    implemented: true,
    testCase: 'Resize browser to 375px - all controls accessible, no CLS',
  },
];