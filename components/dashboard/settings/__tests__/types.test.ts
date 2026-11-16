import { describe, it, expect } from 'vitest';
import {
  resolveSettingsTab,
  computeSettingsReadiness,
  normalizePlanId,
  SETTINGS_SECTIONS,
} from '../types';

describe('Settings types and helpers', () => {
  it('defines 6 canonical sections split cleanly across personal and workspace groups', () => {
    expect(SETTINGS_SECTIONS).toHaveLength(6);
    const personal = SETTINGS_SECTIONS.filter((s) => s.group === 'personal').map((s) => s.id);
    const workspace = SETTINGS_SECTIONS.filter((s) => s.group === 'workspace').map((s) => s.id);

    expect(personal).toEqual(['account', 'security', 'notifications']);
    expect(workspace).toEqual(['channels', 'ai-voice', 'workspace']);
  });

  describe('resolveSettingsTab', () => {
    it('defaults empty or unknown tabs to account without a false redirect when empty', () => {
      expect(resolveSettingsTab(null)).toEqual({ section: 'account' });
      expect(resolveSettingsTab(undefined)).toEqual({ section: 'account' });
      expect(resolveSettingsTab('')).toEqual({ section: 'account' });

      const unknown = resolveSettingsTab('nonexistent-tab');
      expect(unknown.section).toBe('account');
      expect(unknown.redirectedFrom).toBeUndefined();
    });

    it('resolves all 6 canonical section IDs directly without redirectedFrom', () => {
      for (const sec of SETTINGS_SECTIONS) {
        const res = resolveSettingsTab(sec.id);
        expect(res.section).toBe(sec.id);
        expect(res.redirectedFrom).toBeUndefined();
      }
    });

    it('maps legacy tab aliases cleanly with compatibility flags', () => {
      expect(resolveSettingsTab('persona')).toEqual({
        section: 'ai-voice',
        redirectedFrom: 'persona',
      });
      expect(resolveSettingsTab('studio')).toEqual({
        section: 'ai-voice',
        redirectedFrom: 'studio',
      });
      expect(resolveSettingsTab('templates')).toEqual({
        section: 'ai-voice',
        redirectedFrom: 'templates',
        presenceNotice: 'templates',
      });
      expect(resolveSettingsTab('analytics')).toEqual({
        section: 'ai-voice',
        redirectedFrom: 'analytics',
        presenceNotice: 'analytics',
      });
      expect(resolveSettingsTab('danger')).toEqual({
        section: 'account',
        redirectedFrom: 'danger',
        dangerNotice: true,
      });
      expect(resolveSettingsTab('integrations')).toEqual({
        section: 'channels',
        redirectedFrom: 'integrations',
      });
      expect(resolveSettingsTab('billing')).toEqual({
        section: 'workspace',
        redirectedFrom: 'billing',
      });
      expect(resolveSettingsTab('sessions')).toEqual({
        section: 'security',
        redirectedFrom: 'sessions',
      });
      expect(resolveSettingsTab('alerts')).toEqual({
        section: 'notifications',
        redirectedFrom: 'alerts',
      });
    });
  });

  describe('normalizePlanId', () => {
    it('normalizes valid plan IDs case-insensitively and defaults unknown plans to spark', () => {
      expect(normalizePlanId('spark')).toBe('spark');
      expect(normalizePlanId('Creator')).toBe('creator');
      expect(normalizePlanId('PRO')).toBe('pro');
      expect(normalizePlanId('studio')).toBe('studio');
      expect(normalizePlanId(null)).toBe('spark');
      expect(normalizePlanId(undefined)).toBe('spark');
      expect(normalizePlanId('unrecognized')).toBe('spark');
    });
  });

  describe('computeSettingsReadiness', () => {
    it('reports incomplete readiness with 4 action items when baseline items are unconfigured', () => {
      const readiness = computeSettingsReadiness({
        connectionsSummary: {},
        studioCompleted: false,
        studioProfile: null,
        timezone: 'UTC',
        mfaEnabled: false,
        emailConfirmedAt: null,
      });

      expect(readiness.items).toHaveLength(4);
      expect(readiness.allReady).toBe(false);
    });

    it('reports allReady true when channel, AI voice, timezone, and security are configured', () => {
      const readiness = computeSettingsReadiness({
        connectionsSummary: {
          linkedin: { status: 'connected', username: 'creator' },
        },
        studioCompleted: true,
        studioProfile: {
          role: 'Founder',
          audience: 'SaaS builders',
          tone: 'Direct and warm',
        } as any,
        timezone: 'Asia/Kolkata',
        mfaEnabled: true,
        emailConfirmedAt: '2026-01-01T00:00:00Z',
      });

      expect(readiness.items).toHaveLength(4);
      expect(readiness.allReady).toBe(true);
    });
  });
});