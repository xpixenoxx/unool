'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Loader2, Sparkles, Send, X, Linkedin, Twitter, MessageSquare } from 'lucide-react';
import { PostAdapter, type PlatformType, type AdaptedPost } from '@/lib/ai/PostAdapter';

const PLATFORM_CONFIG: Record<PlatformType, { icon: React.ElementType; name: string; maxChars: number; color: string }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black' },
};

interface PlatformDraft {
  platform: PlatformType;
  content: string;
  characterCount: number;
  hashtags: string[];
  status: 'idle' | 'generating' | 'ready' | 'error';
  error?: string;
}

export default function ComposerPage() {
  const [sourceContent, setSourceContent] = useState('');
  const [drafts, setDrafts] = useState<PlatformDraft[]>([
    { platform: 'linkedin', content: '', characterCount: 0, hashtags: [], status: 'idle' },
    { platform: 'x', content: '', characterCount: 0, hashtags: [], status: 'idle' },
    { platform: 'threads', content: '', characterCount: 0, hashtags: [], status: 'idle' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<PlatformType>('linkedin');

  const generateDrafts = async () => {
    if (!sourceContent.trim()) return;

    setIsGenerating(true);
    setDrafts(d => d.map(d => ({ ...d, status: 'generating' })));

    try {
      const results = await PostAdapter.adaptForAllPlatforms(sourceContent, {
        profileName: 'Founder',
        profileHeadline: 'Founder at Startup',
      });

      const platforms: PlatformType[] = ['linkedin', 'x', 'threads'];
      setDrafts(platforms.map(platform => {
        const result = results[platform];
        if (result.ok) {
          const adapted: AdaptedPost = result.value;
          return {
            platform,
            content: adapted.content,
            characterCount: adapted.characterCount,
            hashtags: adapted.hashtags,
            status: 'ready' as const,
          };
        } else {
          return {
            platform,
            content: '',
            characterCount: 0,
            hashtags: [],
            status: 'error' as const,
            error: result.error.message,
          };
        }
      }));
    } catch (error) {
      console.error('Failed to generate drafts:', error);
      setDrafts(d => d.map(d => ({ ...d, status: 'error', error: 'Failed to generate draft' })));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateDraft = (platform: PlatformType, content: string) => {
    setDrafts(d => d.map(item =>
      item.platform === platform ? { ...item, content, characterCount: content.length } : item
    ));
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Composer</h1>
          <p className="text-muted-foreground">Write once. AI adapts. You review. One click publishes everywhere.</p>
        </div>
        <Button
          onClick={generateDrafts}
          disabled={isGenerating || !sourceContent.trim()}
          size="lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adapting for 3 Platforms...
            </>
          ) : (
            'Generate Platform Drafts'
          )}
        </Button>
      </div>

      {/* Step 1: Source Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Step 1: Write Your Idea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What do you want to share? e.g., 'Just launched v2 of our product with new AI features...'"
            value={sourceContent}
            onChange={e => setSourceContent(e.target.value)}
            className="min-h-[120px] mb-4"
            rows={4}
          />
          <div className="text-sm text-muted-foreground">
            {sourceContent.length} characters
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Platform Drafts */}
      {drafts.some(d => d.status !== 'idle') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Step 2: Review & Edit ({drafts.filter(d => d.status === 'ready').length} ready)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as PlatformType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {(['linkedin', 'x', 'threads'] as const).map(platform => {
                  const config = PLATFORM_CONFIG[platform];
                  const draft = drafts.find(d => d.platform === platform);
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={platform} value={platform} className="flex items-center justify-center gap-2">
                      <span className={`p-1.5 rounded-lg ${config.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span>{config.name}</span>
                      {draft?.status === 'generating' && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      )}
                      {draft?.status === 'ready' && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                      {draft?.status === 'error' && (
                        <X className="h-3 w-3 text-destructive" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(['linkedin', 'x', 'threads'] as PlatformType[]).map(platform => {
                const config = PLATFORM_CONFIG[platform];
                const draft = drafts.find(d => d.platform === platform);
                const Icon = config.icon;
                const isOverLimit = draft && draft.characterCount > config.maxChars;

                return (
                  <TabsContent key={platform} value={platform} className="mt-4 space-y-4">
                    <div className="border rounded-xl p-4 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`p-2 rounded-lg ${config.color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </span>
                          <div>
                            <h3 className="font-semibold">{config.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {draft?.characterCount ?? 0}/{config.maxChars} characters
                              {draft && draft.hashtags.length > 0 && ` • ${draft.hashtags.length} hashtags`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {draft && [
                            { status: 'generating' as const, label: 'Generating...', variant: 'secondary' as const },
                            { status: 'ready' as const, label: 'Ready', variant: 'default' as const },
                            { status: 'error' as const, label: 'Error', variant: 'destructive' as const },
                          ].map(s => draft.status === s.status && (
                            <Badge key={s.status} variant={s.variant}>{s.label}</Badge>
                          ))}
                        </div>
                      </div>

                      {draft?.error && (
                        <div className="text-sm text-destructive mb-4">{draft.error}</div>
                      )}

                      <Textarea
                        value={draft?.content ?? ''}
                        onChange={e => updateDraft(platform, e.target.value)}
                        className={`min-h-[120px] ${isOverLimit ? 'border-destructive' : ''}`}
                        rows={5}
                        disabled={draft?.status !== 'ready'}
                        placeholder={draft?.status === 'generating' ? 'Generating...' : draft?.status === 'idle' ? 'Generate drafts first' : 'Your adapted content will appear here'}
                      />

                      {draft && isOverLimit && (
                        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Over character limit by {draft.characterCount - config.maxChars} characters
                        </p>
                      )}

                      {draft && draft.hashtags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {draft.hashtags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // In real app, this would regenerate just this platform
                          generateDrafts();
                        }}
                        disabled={draft?.status !== 'ready'}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        Regenerate
                      </Button>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Publish */}
      {drafts.some(d => d.status === 'ready') && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Ready to Publish</p>
                  <p className="text-sm text-green-700">
                    {drafts.filter(d => d.status === 'ready').length} platform drafts reviewed and ready
                  </p>
                </div>
              </div>
              <Button size="lg" onClick={() => alert('Publish functionality coming in Week 4!')}>
                <Send className="mr-2 h-4 w-4" />
                Publish All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}