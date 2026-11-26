'use client';

import React, { useId } from 'react';

export interface StudioAutoDmRuleState {
  enabled: boolean;
  keywords: string;
  dmMessage: string;
  dmCtaUrl: string;
  requireFollow: boolean;
  captureEmail: boolean;
  capturePhone: boolean;
}

export const DEFAULT_STUDIO_AUTO_DM_RULE: StudioAutoDmRuleState = {
  enabled: false,
  keywords: 'GUIDE, LINK',
  dmMessage: 'Hey! Thanks for commenting — here is the exact resource I mentioned in the post 🙌',
  dmCtaUrl: '',
  requireFollow: false,
  captureEmail: false,
  capturePhone: false,
};

interface StudioAutoDmCardProps {
  value: StudioAutoDmRuleState;
  onChange: (next: StudioAutoDmRuleState) => void;
}

export function StudioAutoDmCard({ value, onChange }: StudioAutoDmCardProps) {
  const uid = useId();
  return (
    <div className="rounded-xl border border-[#E4D9C8] bg-[#FAF7F2]/80 p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-[#3D2B1F]">
            Auto-DM Commenters on Publish (SignalDM)
          </div>
          <p className="text-[11px] text-[#6E5A48] mt-0.5">
            Automatically binds a post-specific keyword → DM campaign the moment Instagram publishes.
          </p>
        </div>
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3D2B1F] cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          />
          <span>{value.enabled ? 'Attached' : 'Attach'}</span>
        </label>
      </div>

      {value.enabled && (
        <div className="space-y-2.5 pt-2 border-t border-[#E8E0D4]">
          <div>
            <label htmlFor={`${uid}-kw`} className="block text-[11px] font-semibold text-[#6E5A48] mb-1">
              Trigger Keywords (comma-separated, leave blank for any comment)
            </label>
            <input
              id={`${uid}-kw`}
              type="text"
              value={value.keywords}
              onChange={(e) => onChange({ ...value, keywords: e.target.value })}
              placeholder="GUIDE, LINK, SEND"
              className="w-full rounded-lg border border-[#DDD2C0] bg-white px-2.5 py-1.5 text-xs text-[#3D2B1F]"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-msg`} className="block text-[11px] font-semibold text-[#6E5A48] mb-1">
              DM Reply Message
            </label>
            <textarea
              id={`${uid}-msg`}
              rows={2}
              value={value.dmMessage}
              onChange={(e) => onChange({ ...value, dmMessage: e.target.value })}
              className="w-full rounded-lg border border-[#DDD2C0] bg-white px-2.5 py-1.5 text-xs text-[#3D2B1F]"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-url`} className="block text-[11px] font-semibold text-[#6E5A48] mb-1">
              CTA Link URL (auto-tracked for CTR)
            </label>
            <input
              id={`${uid}-url`}
              type="url"
              value={value.dmCtaUrl}
              onChange={(e) => onChange({ ...value, dmCtaUrl: e.target.value })}
              placeholder="https://yourbrand.unool.co/resource"
              className="w-full rounded-lg border border-[#DDD2C0] bg-white px-2.5 py-1.5 text-xs text-[#3D2B1F]"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#3D2B1F]">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={value.requireFollow}
                onChange={(e) => onChange({ ...value, requireFollow: e.target.checked })}
              />
              <span>Require Follow</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={value.captureEmail}
                onChange={(e) => onChange({ ...value, captureEmail: e.target.checked })}
              />
              <span>Capture Email</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={value.capturePhone}
                onChange={(e) => onChange({ ...value, capturePhone: e.target.checked })}
              />
              <span>Capture Phone</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
