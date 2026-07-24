'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Flex, Box, Stack, Grid } from '@/components/ui/layout';
import { Text, Heading } from '@/components/ui/typography';
import { MagneticCard } from '@/components/ui/3d/MagneticCard';
import { OrbitalBackground } from '@/components/ui/3d/OrbitalBackground';
import { ProfilePreview } from './ProfilePreview';
import type { TemplateMeta } from './templates/types';
import { TEMPLATE_REGISTRY, getTemplatesByCategory } from './templates/registry';
import { X, ChevronRight, ExternalLink, Check } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onSelect: (templateId: string) => void;
  className?: string;
  inline?: boolean;
  profileData?: any;
}

const CATEGORIES: Array<{ id: TemplateMeta['category']; name: string; icon: string; description: string }> = [
  { id: 'essential', name: 'Essential', icon: '📄', description: 'Clean, whitespace-driven, content-first' },
  { id: 'professional', name: 'Professional', icon: '💼', description: 'Structured, trust signals, clear hierarchy' },
  { id: 'creative', name: 'Creative', icon: '🎨', description: 'Asymmetric, expressive, personality-led' },
  { id: 'technical', name: 'Technical', icon: '💻', description: 'Monospace, terminal aesthetic, data-dense' },
  { id: 'social', name: 'Social', icon: '🔗', description: 'Feed-like, visual, link-heavy' },
];

function CategoryBadge({ category, isActive, onClick }: { category: typeof CATEGORIES[0]; isActive: boolean; onClick: () => void }) {
  return (
    <Badge
      variant={isActive ? 'default' : 'outline'}
      className={cn(
        'gap-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer',
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
      )}
      onClick={onClick}
    >
      <span className="text-lg">{category.icon}</span>
      <span>{category.name}</span>
    </Badge>
  );
}

function IntensityBadge({ intensity }: { intensity: TemplateMeta['intensity'] }) {
  const labels = {
    minimal: 'Minimal',
    light: 'Light',
    standard: 'Standard',
    bold: 'Bold',
    max: 'Max',
  };
  const variants = {
    minimal: 'secondary' as const,
    light: 'outline' as const,
    standard: 'default' as const,
    bold: 'destructive' as const,
    max: 'success' as const,
  };
  return (
    <Badge variant={variants[intensity]} className="text-xs capitalize">
      {labels[intensity]}
    </Badge>
  );
}

export function TemplateSelector({
  selectedTemplate,
  onSelect,
  className,
  inline = false,
  profileData,
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = React.useState<TemplateMeta['category']>('essential');
  const [previewTemplate, setPreviewTemplate] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(!inline);

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    if (inline) {
      setPreviewTemplate(templateId);
    } else {
      setIsModalOpen(false);
    }
  };

  const handlePreview = (templateId: string) => {
    setPreviewTemplate(templateId);
  };

  const templates = getTemplatesByCategory(activeCategory);
  const selected = TEMPLATE_REGISTRY.find(t => t.id === selectedTemplate);

  if (inline) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <CategoryBadge
              key={cat.id}
              category={cat}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>

        {/* Template Grid */}
        <Grid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} gap={4} className="max-h-[600px] overflow-y-auto pr-2">
          {templates.map((template) => (
            <MagneticCard
              key={template.id}
              className={cn(
                'relative p-4 cursor-pointer transition-all',
                selectedTemplate === template.id
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'bg-card hover:bg-accent/50'
              )}
              onClick={() => handleSelect(template.id)}
              onMouseEnter={() => handlePreview(template.id)}
            >
              <Stack space={3}>
                <Flex between>
                  <Text weight="medium" size="sm">{template.name}</Text>
                  <IntensityBadge intensity={template.intensity} />
                </Flex>
                <Text size="xs" color="muted" className="line-clamp-2">
                  {template.description}
                </Text>
                <Flex gap={2} className="flex-wrap">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </Flex>
                {selectedTemplate === template.id && (
                  <Flex between className="pt-2 border-t">
                    <Badge variant="success" className="gap-1 text-xs">
                      <Check className="h-3 w-3" />
                      Selected
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onMouseDown={e => e.stopPropagation()}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Flex>
                )}
              </Stack>
            </MagneticCard>
          ))}
        </Grid>

        {/* Live Preview Panel */}
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <Flex between>
                  <Flex align="center" gap={2}>
                    <Heading level={4}>Live Preview</Heading>
                    <IntensityBadge
                      intensity={TEMPLATE_REGISTRY.find(t => t.id === previewTemplate)?.intensity || 'standard'}
                    />
                  </Flex>
                  <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </Flex>
              </CardHeader>
              <CardContent className="p-0 aspect-video min-h-[400px]">
                <ProfilePreview
                  templateId={previewTemplate}
                  profile={profileData || {
                    id: 'preview',
                    subdomain: 'preview',
                    name: 'Preview User',
                    headline: 'Preview your template',
                    bio: 'This is a live preview of how your profile will look.',
                    avatarUrl: '',
                    links: [
                      { id: '1', label: 'Twitter', url: 'https://twitter.com', icon: 'twitter', clicks: 0, order: 0, isVisible: true },
                      { id: '2', label: 'GitHub', url: 'https://github.com', icon: 'github', clicks: 0, order: 1, isVisible: true },
                      { id: '3', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', clicks: 0, order: 2, isVisible: true },
                    ],
                    proofs: [],
                    theme: { template: previewTemplate, preset: '', accentColor: '', customCss: null },
                    socialHandles: {},
                    seo: { title: '', description: '', image: null },
                  }}
                  isPreview={true}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selected && !previewTemplate && (
          <Card variant="filled" className="border-primary/30">
            <CardContent className="flex items-center gap-4 p-4">
              <Badge variant="success" className="gap-2">
                <Check className="h-4 w-4" />
                <Text size="sm" weight="medium">Selected: {selected.name}</Text>
              </Badge>
              <Text size="sm" color="muted" className="flex-1">
                {selected.description}
              </Text>
              <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(selectedTemplate!)}>
                Preview
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Modal version
  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <OrbitalBackground className="absolute inset-0 -z-10 opacity-30" count={8} speed={0.3} />
            <div className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="bg-background/80 backdrop-blur">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b bg-background/50 backdrop-blur">
                <Flex between className="mb-4">
                  <div>
                    <Heading>Choose Your Template</Heading>
                    <Text color="muted" size="sm">Select a style that matches your vibe. Preview updates instantly.</Text>
                  </div>
                  {selectedTemplate && (
                    <Badge variant="success" className="gap-2">
                      <Check className="h-3 w-3" />
                      {TEMPLATE_REGISTRY.find(t => t.id === selectedTemplate)?.name} selected
                    </Badge>
                  )}
                </Flex>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {CATEGORIES.map((cat) => (
                    <CategoryBadge
                      key={cat.id}
                      category={cat}
                      isActive={activeCategory === cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Template List */}
                <div className="w-full md:w-3/5 flex flex-col overflow-hidden">
                  <div className="p-4 overflow-y-auto flex-1">
                    <Grid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} gap={4}>
                      {templates.map((template) => (
                        <MagneticCard
                          key={template.id}
                          className={cn(
                            'relative p-4 cursor-pointer transition-all min-h-[280px] flex flex-col',
                            selectedTemplate === template.id
                              ? 'ring-2 ring-primary bg-primary/5'
                              : 'bg-card hover:bg-accent/50'
                          )}
                          onClick={() => handleSelect(template.id)}
                          onMouseEnter={() => handlePreview(template.id)}
                        >
                          <Stack space={3} className="flex-1 flex">
                            <Flex between>
                              <Text weight="medium" size="sm">{template.name}</Text>
                              <IntensityBadge intensity={template.intensity} />
                            </Flex>
                            <Text size="xs" color="muted" className="line-clamp-2 flex-1">
                              {template.description}
                            </Text>
                            <Flex gap={2} className="flex-wrap">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </Flex>
                            {selectedTemplate === template.id && (
                              <Flex between className="pt-2 border-t mt-auto">
                                <Badge variant="success" className="gap-1 text-xs">
                                  <Check className="h-3 w-3" />
                                  Selected
                                </Badge>
                              </Flex>
                            )}
                          </Stack>
                        </MagneticCard>
                      ))}
                    </Grid>
                  </div>
                </div>

                {/* Preview Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative w-full md:w-2/5 border-l hidden md:block"
                >
                  {previewTemplate ? (
                    <>
                      <div className="p-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10">
                        <Flex between>
                          <Flex align="center" gap={2}>
                            <Heading level={4}>Live Preview</Heading>
                            <IntensityBadge
                              intensity={TEMPLATE_REGISTRY.find(t => t.id === previewTemplate)?.intensity || 'standard'}
                            />
                          </Flex>
                          <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </Flex>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <ProfilePreview
                          templateId={previewTemplate}
                          profile={profileData || {
                            id: 'preview',
                            subdomain: 'preview',
                            name: 'Preview User',
                            headline: 'Preview your template',
                            bio: 'This is a live preview of how your profile will look.',
                            avatarUrl: '',
                            links: [
                              { id: '1', label: 'Twitter', url: 'https://twitter.com', icon: 'twitter', clicks: 0, order: 0, isVisible: true },
                              { id: '2', label: 'GitHub', url: 'https://github.com', icon: 'github', clicks: 0, order: 1, isVisible: true },
                              { id: '3', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', clicks: 0, order: 2, isVisible: true },
                            ],
                            proofs: [],
                            theme: { template: previewTemplate, preset: '', accentColor: '', customCss: null },
                            socialHandles: {},
                            seo: { title: '', description: '', image: null },
                          }}
                          isPreview={true}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full p-8 text-center">
                      <Card variant="empty">
                        <CardContent className="text-center">
                          <div className="text-6xl mb-4">👆</div>
                          <Heading>Hover a template</Heading>
                          <Text color="muted" className="mt-2">
                            Move your mouse over any template card to see a live preview here.
                          </Text>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-background/50 backdrop-blur">
                <Flex end gap={3}>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSelect(previewTemplate || selectedTemplate || 'essential-standard')} disabled={!previewTemplate && !selectedTemplate}>
                    Apply Template
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Flex>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

TemplateSelector.displayName = 'TemplateSelector';