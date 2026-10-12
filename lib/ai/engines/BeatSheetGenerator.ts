// ─── BeatSheetGenerator (ported from ig-reel/beats.py + SKILL.md) ────────────
//
// Calculates a spoken-word timing beat sheet for video/audio content.
// Ported from beats.py (165 wpm baseline) and extended per-platform:
//
//  Platform      WPM   Hook window   Beat max   Format
//  ──────────────────────────────────────────────────────
//  instagram     165   3s            4s         Reel (15-90s)
//  youtube       150   30s           120s        Long-form
//  twitch/kick   160   15s           300s        Livestream title + segments
//  tiktok        170   2s            3s         (not in UNOOL, future)
//  podcast       145   60s           600s        (listmonk/medium companion)
//
// The generator flags:
//  - Hook that runs longer than its platform window
//  - Any single static beat that exceeds max beat duration (where viewer leaves)
//  - No loop closure (the last line must echo the first)
//  - Runs of lines with no concrete entity

import { PlatformType } from '@/lib/ai/PostAdapter';

// ─── Per-platform video timing specs ──────────────────────────────────────────

export interface PlatformVideoSpec {
  wpm: number;             // words per minute for this platform/audience
  hookWindowSecs: number;  // hook must land within this many seconds
  maxBeatSecs: number;     // any single beat longer than this is a red flag
  minTotalSecs: number;    // recommended minimum video/content length
  maxTotalSecs: number;    // recommended maximum
  formatLabel: string;
}

export const PLATFORM_VIDEO_SPECS: Partial<Record<PlatformType, PlatformVideoSpec>> = {
  instagram: { wpm: 165, hookWindowSecs: 3,  maxBeatSecs: 4,   minTotalSecs: 15,  maxTotalSecs: 90,   formatLabel: 'Reel (15-90s)' },
  youtube:   { wpm: 150, hookWindowSecs: 30, maxBeatSecs: 120, minTotalSecs: 120, maxTotalSecs: 1200, formatLabel: 'YouTube video' },
  twitch:    { wpm: 160, hookWindowSecs: 15, maxBeatSecs: 300, minTotalSecs: 60,  maxTotalSecs: 14400, formatLabel: 'Twitch stream segment' },
  kick:      { wpm: 160, hookWindowSecs: 15, maxBeatSecs: 300, minTotalSecs: 60,  maxTotalSecs: 14400, formatLabel: 'Kick stream segment' },
  // For text/newsletter platforms — treat as spoken script companion
  medium:    { wpm: 145, hookWindowSecs: 60, maxBeatSecs: 600, minTotalSecs: 120, maxTotalSecs: 1800, formatLabel: 'Long-form companion' },
  listmonk:  { wpm: 145, hookWindowSecs: 60, maxBeatSecs: 600, minTotalSecs: 60,  maxTotalSecs: 900,  formatLabel: 'Newsletter script' },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Beat {
  index: number;
  text: string;
  wordCount: number;
  estimatedSecs: number;
  cumulativeSecs: number;
  timecode: string;           // "0:03.2"
  role: 'HOOK' | 'MID' | 'CTA' | 'TRANSITION';
  flags: BeatFlag[];
}

export interface BeatFlag {
  type: 'TOO_LONG' | 'NO_CONCRETE' | 'HOOK_OVERRUN' | 'LOOP_MISSING';
  message: string;
}

export interface BeatSheetResult {
  platform: PlatformType;
  spec: PlatformVideoSpec;
  totalWords: number;
  estimatedSecs: number;
  targetSecs: number;
  deltaToTarget: number;     // positive = over, negative = under
  beats: Beat[];
  flags: string[];
  loopDetected: boolean;     // does last beat echo the first?
  hookScore: number;         // 0-100 based on whether hook lands in window
}

// ─── Generator ─────────────────────────────────────────────────────────────────

export class BeatSheetGenerator {
  /**
   * Generate a beat sheet from a script string.
   * Splits on sentence boundaries (. ! ?) and calculates timecodes.
   *
   * @param script    Full script text (all lines the creator will speak)
   * @param platform  Target platform for timing calibration
   * @param targetSecs Desired total duration (defaults to platform midpoint)
   */
  static generate(
    script: string,
    platform: PlatformType = 'instagram',
    targetSecs?: number,
  ): BeatSheetResult {
    const spec = PLATFORM_VIDEO_SPECS[platform] ?? PLATFORM_VIDEO_SPECS['instagram']!;
    const target = targetSecs ?? Math.round((spec.minTotalSecs + spec.maxTotalSecs) / 2);
    const flags: string[] = [];

    // Split into sentences (beats)
    const rawBeats = script
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (rawBeats.length === 0) {
      return BeatSheetGenerator.empty(platform, spec, target);
    }

    // Calculate timing per beat
    let cumulativeSecs = 0;
    const beats: Beat[] = rawBeats.map((text, i) => {
      const wordCount = text.split(/\s+/).length;
      const estimatedSecs = parseFloat(((wordCount / spec.wpm) * 60).toFixed(1));
      const startSecs = cumulativeSecs;
      cumulativeSecs += estimatedSecs;

      const role: Beat['role'] =
        i === 0 ? 'HOOK' :
        i === rawBeats.length - 1 ? 'CTA' :
        text.toLowerCase().match(/^(here'?s|so|and|but|also|now|next)/) ? 'TRANSITION' :
        'MID';

      const beatFlags: BeatFlag[] = [];

      // Flag: hook runs over platform window
      if (i === 0 && estimatedSecs > spec.hookWindowSecs) {
        beatFlags.push({
          type: 'HOOK_OVERRUN',
          message: `Hook runs ${estimatedSecs}s but ${platform} hook window is ${spec.hookWindowSecs}s. Split or shorten.`,
        });
      }

      // Flag: beat too long (static frame → viewer leaves)
      if (estimatedSecs > spec.maxBeatSecs && i > 0) {
        beatFlags.push({
          type: 'TOO_LONG',
          message: `Beat ${i + 1} runs ${estimatedSecs}s. On ${platform}, max is ~${spec.maxBeatSecs}s per beat without a visual cut.`,
        });
      }

      // Flag: no concrete entity in beat
      const concretePattern = /\d|[$€£%]|\b(client|user|company|product|revenue|code|api|feature|team|founder|week|month|day)\b/i;
      if (!concretePattern.test(text) && wordCount > 8) {
        beatFlags.push({
          type: 'NO_CONCRETE',
          message: `Beat ${i + 1} has no numbers or concrete nouns — abstract beats lose viewers.`,
        });
      }

      return {
        index: i + 1,
        text,
        wordCount,
        estimatedSecs,
        cumulativeSecs: parseFloat(cumulativeSecs.toFixed(1)),
        timecode: BeatSheetGenerator.toTimecode(startSecs),
        role,
        flags: beatFlags,
      };
    });

    const totalSecs = parseFloat(cumulativeSecs.toFixed(1));
    const totalWords = rawBeats.join(' ').split(/\s+/).length;
    const deltaToTarget = parseFloat((totalSecs - target).toFixed(1));

    // Loop detection — last beat echoes first beat's core word
    const firstWords = (rawBeats[0] ?? '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const lastBeat = (rawBeats[rawBeats.length - 1] ?? '').toLowerCase();
    const loopDetected = firstWords.some(w => lastBeat.includes(w));

    // Global flags
    if (!loopDetected && platform === 'instagram') {
      flags.push('No loop closure detected. The last beat should echo a word from the hook for replay value.');
    }
    if (Math.abs(deltaToTarget) > target * 0.2) {
      flags.push(
        deltaToTarget > 0
          ? `Script runs ~${Math.abs(deltaToTarget)}s over target. Cut ${Math.round(Math.abs(deltaToTarget) * spec.wpm / 60)} words.`
          : `Script runs ~${Math.abs(deltaToTarget)}s under target. Add ${Math.round(Math.abs(deltaToTarget) * spec.wpm / 60)} words or shoot it short.`
      );
    }

    // Hook score
    const hookBeat = beats[0];
    let hookScore = 100;
    if (hookBeat) {
      if (hookBeat.estimatedSecs > spec.hookWindowSecs) hookScore -= 40;
      hookBeat.flags.forEach(() => { hookScore -= 15; });
    }
    hookScore = Math.max(0, hookScore);

    return {
      platform,
      spec,
      totalWords,
      estimatedSecs: totalSecs,
      targetSecs: target,
      deltaToTarget,
      beats,
      flags,
      loopDetected,
      hookScore,
    };
  }

  private static toTimecode(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    return `${m}:${parseFloat(s) < 10 ? '0' : ''}${s}`;
  }

  private static empty(platform: PlatformType, spec: PlatformVideoSpec, target: number): BeatSheetResult {
    return { platform, spec, totalWords: 0, estimatedSecs: 0, targetSecs: target, deltaToTarget: -target, beats: [], flags: ['No script content provided.'], loopDetected: false, hookScore: 0 };
  }

  /**
   * Quick estimate: how long will this script take to say?
   */
  static estimateDuration(script: string, platform: PlatformType = 'instagram'): number {
    const spec = PLATFORM_VIDEO_SPECS[platform] ?? PLATFORM_VIDEO_SPECS['instagram']!;
    const words = script.trim().split(/\s+/).length;
    return parseFloat(((words / spec.wpm) * 60).toFixed(1));
  }
}
