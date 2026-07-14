'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, CheckCircle, Edit, X, Sparkles, Send, AlertCircle } from 'lucide-react';

type Platform = 'linkedin' | 'x' | 'threads';
type DraftStatus = 'idle' | 'generating' | 'ready' | 'publishing' | 'published' | 'error';

interface PlatformDraft {
  platform: Platform;
  content: string;
  characterCount: number;
  maxChars: number;
  hashtags: string[];
  mediaSuggestions: string[];
  status: DraftStatus;
  error?: string;
}

const PLATFORM_CONFIG: Record<Platform, { icon: React.ElementType; name: string; maxChars: number; color: string; }> = {
  linkedin: { icon: Linkedin, name: 'LinkedIn', maxChars: 3000, color: 'bg-blue-600' },
  x: { icon: Twitter, name: 'X (Twitter)', maxChars: 280, color: 'bg-gray-800' },
  threads: { icon: MessageSquare, name: 'Threads', maxChars: 500, color: 'bg-black' },
};

export default function PublishPage() {
  const [sourceContent, setSourceContent] = useState('');
  const [drafts, setDrafts] = useState<PlatformDraft[]>([
    { platform: 'linkedin', content: '', characterCount: 0, maxChars: 3000, hashtags: [], mediaSuggestions: [], status: 'idle' },
    { platform: 'x', content: '', characterCount: 0, maxChars: 280, hashtags: [], mediaSuggestions: [], status: 'idle' },
    { platform: 'threads', content: '', characterCount: 0, maxChars: 500, hashtags: [], mediaSuggestions: [], status: 'idle' },
  ]);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'generating' | 'ready' | 'publishing'>('idle');
  const [caseStudyMode, setCaseStudyMode] = useState(false);

  const generateDrafts = async () => {
    if (!sourceContent.trim()) return;

    setGlobalStatus('generating');
    setDrafts(d => d.map(d => ({ ...d, status: 'generating' })));

    // Simulate AI generation
    await new Promise(r => setTimeout(r, 3000));

    const mockDrafts: PlatformDraft[] = [
      {
        platform: 'linkedin',
        content: `${sourceContent}\n\n🚀 Excited to share our latest milestone at DataFlow!\n\nKey metrics:\n• $2.4M ARR (up 40% YoY)\n• 500+ companies onboarded\n• Team grown to 12 amazing people\n\nBuilding the future of data infrastructure, one pipeline at a time. 💪\n\n#DataInfrastructure #SaaS #StartupLife #BuildingInPublic`,
        characterCount: 0,
        maxChars: 3000,
        hashtags: ['#DataInfrastructure', '#SaaS', '#StartupLife', '#BuildingInPublic'],
        mediaSuggestions: ['Team photo', 'Product screenshot', 'Metrics dashboard'],
        status: 'ready',
      },
      {
        platform: 'x',
        content: `Just launched v2 of DataFlow! 🚀\n\n$2.4M ARR • 500+ customers • 12 person team\n\nBuilding the future of data infrastructure 🔥\n\n#SaaS #DataEngineering #Startup`,
        characterCount: 0,
        maxChars: 280,
        hashtags: ['#SaaS', '#DataEngineering', '#Startup'],
        mediaSuggestions: ['Launch graphic', 'Metrics chart'],
        status: 'ready',
      },
      {
        platform: 'threads',
        content: `Just launched v2 of DataFlow! 🚀\n\n$2.4M ARR • 500+ customers • 12 person team\n\nBuilding the future of data infrastructure 🔥`,
        characterCount: 0,
        maxChars: 500,
        hashtags: [],
        mediaSuggestions: ['Behind-the-scenes photo'],
        status: 'ready',
      },
    ];

    setDrafts(mockDrafts.map(d => ({
      ...d,
      characterCount: d.content.length,
    })));
    setGlobalStatus('ready');
  };

  const updateDraft = (platform: Platform, content: string) => {
    setDrafts(d => d.map(d => d.platform === platform ? { ...d, content, characterCount: content.length } : d));
  };

  const publishAll = async () => {
    const readyDrafts = drafts.filter(d => d.status === 'ready');
    if (readyDrafts.length === 0) return;

    setGlobalStatus('publishing');
    setDrafts(d => d.map(d => d.status === 'ready' ? { ...d, status: 'publishing' } : d));

    // Simulate publishing
    await new Promise(r => setTimeout(r, 2000));

    setDrafts(d => d.map(d => d.status === 'publishing' ? { ...d, status: 'published' } : d));
    setGlobalStatus('ready');

    // Show success toast (would use sonner in real app)
    alert('Published successfully!');
  };

  const handleAction = (type: 'accept' | 'edit' | 'reject' | 'replace', platform: Platform) => {
    // In real app, this would trigger appropriate action
    console.log(`${type} for ${platform}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Publish (One Click)</h1>
          <p className="text-muted-foreground">Write once. AI adapts. You approve. One click publishes everywhere.</p>
        </div>
        <Button onClick={publishAll} disabled={globalStatus !== 'ready' || !drafts.some(d => d.status === 'ready')} size="lg">
          <Send className="mr-2 h-4 w-4" />
          {globalStatus === 'publishing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish All'
          )}
        </Button>
      </div>

      {/* Source Input */}
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateDrafts} disabled={globalStatus === 'generating' || !sourceContent.trim()}>
              {globalStatus === 'generating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adapting for 3 Platforms...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Platform Drafts
                </>
              )}
            </Button>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={caseStudyMode} onChange={e => setCaseStudyMode(e.target.checked)} className="rounded" />
              <span>Also add to profile as case study</span>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Platform Drafts */}
      {globalStatus !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Step 2: Review & Edit ({drafts.filter(d => d.status === 'ready').length} ready)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {drafts.map((draft) => {
                const config = PLATFORM_CONFIG[draft.platform];
                const Icon = config.icon;
                const isOverLimit = draft.characterCount > draft.maxChars;

                return (
                  <div key={draft.platform} className="border rounded-xl p-4 bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-lg ${config.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-semibold">{config.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {draft.characterCount}/{draft.maxChars} characters
                            {draft.hashtags.length > 0 && ` • ${draft.hashtags.length} hashtags`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          draft.status === 'ready' ? 'default' :
                          draft.status === 'generating' ? 'secondary' :
                          draft.status === 'publishing' ? 'outline' :
                          draft.status === 'published' ? 'default' : 'destructive'
                        }
                      >
                        {draft.status === 'generating' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {draft.status === 'publishing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                      </Badge>
                    </div>

                    <Textarea
                      value={draft.content}
                      onChange={e => updateDraft(draft.platform, e.target.value)}
                      className={`min-h-[120px] ${isOverLimit ? 'border-destructive' : ''}`}
                      rows={5}
                      disabled={draft.status !== 'ready'}
                    />

                    {isOverLimit && (
                      <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Over character limit by {draft.characterCount - draft.maxChars} characters
                      </p>
                    )}

                    {draft.hashtags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {draft.hashtags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    {draft.mediaSuggestions.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <span>Media suggestions: {draft.mediaSuggestions.join(', ')}</span>
                        <Button variant="ghost" size="sm">Add Media</Button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <Separator className="my-4" />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAction('accept', draft.platform)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Accept AI Draft
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAction('edit', draft.platform)}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit Manually
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAction('reject', draft.platform)}>
                        <X className="mr-1 h-3 w-3" />
                        Reject AI
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAction('replace', draft.platform)}>
                        Write My Own
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Study Option */}
      {caseStudyMode && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Case study will be added to your profile</p>
              <p className="text-sm text-green-700">
                After publishing, this post will appear in your profile&apos;s case study carousel with metrics and links.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}