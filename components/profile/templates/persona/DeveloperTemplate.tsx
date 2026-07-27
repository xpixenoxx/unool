'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TemplateProps } from '../types';
import { Flex, Stack, Box, Grid } from '@/components/ui/layout';
import { Text, Heading, Code, Overline } from '@/components/ui/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TiltCard, OrbitalParticles } from '@/components/ui/3d';
import { spring, slideUp } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChevronRight, Terminal, Github, Star, GitFork, FileCode, Folder, Monitor, Keyboard, ExternalLink, Router } from 'lucide-react';

interface RepoData {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  url: string;
  isPinned: boolean;
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    CSharp: '#178600',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Swift: '#FA7343',
    Kotlin: '#F18E33',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#42b883',
    Svelte: '#ff3e00',
    Dockerfile: '#384d54',
    YAML: '#cb171e',
    JSON: '#292929',
    Markdown: '#083fa1',
  };
  return colors[language] || '#6366f1';
}

function TerminalPrompt({ text, delay = 0, reducedMotion }: { text: string; delay?: number; reducedMotion: boolean }) {
  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring.standard, delay: 0.2 + delay }}
      className="flex items-baseline gap-2 font-mono text-sm"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
    >
      <span className="text-green-400">{'➜'}</span>
      <span className="text-muted-foreground">{'~/profile'}</span>
      <span className="text-cyan-400">{'$'}</span>
      <span className="text-foreground">{text}</span>
    </motion.div>
  );
}

function TypingText({ text, delay = 0, reducedMotion, className, style }: { text: string; delay?: number; reducedMotion: boolean; className?: string; style?: React.CSSProperties }) {
  const [displayText, setDisplayText] = React.useState('');
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    const chars = text.split('');
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < chars.length) {
          setDisplayText(prev => prev + chars[i]);
          i++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [text, delay, reducedMotion]);

  return (
    <motion.span
      initial={reducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 + delay }}
      className={className}
      style={style}
    >
      {displayText}
      {!reducedMotion && displayText === text && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="ml-1"
        >
          █
        </motion.span>
      )}
    </motion.span>
  );
}

function StatCard({ label, value, icon: Icon, accent, delay = 0, reducedMotion }: { label: string; value: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; accent: string; delay?: number; reducedMotion: boolean }) {
  return (
    <TiltCard maxTilt={reducedMotion ? 0 : 3} scale={1.015} className="h-auto">
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.standard, delay: 0.3 + delay }}
        className="relative p-4 rounded-xl border overflow-hidden"
        style={{ background: 'oklch(0.12 0.01 150)', borderColor: 'oklch(0.18 0.02 150)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accent}08 0%, transparent 100%)`,
            opacity: reducedMotion ? 1 : 1
          }}
        />
        <Flex between className="relative z-10 mb-3">
          <Overline className="uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
            {label}
          </Overline>
          <Icon className="w-5 h-5" style={{ color: accent, opacity: 0.6 }} />
        </Flex>
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.bouncy, delay: 0.5 + delay }}
          className="text-2xl font-bold relative z-10"
          style={{ fontFamily: 'var(--font-mono)', color: accent, fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </motion.div>
      </motion.div>
    </TiltCard>
  );
}

function RepoCard({ repo, accent, delay = 0, reducedMotion }: { repo: RepoData; accent: string; delay?: number; reducedMotion: boolean }) {
  const isGitHub = repo.url.includes('github.com');

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring.standard, delay: 0.4 + delay }}
      className="group relative"
    >
      <TiltCard maxTilt={reducedMotion ? 0 : 4} scale={1.01} className="h-auto">
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full p-4 rounded-xl border flex flex-col h-full no-underline"
          style={{
            background: 'oklch(0.12 0.01 150)',
            borderColor: 'oklch(0.18 0.02 150)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!reducedMotion) {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.boxShadow = `0 8px 32px -8px ${accent}30`;
            }
          }}
          onMouseLeave={(e) => {
            if (!reducedMotion) {
              e.currentTarget.style.borderColor = 'oklch(0.18 0.02 150)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {/* Header */}
          <Flex between className="mb-3">
            <Flex gap={2} align="center">
              <motion.div
                initial={reducedMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring.bouncy, delay: 0.5 + delay }}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, color: 'oklch(0.09 0.01 150)' }}
              >
                {repo.isPinned ? <Star className="w-4 h-4 fill-current" /> : <FileCode className="w-4 h-4" />}
              </motion.div>
              <div className="min-w-0">
                <Text weight="semibold" className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
                  {repo.name}
                </Text>
                {repo.isPinned && (
                  <Badge variant="secondary" size="sm" className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', background: `${accent}20`, color: accent }}>
                    PINNED
                  </Badge>
                )}
              </div>
            </Flex>
          </Flex>

          {/* Description */}
          {repo.description && (
            <motion.p
              initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.standard, delay: 0.5 + delay }}
              className="text-sm mb-3 flex-1"
              style={{ color: 'var(--muted-foreground)', lineHeight: 1.6, fontFamily: 'var(--font-sans)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {repo.description}
            </motion.p>
          )}

          {/* Footer Stats */}
          <Flex between className="pt-3 border-t relative z-10" style={{ borderColor: 'oklch(0.18 0.02 150)' }}>
            <Flex gap={4} align="center">
              <Flex gap={1.5} align="center" className="opacity-70 group-hover:opacity-100 transition-opacity">
                <Star className="w-3.5 h-3.5" style={{ color: accent }} />
                <Text size="xs" style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {repo.stars.toLocaleString()}
                </Text>
              </Flex>
              <Flex gap={1.5} align="center" className="opacity-70 group-hover:opacity-100 transition-opacity">
                <GitFork className="w-3.5 h-3.5" style={{ color: accent }} />
                <Text size="xs" style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {repo.forks.toLocaleString()}
                </Text>
              </Flex>
              {repo.language && (
                <Flex gap={1.5} align="center" className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: repo.languageColor }} />
                  <Text size="xs" style={{ fontFamily: 'var(--font-mono)' }}>
                    {repo.language}
                  </Text>
                </Flex>
              )}
            </Flex>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileHover={{ opacity: 1, x: 4 }}
              transition={{ ...spring.snappy }}
              className="opacity-0 flex items-center gap-1.5 text-xs"
              style={{ color: accent, fontFamily: 'var(--font-mono)' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View</span>
            </motion.div>
          </Flex>
        </a>
      </TiltCard>
    </motion.div>
  );
}

export function DeveloperTemplate({
  profile,
  accentColor,
  isPreview,
  onLinkClick,
}: TemplateProps) {
  const reducedMotion = useReducedMotion();
  const accent = accentColor || 'oklch(0.65 0.18 150)'; // Terminal green
  const secondaryAccent = 'oklch(0.6 0.15 200)'; // Cyan

  const visibleLinks = profile.links.filter((l) => l.isVisible).slice(0, 12);
  const visibleProofs = profile.proofs.slice(0, 10);

  // Extract GitHub stats from proofs
  const githubStats = {
    repos: visibleProofs.find(p => p.title.toLowerCase().includes('repo'))?.value || '42',
    stars: visibleProofs.find(p => p.title.toLowerCase().includes('star'))?.value || '1.2k',
    contributions: visibleProofs.find(p => p.title.toLowerCase().includes('contrib'))?.value || '365',
  };

  // Mock pinned repos (in real app, would come from profile data or GitHub API)
  const pinnedRepos: RepoData[] = [
    {
      name: 'unool',
      description: 'Modern link-in-bio platform for creators, developers, and founders. Built with Next.js, React, and Framer Motion.',
      stars: 1247,
      forks: 89,
      language: 'TypeScript',
      languageColor: getLanguageColor('TypeScript'),
      url: 'https://github.com/unool/unool',
      isPinned: true,
    },
    {
      name: 'design-tokens',
      description: 'Design system tokens for the Unool platform. OKLCH color space, fluid typography, spring animations.',
      stars: 523,
      forks: 34,
      language: 'TypeScript',
      languageColor: getLanguageColor('TypeScript'),
      url: 'https://github.com/unool/design-tokens',
      isPinned: true,
    },
    {
      name: 'orbital-bg',
      description: 'High-performance orbital background component with canvas/SVG rendering, reduced motion support, and IntersectionObserver pause.',
      stars: 312,
      forks: 21,
      language: 'TypeScript',
      languageColor: getLanguageColor('TypeScript'),
      url: 'https://github.com/unool/orbital-bg',
      isPinned: false,
    },
    {
      name: 'motion-primitives',
      description: 'Spring-based animation primitives for React. Snappy, standard, gentle, bouncy, magnetic, and orbital presets.',
      stars: 445,
      forks: 28,
      language: 'TypeScript',
      languageColor: getLanguageColor('TypeScript'),
      url: 'https://github.com/unool/motion-primitives',
      isPinned: false,
    },
    {
      name: 'cli-tools',
      description: 'Collection of CLI tools for developer productivity. Built with Rust for performance.',
      stars: 189,
      forks: 12,
      language: 'Rust',
      languageColor: getLanguageColor('Rust'),
      url: 'https://github.com/unool/cli-tools',
      isPinned: false,
    },
    {
      name: 'portfolio',
      description: 'My personal portfolio site. Built with Next.js, Tailwind, and Framer Motion. Features dark mode and animations.',
      stars: 67,
      forks: 8,
      language: 'JavaScript',
      languageColor: getLanguageColor('JavaScript'),
      url: 'https://github.com/unool/portfolio',
      isPinned: false,
    },
  ];

  // Internal component: SyntaxHighlightedCode - simple syntax highlighting for code blocks
  const SyntaxHighlightedCode = ({ code, language = 'typescript', reducedMotion }: { code: string; language?: string; reducedMotion: boolean }) => {
    const highlight = (code: string) => {
      const tokens = code
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(
          /\b(const|let|var|function|return|if|else|for|while|switch|case|default|break|continue|try|catch|finally|throw|import|export|from|as|type|interface|extends|implements|public|private|protected|static|async|await|new|this|super|class|enum|namespace|module|declare|abstract|readonly)\b/g,
          '<span style="color:#c586c0">$&</span>'
        )
        .replace(
          /\b(string|number|boolean|any|void|never|unknown|object|Array|Promise|Record|Partial|Pick|Omit|Exclude|Extract|Parameters|ReturnType)\b/g,
          '<span style="color:#4ec9b0">$&</span>'
        )
        .replace(
          /("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g,
          '<span style="color:#ce9178">$&</span>'
        )
        .replace(
          /\b(\d+\.?\d*)\b/g,
          '<span style="color:#b5cea8">$&</span>'
        )
        .replace(
          /(\/\/.*$)/gm,
          '<span style="color:#6a9955">$&</span>'
        );
      return tokens;
    };

    return (
      <code
        className="font-mono text-sm"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: highlight(code) }}
      />
    );
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        '--profile-accent': accent,
        '--profile-radius': '4px',
        fontFamily: 'var(--font-mono)',
        background: 'oklch(0.09 0.01 150)',
        color: 'oklch(0.92 0.02 150)',
      } as React.CSSProperties}
    >
      {/* Background: Terminal grid pattern */}
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        {/* Base */}
        <div className="absolute inset-0" style={{ background: 'oklch(0.09 0.01 150)' }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, ${accent}22 1px, transparent 1px),
              linear-gradient(${accent}22 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Accent glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-20"
          style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, transparent 70%)` }}
        />
        {/* Subtle matrix-like particles */}
        {!reducedMotion && (
          <OrbitalParticles
            count={15}
            colors={[accent, secondaryAccent, 'oklch(0.7 0.15 150)']}
            size={3}
            speed={0.3}
            className="pointer-events-none fixed inset-0 -z-10 opacity-30"
          />
        )}
      </div>

      {/* Terminal Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-20 border-b" style={{ borderColor: 'oklch(0.18 0.02 150)', background: 'oklch(0.09 0.01 150 / 0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
          {/* Window controls */}
          <Flex gap={1.5}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28ca42' }} />
          </Flex>

          {/* Terminal title */}
          <Flex center flex={1}>
            <Terminal className="w-4 h-4" style={{ color: accent }} />
            <Text size="xs" weight="medium" color="muted" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              ~/profile — {profile.name || 'user'}@unool.dev
            </Text>
          </Flex>

          {/* Status indicators */}
          <Flex gap={3} align="center">
            <Flex gap={1.5} align="center" className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: accent }}>
              <Monitor className="w-3.5 h-3.5" />
              <span>{githubStats.repos} repos</span>
            </Flex>
            <Flex gap={1.5} align="center" className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: accent }}>
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{githubStats.stars}</span>
            </Flex>
          </Flex>
        </div>
      </div>

      <Stack space={6} className="relative max-w-5xl mx-auto px-4 pt-20 pb-12" style={{ fontFamily: 'var(--font-mono)' }}>
        {/* Header: Terminal Prompt */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.1 }}
          className="space-y-3"
        >
          <TerminalPrompt text="cat bio.md" reducedMotion={reducedMotion} />
          <TerminalPrompt text="ls -la links/" delay={0.1} reducedMotion={reducedMotion} />
          <TerminalPrompt text="git status --short" delay={0.2} reducedMotion={reducedMotion} />
        </motion.div>

        {/* Profile Card: Syntax-highlighted bio */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.3 }}
        >
          <div className="relative rounded-xl border p-1.5 overflow-hidden" style={{ borderColor: 'oklch(0.18 0.02 150)', background: 'oklch(0.12 0.01 150)' }}>
            <div className="relative p-5 rounded-lg" style={{ background: 'oklch(0.09 0.01 150)' }}>
              {/* Avatar + Name inline */}
              <Flex gap={4} align="center" className="mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full -inset-1" style={{ background: `radial-gradient(circle at 30% 30%, ${accent}15, transparent 70%)`, filter: 'blur(12px)', transform: 'scale(1.2)' }} />
                  <Avatar className="h-16 w-16 ring-2 relative z-10" ringColor={accent} style={{ borderColor: accent }}>
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {profile.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Stack space={1} align="start">
                  <motion.h1
                    initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring.standard, delay: 0.3 }}
                    className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}
                  >
                    <TypingText text={profile.name || 'Anonymous'} delay={0.1} reducedMotion={reducedMotion} style={{ fontFamily: 'var(--font-sans)' }} />
                  </motion.h1>
                  {profile.headline && (
                    <motion.p
                      initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring.standard, delay: 0.4 }}
                      className="text-base font-medium"
                      style={{ fontFamily: 'var(--font-sans)', color: accent }}
                    >
                      <TypingText text={profile.headline} delay={0.2} reducedMotion={reducedMotion} />
                    </motion.p>
                  )}
                  {profile.company && (
                    <motion.p
                      initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...spring.standard, delay: 0.5 }}
                      className="text-sm"
                      style={{ fontFamily: 'var(--font-sans)', color: secondaryAccent }}
                    >
                      <TypingText text={`@ ${profile.company}`} delay={0.3} reducedMotion={reducedMotion} />
                    </motion.p>
                  )}
                  <motion.div
                    initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring.standard, delay: 0.6 }}
                    className="flex items-center gap-2 text-xs"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}
                  >
                    <span>@</span>
                    <span>{profile.subdomain}</span>
                    <span style={{ color: accent }}>.unool.dev</span>
                    <Keyboard className="w-3.5 h-3.5" style={{ color: accent, opacity: 0.4 }} />
                    <span>/</span>
                    <span style={{ color: accent }}>live</span>
                  </motion.div>
                </Stack>
              </Flex>

              {/* Bio - Syntax Highlighted Bio - ALWAYS VISIBLE when bio exists */}
              {profile.bio && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring.standard, delay: 0.7 }}
                  className="relative rounded-lg p-4 mt-4 overflow-x-auto"
                  style={{
                    background: 'oklch(0.12 0.01 150)',
                    border: `1px solid ${accent}20`,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                  }}
                >
                  <div className="flex gap-2 mb-2 opacity-50" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    <span style={{ color: '#ff7b72' }}>{'const profile = {'}</span>
                    <span style={{ color: '#79c0ff' }}>{'"bio":'}</span>
                  </div>
                  <SyntaxHighlightedCode code={profile.bio} language="typescript" reducedMotion={reducedMotion} />
                  <div className="mt-2 opacity-50" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#ff7b72' }}>
                    {'}'}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* GitHub Stats - KPI Cards - ALWAYS VISIBLE, tilt only on hover if not reduced motion */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.standard, delay: 0.8 }}
        >
          <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>
            <StatCard
              label="REPOSITORIES"
              value={githubStats.repos}
              icon={Folder}
              accent={accent}
              delay={0}
              reducedMotion={reducedMotion}
            />
            <StatCard
              label="TOTAL STARS"
              value={githubStats.stars}
              icon={Star}
              accent={secondaryAccent}
              delay={0.05}
              reducedMotion={reducedMotion}
            />
            <StatCard
              label="CONTRIBUTIONS"
              value={githubStats.contributions}
              icon={Github}
              accent={accent}
              delay={0.1}
              reducedMotion={reducedMotion}
            />
          </Grid>
        </motion.div>

        {/* Pinned Repositories - ALWAYS VISIBLE */}
        {pinnedRepos.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 0.9 }}
          >
            <Flex between className="mb-4">
              <Overline className="uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
                PINNED REPOSITORIES
              </Overline>
              <Flex gap={1.5} align="center" className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                <span>{pinnedRepos.length} repositories</span>
                <Keyboard className="w-3.5 h-3.5" style={{ color: accent, opacity: 0.4 }} />
              </Flex>
            </Flex>
            <Grid cols={{ base: 1, lg: 2, xl: 3 }} gap={4}>
              {pinnedRepos.map((repo, index) => (
                <RepoCard key={repo.name} repo={repo} accent={accent} delay={index * 0.06} reducedMotion={reducedMotion} />
              ))}
            </Grid>
          </motion.div>
        )}

        {/* Links Section - Styled as repo list - ALWAYS VISIBLE */}
        {visibleLinks.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1.0 }}
          >
            <Flex between className="mb-4">
              <Overline className="uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
                EXTERNAL LINKS
              </Overline>
              <Flex gap={1.5} align="center" className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                <span>{visibleLinks.length} links</span>
                <Router className="w-3.5 h-3.5" style={{ color: accent, opacity: 0.4 }} />
              </Flex>
            </Flex>
            <Stack space={3} className="w-full">
              {visibleLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={reducedMotion ? {} : { opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...spring.standard, delay: 1.0 + index * 0.04 }}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full px-4 py-3.5 group no-underline flex items-center gap-3 rounded-lg transition-all duration-150"
                    style={{
                      background: 'oklch(0.12 0.01 150)',
                      border: '1px solid oklch(0.18 0.02 150)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.875rem',
                    }}
                    onMouseEnter={() => isPreview && onLinkClick?.(link)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'oklch(0.12 0.01 150)';
                      e.currentTarget.style.borderColor = 'oklch(0.18 0.02 150)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = '2px solid';
                      e.currentTarget.style.outlineOffset = '2px';
                      e.currentTarget.style.outlineColor = accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    {/* Hover background - always visible on hover/focus */}
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      style={{ background: accent, opacity: 0 }}
                      whileHover={{ opacity: 0.08 }}
                      whileFocus={{ opacity: 0.08 }}
                      transition={{ duration: 0.15 }}
                    />

                    {/* Icon - ALWAYS VISIBLE */}
                    <motion.div
                      initial={reducedMotion ? {} : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ ...spring.bouncy, delay: index * 0.04 }}
                      className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                        color: 'oklch(0.09 0.01 150)',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: `0 2px 8px -2px ${accent}`,
                      }}
                    >
                      {link.icon || link.label.charAt(0).toUpperCase()}
                    </motion.div>

                    {/* Label + URL - ALWAYS VISIBLE */}
                    <Flex column gap={1} flex={1} className="min-w-0">
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring.gentle, delay: index * 0.03 }}
                        className="truncate group-hover:text-primary transition-colors"
                        style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 500 }}
                      >
                        {link.label}
                      </motion.span>
                      <Text size="xs" color="muted" className="truncate font-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {link.url}
                      </Text>
                    </Flex>

                    {/* External link + Click count */}
                    <Flex align="center" gap={2.5}>
                      <motion.span
                        initial={{ opacity: 0.3, x: -6 }}
                        whileHover={{ opacity: 1, x: 4 }}
                        transition={{ ...spring.snappy }}
                        style={{ color: accent, fontSize: '1rem' }}
                      >
                        →
                      </motion.span>
                      <motion.span
                        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring.gentle, delay: 1.1 + index * 0.03 }}
                        style={{
                          fontSize: '0.75rem',
                          color: accent,
                          fontFamily: 'var(--font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 500,
                        }}
                      >
                        {link.clicks.toLocaleString()}
                      </motion.span>
                    </Flex>
                  </a>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Proof Points - Terminal style list - ALWAYS VISIBLE */}
        {visibleProofs.length > 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.standard, delay: 1.2 }}
          >
            <Overline className="uppercase tracking-wider mb-3" style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
              ACHIEVEMENTS
            </Overline>
            <Stack space={2}>
              {visibleProofs.map((proof, index) => (
                <motion.div
                  key={proof.id}
                  initial={reducedMotion ? {} : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring.standard, delay: 1.2 + index * 0.05 }}
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'oklch(0.12 0.01 150)', border: `1px solid ${accent}20` }}>
                    {proof.icon && (
                      <motion.div
                        initial={reducedMotion ? {} : { scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...spring.bouncy, delay: 1.3 + index * 0.05 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, color: 'oklch(0.09 0.01 150)', fontSize: '1rem' }}
                      >
                        {proof.icon}
                      </motion.div>
                    )}
                    <Flex column gap={0.5} flex={1} className="min-w-0">
                      <Text weight="semibold" size="sm" style={{ fontFamily: 'var(--font-sans)' }}>
                        {proof.title}
                      </Text>
                      {proof.value && <Text size="sm" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{proof.value}</Text>}
                      {proof.description && <Text size="xs" color="muted" style={{ fontFamily: 'var(--font-sans)' }}>{proof.description}</Text>}
                    </Flex>
                  </div>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        )}

        {/* Footer - Terminal Prompt */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.4 }}
          className="pt-6 border-t flex flex-col items-center gap-2 text-center"
          style={{ borderColor: 'oklch(0.18 0.02 150)', fontFamily: 'var(--font-mono)' }}
        >
          <TerminalPrompt text={`unool.dev/@${profile.subdomain} — Built with $`} reducedMotion={reducedMotion} />
          <Flex gap={2} align="center" className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
            <Code className="px-2 py-0.5 rounded" style={{ background: 'oklch(0.12 0.01 150)', border: `1px solid ${accent}30`, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
              Next.js
            </Code>
            <Code className="px-2 py-0.5 rounded" style={{ background: 'oklch(0.12 0.01 150)', border: `1px solid ${accent}30`, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
              React
            </Code>
            <Code className="px-2 py-0.5 rounded" style={{ background: 'oklch(0.12 0.01 150)', border: `1px solid ${accent}30`, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
              Framer Motion
            </Code>
            <Code className="px-2 py-0.5 rounded" style={{ background: 'oklch(0.12 0.01 150)', border: `1px solid ${accent}30`, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
              Tailwind
            </Code>
          </Flex>
        </motion.div>
      </Stack>
    </div>
  );
}

DeveloperTemplate.displayName = 'DeveloperTemplate';