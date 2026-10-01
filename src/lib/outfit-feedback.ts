import type { Outfit } from './outfit-search';
import type { Audience } from './profile';

export type Reaction = 'more' | 'less';
export type FeedbackEntry = {
  id: string;
  reaction: Reaction;
  style: Outfit['style'];
  colors: string[];
  features: string[];
};
export type FeedbackStore = Record<Audience, FeedbackEntry[]>;

export const emptyFeedback = (): FeedbackStore => ({ men: [], women: [] });
const storageKey = 'fitshop_outfit_feedback';
const features = new Set([
  'shirt', 'polo', 'hoodie', 'sweatshirt', 'jumper', 'jeans', 'chinos', 'trousers',
  'shorts', 'skirt', 'dress', 'gown', 'jumpsuit', 'blazer', 'jacket', 'coat',
  'oversized', 'slim', 'wide', 'straight', 'skinny', 'fitted', 'cropped',
]);

function outfitFeatures(outfit: Outfit) {
  const words = outfit.items.filter(item => !['shoe', 'accessory'].includes(item.category))
    .flatMap(item => `${item.name} ${item.garment_type || ''} ${(item.style_details || []).join(' ')}`
      .toLowerCase().split(/[^a-z]+/));
  return [...new Set(words.filter(word => features.has(word)))].slice(0, 12);
}

function signals(outfit: Outfit): FeedbackEntry {
  return {
    id: outfit.id,
    reaction: 'more',
    style: outfit.style,
    colors: [...new Set(outfit.items.map(item => item.color_family))].slice(0, 6),
    features: outfitFeatures(outfit),
  };
}

export function normalizeFeedback(value: unknown): FeedbackEntry[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, FeedbackEntry>();
  for (const item of value.slice(-40)) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Partial<FeedbackEntry>;
    if (typeof entry.id !== 'string' || !entry.id || entry.id.length > 500 ||
        !['more', 'less'].includes(entry.reaction || '') ||
        !['relaxed', 'polished', 'street'].includes(entry.style || '') ||
        !Array.isArray(entry.colors) || !Array.isArray(entry.features)) continue;
    const colors = entry.colors.slice(0, 6).filter((color): color is string => typeof color === 'string' && /^[a-z][a-z -]{0,31}$/.test(color));
    const shape = entry.features.slice(0, 12).filter((feature): feature is string => typeof feature === 'string' && features.has(feature));
    unique.set(entry.id, { id: entry.id, reaction: entry.reaction as Reaction,
      style: entry.style as Outfit['style'], colors, features: shape });
  }
  return [...unique.values()];
}

export function loadFeedback(): FeedbackStore {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return { men: normalizeFeedback(stored.men), women: normalizeFeedback(stored.women) };
  } catch { return emptyFeedback(); }
}

export function saveFeedback(store: FeedbackStore) {
  localStorage.setItem(storageKey, JSON.stringify(store));
}

export function recordFeedback(store: FeedbackStore, audience: Audience, outfit: Outfit, reaction: Reaction): FeedbackStore {
  const previous = store[audience];
  const old = previous.find(entry => entry.id === outfit.id);
  const remaining = previous.filter(entry => entry.id !== outfit.id);
  const next = old?.reaction === reaction ? remaining : [...remaining, { ...signals(outfit), reaction }];
  return { ...store, [audience]: next.slice(-40) };
}

export function feedbackScore(outfit: Outfit, feedback: FeedbackEntry[]): number {
  if (!feedback.length) return 0;
  const current = signals(outfit);
  let score = 0;
  for (const entry of feedback) {
    const sharedColors = current.colors.filter(color => entry.colors.includes(color)).length;
    const sharedFeatures = current.features.filter(feature => entry.features.includes(feature)).length;
    const sameStyle = entry.style === current.style;
    if (sharedFeatures || (sameStyle && sharedColors)) {
      const similarity = (sameStyle ? 2 : 0) + (sharedColors ? 2 : 0)
        + (sharedFeatures ? 3 : 0) + (sharedFeatures > 1 ? 1 : 0);
      score += entry.reaction === 'more' ? similarity : -similarity;
    }
    if (entry.id === outfit.id && entry.reaction === 'more') score += 10;
  }
  return Math.max(-20, Math.min(20, score));
}
