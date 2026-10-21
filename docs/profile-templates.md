# Profile Template Customization API

This document describes how to add new templates, override styles, and extend props for the profile system.

## Overview

The profile system uses 15 persona-driven templates across 5 categories:

| Category | Templates |
|----------|-----------|
| Individual | lover, lone, energy |
| Startup | rebellion, vision, human |
| Agency | the-machine, the-club, the-studio |
| Entrepreneur | the-builder, the-visionary, the-hustler |
| Influencer | the-aesthete, the-creator, the-voice |

Each template is a React component in `components/profile/templates/persona/{templateId}/index.tsx` that implements the `TemplateProps` interface.

---

## TemplateProps Interface

All templates receive the same typed props:

```typescript
interface TemplateProps {
  profile: PublicProfile;      // Complete profile data
  accentColor?: string;        // Optional accent color override
  isPreview?: boolean;         // True when rendering in Settings preview
  onLinkClick?: (link: ProfileLink) => void;  // Click tracking callback
  templateId?: string;         // Template identifier for analytics
}
```

### PublicProfile Structure

```typescript
interface PublicProfile {
  // Core identity
  id: string;
  subdomain: string;
  name: string;
  headline: string;
  bio: string;
  role?: string;
  company?: string;
  avatarUrl: string;

  // Links & proofs
  links: ProfileLink[];
  proofs: ProfileProof[];

  // Theme
  theme: {
    template: string;
    preset: string;
    accentColor: string;
    customCss: string | null;
  };

  // Social
  socialHandles: Record<string, string>;
  openTo?: string[];

  // SEO
  seo: {
    title: string;
    description: string;
    image: string | null;
  };

  // Extended fields (used by specific templates)
  email?: string;
  location?: string;
  recentActivity?: any[];
  autoScroll?: boolean;
  metrics?: any[];
  proofPoints?: any[];
  handle?: string;
  tagline?: string;
  manifesto?: string;
  availability?: string;
  calendlyUrl?: string;
  description?: string;
  projects?: ProfileProject[];
  activity?: any[];
  avatar?: string;
}
```

### ProfileLink Structure

```typescript
interface ProfileLink {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  clicks: number;
  order: number;
  isVisible: boolean;
  platform?: string;         // Club template
  isPrimaryAction?: boolean; // Club template
}
```

### ProfileProof Structure

```typescript
interface ProfileProof {
  id: string;
  type: 'metric' | 'testimonial' | 'badge' | 'certification';
  title: string;
  value: string;
  description: string | null;
  icon: string | null;
  order: number;
}
```

---

## Adding a New Template

### 1. Create Template Directory

```
components/profile/templates/persona/my-template/
├── index.tsx          # Main export (barrel)
└── MyTemplate.tsx     # Implementation (optional, can be inline)
```

### 2. Implement the Template

```tsx
// components/profile/templates/persona/my-template/index.tsx
'use client';

import type { TemplateProps } from '@/components/profile/templates/types';

export function MyTemplate({ profile, accentColor, isPreview, onLinkClick }: TemplateProps) {
  // Your template implementation
  return (
    <div className="min-h-screen">
      {/* Template content */}
    </div>
  );
}
```

### 3. Register in Barrel Export

```tsx
// components/profile/templates/persona/index.ts
export { MyTemplate } from './my-template';
```

### 4. Add to Registry

```typescript
// components/profile/templates/registry.ts
import type { TemplateMeta } from './types';

export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  // ... existing templates
  {
    id: 'my-template',
    name: 'My Template',
    category: 'individual', // or startup, agency, entrepreneur, influencer
    intensity: 'light',
    preset: 'minimal',
    icon: '✨',
    tagline: 'Custom tagline',
    description: 'Description for template selector',
    tags: ['tag1', 'tag2'],
    thumbnail: '/templates/previews/my-template.svg',
    features: {
      has3DBackground: false,
      hasParallax: false,
      hasTiltCards: false,
      hasMagneticHover: false,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 10,
      maxProofPoints: 5,
      performanceBudget: 'light',
      maxBundleSizeKB: 50,
      maxRenderMs: 80,
    },
    persona: 'my-template',
  },
];
```

### 5. Add Dynamic Import to ProfilePreview

```tsx
// components/profile/ProfilePreview.tsx
const templateMap: Record<string, () => Promise<{ default: React.ComponentType<TemplateProps> }>> = {
  // ... existing
  'my-template': () => import('@/components/profile/templates/persona/my-template').then(m => ({ default: m.MyTemplate })),
};
```

### 6. Create Preview Thumbnail

Add `/public/templates/previews/my-template.svg` for the template selector.

### 7. (Optional) Add Category Skeleton

If your template needs a custom loading skeleton, add to `components/profile/templates/TemplateSkeletons.tsx` and update `getSkeletonCategory()` in `ProfilePreview.tsx`.

---

## Extending Props

### Adding Custom Fields to Profile

If a template needs additional profile data not in `PublicProfile`:

1. **Extend the shared type** (recommended for shared fields):
   ```typescript
   // components/profile/templates/types.ts
   export interface PublicProfile {
     // ... existing fields
     myCustomField?: MyCustomType;
   }
   ```

2. **Use type assertion in template** (for template-specific fields):
   ```tsx
   const customData = (profile as any).myCustomField;
   ```

### Adding Template-Specific Props

For props only used by one template, extend `TemplateProps` locally:

```tsx
// components/profile/templates/persona/my-template/index.tsx
interface MyTemplateProps extends TemplateProps {
  customProp?: string;
}

export function MyTemplate({ profile, accentColor, isPreview, onLinkClick, customProp }: MyTemplateProps) {
  // Use customProp
}
```

**Note:** The ProfilePreview will still pass standard `TemplateProps`. Custom props must be added to the ProfilePreview render call or handled via profile data.

---

## Overriding Styles

### CSS Custom Properties (Preferred)

Templates use CSS custom properties for theming. Override in your template:

```tsx
<div className="my-template" style={{
  '--accent-color': accentColor || '#default',
  '--custom-spacing': '2rem',
}}>
```

### Global Styles

Add template-specific styles in a `<style jsx global>` block or CSS module:

```tsx
<style jsx global>{`
  .my-template {
    font-family: 'Custom Font', sans-serif;
    background: var(--my-bg);
  }
`}</style>
```

### Tailwind Integration

Templates use Tailwind classes. Extend in `tailwind.config.ts`:

```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'my-template-accent': '#custom-color',
    },
  },
}
```

---

## Performance Budgets

Each template has performance budgets defined in `registry.ts`:

| Template | Max Bundle (KB) | Max Render (ms) |
|----------|-----------------|-----------------|
| lone | 25 | 40 |
| the-builder | 30 | 50 |
| lover | 45 | 80 |
| human | 40 | 75 |
| the-voice | 55 | 85 |
| the-aesthete | 50 | 90 |
| the-machine | 70 | 100 |
| the-hustler | 70 | 115 |
| the-visionary | 75 | 110 |
| energy | 65 | 120 |
| vision | 85 | 150 |
| the-creator | 130 | 210 |
| rebellion | 120 | 200 |
| the-club | 140 | 220 |
| the-studio | 150 | 250 |

### CI Checks

Add to your CI pipeline:

```bash
# Check bundle sizes
npm run build && node scripts/check-bundle-sizes.js

# Script example (scripts/check-bundle-sizes.js):
// Read .next/analyze/client.html or use next-bundle-analyzer
// Compare against maxBundleSizeKB in registry.ts
```

---

## Shared Utilities

### Social Icons

```typescript
import { getLinkIcon, getPlatformIcon } from '@/components/profile/templates/utils/socialIcons';

// Usage
<LinkIcon label="Twitter" url="https://x.com/user" icon="x" size={24} />
```

### Recent Activity

```tsx
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';

<RecentActivitySection
  activity={profile.recentActivity}
  variant="my-template"  // Must match registry variant
  isDark={true}
  accentColor={accentColor}
  autoScroll={profile.autoScroll}
/>
```

### Template Skeletons

```tsx
import { getSkeletonCategory } from '@/components/profile/templates/TemplateSkeletons';

const skeletonCategory = getSkeletonCategory(templateId);
```

---

## Template Categories & Presets

| Category | Presets | Description |
|----------|---------|-------------|
| individual | minimal, creative | Personal brands, portfolios |
| startup | creative, technical | Early-stage companies |
| agency | corporate, creative | Service businesses, studios |
| entrepreneur | technical, corporate, bold | Founders, builders |
| influencer | creative, bold | Content creators, thought leaders |

| Preset | Style |
|--------|-------|
| minimal | Clean, whitespace, typography-focused |
| corporate | Professional, structured, trustworthy |
| creative | Expressive, experimental, visual |
| technical | Data-dense, precise, functional |
| bold | High contrast, impactful, memorable |

---

## Best Practices

1. **Code-split templates** - All templates use `React.lazy` + `Suspense` in `ProfilePreview.tsx`
2. **Use shared utilities** - Import from `utils/socialIcons.ts`, `components/profile/RecentActivitySection`
3. **Respect performance budgets** - Keep bundle size and render time within limits
4. **Handle missing data gracefully** - All profile fields are optional; provide fallbacks
5. **Support dark/light mode** - Use `isPreview` for preview-specific adjustments
6. **Accessibility** - Semantic HTML, ARIA labels, color contrast, keyboard navigation
7. **Reduced motion** - Respect `prefers-reduced-motion` media query

---

## Debugging

### Template Not Loading

1. Check `ProfilePreview.tsx` dynamic import path
2. Verify template ID matches registry
3. Check browser console for chunk load errors

### Type Errors

1. Run `npx tsc --noEmit`
2. Ensure `TemplateProps` is imported from `@/components/profile/templates/types`
3. Check `PublicProfile` has required fields

### Performance Issues

1. Check `maxBundleSizeKB` in registry
2. Use React DevTools Profiler
3. Lazy-load heavy components (3D, charts) with `ssr: false`

---

## File Structure Reference

```
components/
├── profile/
│   ├── templates/
│   │   ├── types.ts              # Shared types (TemplateProps, PublicProfile, etc.)
│   │   ├── registry.ts           # Template metadata + performance budgets
│   │   ├── activityVariants.tsx  # RecentActivitySection variants
│   │   ├── TemplateSkeletons.tsx # Loading skeletons per category
│   │   ├── utils/
│   │   │   └── socialIcons.tsx   # Shared social icon utilities
│   │   └── persona/
│   │       ├── index.ts          # Barrel export
│   │       ├── lover/
│   │       ├── lone/
│   │       ├── energy/
│   │       ├── rebellion/
│   │       ├── vision/
│   │       ├── human/
│   │       ├── the-machine/
│   │       ├── the-club/
│   │       ├── the-studio/
│   │       ├── the-builder/
│   │       ├── the-visionary/
│   │       ├── the-hustler/
│   │       ├── the-aesthete/
│   │       ├── the-creator/
│   │       └── the-voice/
│   ├── ProfilePreview.tsx        # Template renderer with Suspense
│   ├── RecentActivitySection.tsx # Shared activity component
│   └── SocialBrandIcons.tsx      # Brand icon utilities
└── dashboard/
    └── settings/
        └── SettingsClient.tsx    # Template selector UI
```