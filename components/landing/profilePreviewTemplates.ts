// Profile preview template data for landing page carousel.
// Auto-extracted from app/page.tsx for modularization.

export interface ProfilePreviewTemplate {
  id: string;
  name: string;
  category: string;
  tagline: string;
  color: string;
  screenBg: string;
  textColor: string;
  subtextColor: string;
  appBarColor: string;
  avatarBg: string;
  avatarText: string;
  badge: { text: string; bg: string; color: string; border?: string };
  role: string;
  bio?: string;
  proofs: Array<{ val: string; lbl: string }>;
  proofBg: string;
  proofBorder: string;
  proofValColor: string;
  proofLblColor: string;
  linkBg: string;
  linkBorder: string;
  linkHoverBorder: string;
  linkTitleColor: string;
  linkSubColor: string;
  links: Array<{
    platform: string;
    iconSvg: string;
    iconBg: string;
    iconFg: string;
    title: string;
    subtitle: string;
  }>;
}

export const PROFILE_PREVIEW_TEMPLATES: ProfilePreviewTemplate[] = [
  // 01 ΓÇö THE STORYTELLER / LOVER (Terracotta #c84b31 ΓÇö Unool Signature)
  {
    id: 'storyteller',
    name: 'The Storyteller',
    category: 'Unool Signature',
    tagline: 'Warm editorial storytelling across every network',
    color: '#c84b31',
    screenBg: '#ffffff',
    textColor: '#1c0b09',
    subtextColor: '#6c5b56',
    appBarColor: '#1c0b09',
    avatarBg: 'linear-gradient(135deg, #521f13, #c84b31)',
    avatarText: 'P',
    badge: { text: 'Γ£ª Signature Story', bg: 'rgba(200, 75, 49, 0.1)', color: '#c84b31', border: '1px solid rgba(200, 75, 49, 0.2)' },
    role: 'AI Design Systems ΓÇó San Francisco',
    bio: 'ΓÇ£Automated storytelling across every network you use.ΓÇ¥',
    proofs: [
      { val: '80%', lbl: 'Faster build' },
      { val: '30+', lbl: 'Networks' },
      { val: '1 Link', lbl: 'Everywhere' }
    ],
    proofBg: 'rgba(200, 75, 49, 0.04)',
    proofBorder: '1px solid rgba(200, 75, 49, 0.14)',
    proofValColor: '#c84b31',
    proofLblColor: '#7a5850',
    linkBg: '#ffffff',
    linkBorder: '1px solid #ede8e3',
    linkHoverBorder: '#c84b31',
    linkTitleColor: '#1c0b09',
    linkSubColor: '#6c5b56',
    links: [
      {
        platform: 'LinkedIn',
        iconSvg: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        iconBg: '#0A66C2',
        iconFg: '#ffffff',
        title: 'LinkedIn',
        subtitle: 'AI Design Systems Launch Case Study'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'X (Twitter)',
        subtitle: '@pixenox ┬╖ Building in public thread'
      },
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: '@pixenox.design ┬╖ Visual components'
      },
      {
        platform: 'YouTube',
        iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        iconBg: '#F00',
        iconFg: '#ffffff',
        title: 'YouTube',
        subtitle: 'Full design systems walkthrough'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#c84b31',
        iconFg: '#ffffff',
        title: '15+ more connected links',
        subtitle: 'Substack, Discord, Threads, GitHub'
      }
    ]
  },

  // 02 ΓÇö THE CREATOR (Peach / Salmon #e8a595)
  {
    id: 'creator',
    name: 'The Creator',
    category: 'Influencer & Media',
    tagline: 'Visual-first dynamic creator studio',
    color: '#e8a595',
    screenBg: 'linear-gradient(180deg, #fffbf9 0%, #fff0eb 100%)',
    textColor: '#26160f',
    subtextColor: '#8c6258',
    appBarColor: '#26160f',
    avatarBg: 'linear-gradient(135deg, #e8a595, #ea580c)',
    avatarText: 'P',
    badge: { text: '≡ƒÄ¼ Top Creator', bg: 'rgba(232, 165, 149, 0.25)', color: '#b4482a', border: '1px solid rgba(180, 72, 42, 0.25)' },
    role: 'Visual Systems & Creative Tech',
    bio: 'ΓÇ£Designing motion systems and interactive experiments.ΓÇ¥',
    proofs: [
      { val: '250K', lbl: 'Audience' },
      { val: '4.9Γÿà', lbl: 'Asset Kits' },
      { val: 'Weekly', lbl: 'Drops' }
    ],
    proofBg: 'rgba(255, 255, 255, 0.7)',
    proofBorder: '1px solid rgba(232, 165, 149, 0.35)',
    proofValColor: '#b4482a',
    proofLblColor: '#8c6258',
    linkBg: 'rgba(255, 255, 255, 0.85)',
    linkBorder: '1px solid rgba(232, 165, 149, 0.3)',
    linkHoverBorder: '#b4482a',
    linkTitleColor: '#26160f',
    linkSubColor: '#8c6258',
    links: [
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: 'Reels & visual tokens library'
      },
      {
        platform: 'YouTube',
        iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        iconBg: '#F00',
        iconFg: '#ffffff',
        title: 'YouTube',
        subtitle: '4K speedruns & livestreams'
      },
      {
        platform: 'TikTok',
        iconSvg: '<path d="M17.5 6.5a4.5 4.5 0 0 1-3.5-3.8h-2.5v11.8a2.5 2.5 0 1 1-2.5-2.5c.3 0 .7.1 1 .2V9.7a5.5 5.5 0 1 0 4 5.3V8.2a7.5 7.5 0 0 0 3.5 1.2V6.5z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'TikTok',
        subtitle: '60-sec engineering tips'
      },
      {
        platform: 'Dribbble',
        iconSvg: '<path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>',
        iconBg: '#EA4C89',
        iconFg: '#ffffff',
        title: 'Dribbble',
        subtitle: 'Featured visual concepts'
      },
      {
        platform: 'Kit',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#ea580c',
        iconFg: '#ffffff',
        title: 'Creator Kit (Free)',
        subtitle: 'Download Figma design tokens & assets'
      }
    ]
  },

  // 03 ΓÇö THE FOUNDER (Deep Wine / Maroon #832723)
  {
    id: 'founder',
    name: 'The Founder',
    category: 'Startup & Corporate',
    tagline: 'High-conviction executive presence',
    color: '#832723',
    screenBg: 'linear-gradient(180deg, #16070a 0%, #240a0e 100%)',
    textColor: '#fdf6ee',
    subtextColor: '#d8b9b0',
    appBarColor: '#fdf6ee',
    avatarBg: 'linear-gradient(135deg, #3d0c1a, #832723)',
    avatarText: 'P',
    badge: { text: 'Γ£ô Verified Founder', bg: 'rgba(131, 39, 35, 0.5)', color: '#ffb3a7', border: '1px solid rgba(255, 179, 167, 0.3)' },
    role: 'Founder & CEO ΓÇó Pixenox Labs',
    bio: 'ΓÇ£Scaling autonomous brand storytelling for modern founders.ΓÇ¥',
    proofs: [
      { val: '$2.4M', lbl: 'ARR Run-rate' },
      { val: '80%', lbl: 'Time saved' },
      { val: '100+', lbl: 'Enterprises' }
    ],
    proofBg: 'rgba(255, 255, 255, 0.06)',
    proofBorder: '1px solid rgba(255, 255, 255, 0.12)',
    proofValColor: '#ffb3a7',
    proofLblColor: '#d8b9b0',
    linkBg: 'rgba(255, 255, 255, 0.06)',
    linkBorder: '1px solid rgba(255, 255, 255, 0.1)',
    linkHoverBorder: '#832723',
    linkTitleColor: '#fdf6ee',
    linkSubColor: '#d8b9b0',
    links: [
      {
        platform: 'LinkedIn',
        iconSvg: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        iconBg: '#0A66C2',
        iconFg: '#ffffff',
        title: 'LinkedIn',
        subtitle: '2026 Letter to Founders & Vision'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'X (Twitter)',
        subtitle: '@pixenox ┬╖ Daily founder reflections'
      },
      {
        platform: 'Substack',
        iconSvg: '<path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>',
        iconBg: '#FF6719',
        iconFg: '#ffffff',
        title: 'Substack',
        subtitle: 'The Autonomous Enterprise (Weekly)'
      },
      {
        platform: 'Pitch',
        iconSvg: '<path d="M3.5 11.2L12 3.5l8.5 7.7V21h-5.7v-6h-5.6v6H3.5z" stroke="currentColor" fill="none" stroke-width="1.8"/>',
        iconBg: '#832723',
        iconFg: '#ffffff',
        title: 'Series A Pitch Deck',
        subtitle: 'Traction overview & financial metrics'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#c84b31',
        iconFg: '#ffffff',
        title: 'Press Kit & Speaking',
        subtitle: 'Keynotes, podcasts, facts & bio'
      }
    ]
  },

  // 04 ΓÇö THE MINIMALIST (Almond / Sand #d8b9b0)
  {
    id: 'minimalist',
    name: 'The Minimalist',
    category: 'Individual & Portfolio',
    tagline: 'Quiet, restrained editorial luxury',
    color: '#d8b9b0',
    screenBg: '#faf7f2',
    textColor: '#1f1a17',
    subtextColor: '#7d726b',
    appBarColor: '#1f1a17',
    avatarBg: 'linear-gradient(135deg, #c4a49a, #8c6a60)',
    avatarText: 'P',
    badge: { text: 'Γ£ª Selected Work', bg: 'rgba(216, 185, 176, 0.35)', color: '#4a3b35', border: '1px solid rgba(74, 59, 53, 0.15)' },
    role: 'Systems Designer & Typographer',
    bio: 'ΓÇ£Simplicity is clarity made visible.ΓÇ¥',
    proofs: [
      { val: '12', lbl: 'Yrs crafting' },
      { val: 'SF', lbl: 'California' },
      { val: 'Selected', lbl: 'Archive' }
    ],
    proofBg: '#ffffff',
    proofBorder: '1px solid #e7ded5',
    proofValColor: '#1f1a17',
    proofLblColor: '#7d726b',
    linkBg: '#ffffff',
    linkBorder: '1px solid #e7ded5',
    linkHoverBorder: '#1f1a17',
    linkTitleColor: '#1f1a17',
    linkSubColor: '#7d726b',
    links: [
      {
        platform: 'LinkedIn',
        iconSvg: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
        iconBg: '#4a3b35',
        iconFg: '#ffffff',
        title: 'LinkedIn',
        subtitle: 'Advisory & systems consulting'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#1f1a17',
        iconFg: '#ffffff',
        title: 'X',
        subtitle: 'Essays on design systems'
      },
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: '#8c6a60',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: 'Printed monograph & objects'
      },
      {
        platform: 'Monograph',
        iconSvg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="none" stroke="currentColor" stroke-width="2"/>',
        iconBg: '#7d726b',
        iconFg: '#ffffff',
        title: 'Autonomous Systems (2026)',
        subtitle: 'Selected case studies & specimens'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#4a3b35',
        iconFg: '#ffffff',
        title: 'Complete Archive',
        subtitle: '14 case studies & design tokens'
      }
    ]
  },

  // 05 ΓÇö THE DEVELOPER (Obsidian Dark Cyber #1c0b09)
  {
    id: 'developer',
    name: 'The Developer',
    category: 'Technical & Systems',
    tagline: 'Terminal-first cyber dark profile',
    color: '#1c0b09',
    screenBg: 'linear-gradient(180deg, #090a0f 0%, #11131c 100%)',
    textColor: '#f8fafc',
    subtextColor: '#94a3b8',
    appBarColor: '#f8fafc',
    avatarBg: 'linear-gradient(135deg, #0f172a, #1e293b)',
    avatarText: 'P',
    badge: { text: 'ΓùÅ terminal live', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' },
    role: 'Lead Systems Architect ΓÇó Rust & TS',
    bio: '$ pnpm dlx unool-cli@latest init',
    proofs: [
      { val: '1.4k Γÿà', lbl: 'GitHub Stars' },
      { val: '99.9%', lbl: 'Core Uptime' },
      { val: '0ms', lbl: 'Edge Sync' }
    ],
    proofBg: 'rgba(18, 20, 29, 0.95)',
    proofBorder: '1px solid rgba(56, 189, 248, 0.2)',
    proofValColor: '#38bdf8',
    proofLblColor: '#94a3b8',
    linkBg: 'rgba(18, 20, 29, 0.95)',
    linkBorder: '1px solid rgba(255, 255, 255, 0.08)',
    linkHoverBorder: '#38bdf8',
    linkTitleColor: '#f8fafc',
    linkSubColor: '#94a3b8',
    links: [
      {
        platform: 'GitHub',
        iconSvg: '<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>',
        iconBg: '#24292e',
        iconFg: '#ffffff',
        title: 'GitHub',
        subtitle: 'github.com/xpixenoxx/unool'
      },
      {
        platform: 'X',
        iconSvg: '<path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
        iconBg: '#000000',
        iconFg: '#ffffff',
        title: 'X (Twitter)',
        subtitle: 'Engineering logs & benchmarks'
      },
      {
        platform: 'Discord',
        iconSvg: '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>',
        iconBg: '#5865F2',
        iconFg: '#ffffff',
        title: 'Discord',
        subtitle: 'Join developer community server'
      },
      {
        platform: 'npm',
        iconSvg: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
        iconBg: '#CB3837',
        iconFg: '#ffffff',
        title: 'npm package',
        subtitle: '@unool/engine v2.4.0'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#22c55e',
        iconFg: '#ffffff',
        title: 'Documentation',
        subtitle: 'REST & WebSocket API Guide'
      }
    ]
  },

  // 06 ΓÇö THE STUDIO (Atelier Violet #4f46e5)
  {
    id: 'studio',
    name: 'The Studio',
    category: 'Agency & Collective',
    tagline: 'Culture-defining creative atelier',
    color: '#4f46e5',
    screenBg: 'linear-gradient(180deg, #0c0916 0%, #171228 100%)',
    textColor: '#fdf6ee',
    subtextColor: '#c7d2fe',
    appBarColor: '#fdf6ee',
    avatarBg: 'linear-gradient(135deg, #311042, #4f46e5)',
    avatarText: 'P',
    badge: { text: '≡ƒÅ¢∩╕Å Studio Atelier', bg: 'rgba(79, 70, 229, 0.25)', color: '#a5b4fc', border: '1px solid rgba(165, 180, 252, 0.3)' },
    role: 'Culture & Digital Experience Studio',
    bio: 'ΓÇ£Crafting digital worlds for leading brands.ΓÇ¥',
    proofs: [
      { val: '15', lbl: 'Awwwards' },
      { val: '50M+', lbl: 'Global reach' },
      { val: '2026', lbl: 'Roster open' }
    ],
    proofBg: 'rgba(255, 255, 255, 0.06)',
    proofBorder: '1px solid rgba(129, 140, 248, 0.25)',
    proofValColor: '#a5b4fc',
    proofLblColor: '#c7d2fe',
    linkBg: 'rgba(255, 255, 255, 0.05)',
    linkBorder: '1px solid rgba(255, 255, 255, 0.09)',
    linkHoverBorder: '#818cf8',
    linkTitleColor: '#fdf6ee',
    linkSubColor: '#c7d2fe',
    links: [
      {
        platform: 'Portfolio',
        iconSvg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
        iconBg: '#4f46e5',
        iconFg: '#ffffff',
        title: 'Selected Works',
        subtitle: 'Interactive brand case studies'
      },
      {
        platform: 'Instagram',
        iconSvg: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
        iconBg: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
        iconFg: '#ffffff',
        title: 'Instagram',
        subtitle: 'Prototypes, motion & objects'
      },
      {
        platform: 'Reel',
        iconSvg: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
        iconBg: '#1AB7EA',
        iconFg: '#ffffff',
        title: 'Studio Reel (4K)',
        subtitle: '2026 motion showreel & sound'
      },
      {
        platform: 'Monograph',
        iconSvg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="none" stroke="currentColor" stroke-width="2"/>',
        iconBg: '#4338ca',
        iconFg: '#ffffff',
        title: 'Design Specimen',
        subtitle: 'Digital Culture Yearbook'
      },
      {
        platform: 'More',
        iconSvg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
        iconBg: '#818cf8',
        iconFg: '#ffffff',
        title: 'Inquire & Commission',
        subtitle: 'Booking for Q4 2026 projects'
      }
    ]
  }
];
