/**
 * Audience Demand Radar
 *
 * Clusters real inbound Instagram comments and DMs into recurring audience
 * questions, objections, and product requests so creators know EXACTLY
 * what post/Reel to make next (1-click "Draft in Studio").
 */

export interface DemandCluster {
  id: string;
  topic: string;
  category: 'pricing' | 'how_to' | 'resource' | 'objection' | 'feature_request' | 'general';
  count: number;
  sampleMessages: string[];
  suggestedPostHook: string;
  suggestedKeyword: string;
}

interface RawAudienceMessage {
  text: string;
  classification?: string | null;
  createdAt?: string | null;
}

const TOPIC_BUCKETS: Array<{
  id: string;
  topic: string;
  category: DemandCluster['category'];
  pattern: RegExp;
  suggestedPostHook: string;
  suggestedKeyword: string;
}> = [
  {
    id: 'pricing_cost',
    topic: 'Pricing, Plans & ROI Questions',
    category: 'pricing',
    pattern: /\b(price|pricing|cost|how\s+much|expensive|worth\s+it|discount|coupon|free\s+trial|kitna|kitne)\b/i,
    suggestedPostHook: 'Everyone keeps asking what this actually costs — here is the full honest breakdown (and when it is NOT worth it).',
    suggestedKeyword: 'PRICING',
  },
  {
    id: 'step_by_step',
    topic: 'Step-by-Step Setup & Workflow',
    category: 'how_to',
    pattern: /\b(how\s+(?:do|did|to|can)|tutorial|walkthrough|setup|set\s+up|workflow|beginner|start|kaise)\b/i,
    suggestedPostHook: 'You asked how to set this up from scratch — here is the exact 3-step blueprint in 45 seconds.',
    suggestedKeyword: 'STEPS',
  },
  {
    id: 'templates_tools',
    topic: 'Templates, Links & Tool Stack Requests',
    category: 'resource',
    pattern: /\b(link|template|pdf|guide|checklist|notion|sheet|tool|app|software|send\s+it|bhejo|resource)\b/i,
    suggestedPostHook: 'I bundled every single template and tool you asked for in the comments into one free vault.',
    suggestedKeyword: 'VAULT',
  },
  {
    id: 'agency_clients',
    topic: 'Client Work, Agency & Team Scaling',
    category: 'feature_request',
    pattern: /\b(agency|client|clients|team|multiple\s+accounts|b2b|freelance|scale|retainer)\b/i,
    suggestedPostHook: 'How agencies are using this exact workflow to deliver 3x faster client results without adding headcount.',
    suggestedKeyword: 'AGENCY',
  },
  {
    id: 'trust_objections',
    topic: 'Skepticism, Safety & Results Proof',
    category: 'objection',
    pattern: /\b(does\s+it\s+actually|real|proof|ban|shadowban|safe|work\s+for\s+small|no\s+followers|guarantee)\b/i,
    suggestedPostHook: 'Does this actually work if you have under 1,000 followers? Let us look at the real numbers.',
    suggestedKeyword: 'PROOF',
  },
  {
    id: 'collab_coaching',
    topic: '1:1 Help, Coaching & Partnerships',
    category: 'pricing',
    pattern: /\b(coach|coaching|mentor|call|consult|collab|partner|sponsor|hire\s+you|work\s+with\s+you)\b/i,
    suggestedPostHook: 'Opening 3 spots this month for creators who want us to build this system side-by-side.',
    suggestedKeyword: 'APPLY',
  },
];

export function buildDemandRadarClusters(messages: RawAudienceMessage[]): DemandCluster[] {
  const buckets = new Map<
    string,
    { meta: (typeof TOPIC_BUCKETS)[number]; samples: string[]; count: number }
  >();

  for (const msg of messages) {
    const text = (msg.text || '').trim();
    if (text.length < 4) continue;

    for (const def of TOPIC_BUCKETS) {
      if (def.pattern.test(text)) {
        const entry = buckets.get(def.id) || { meta: def, samples: [], count: 0 };
        entry.count += 1;
        if (entry.samples.length < 3 && !entry.samples.includes(text)) {
          entry.samples.push(text.slice(0, 140));
        }
        buckets.set(def.id, entry);
        break;
      }
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ meta, samples, count }) => ({
      id: meta.id,
      topic: meta.topic,
      category: meta.category,
      count,
      sampleMessages: samples,
      suggestedPostHook: meta.suggestedPostHook,
      suggestedKeyword: meta.suggestedKeyword,
    }));
}
