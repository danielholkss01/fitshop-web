export type Audience = 'men' | 'women';
export type Style = 'any' | 'relaxed' | 'polished' | 'street';
export type Occasion = 'any' | 'everyday' | 'work' | 'going-out';

export const styles: { value: Style; label: string }[] = [
  { value: 'any', label: 'Show me options' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'polished', label: 'Polished' },
  { value: 'street', label: 'Street' },
];
export const occasions: { value: Occasion; label: string }[] = [
  { value: 'any', label: 'Any occasion' },
  { value: 'everyday', label: 'Everyday' },
  { value: 'work', label: 'Work' },
  { value: 'going-out', label: 'Going out' },
];
export const colors = ['black', 'white', 'grey', 'navy', 'blue', 'brown', 'tan', 'red', 'green', 'orange', 'yellow', 'purple'] as const;
export type Color = typeof colors[number];

export type Profile = {
  audience: Audience;
  topSize: string;
  bottomSize: string;
  shoeSize: string;
  budget: number;
  style: Style;
  occasion: Occasion;
  preferredColor: Color | 'any';
  avoidedColors: Color[];
};

export const sizes: Record<Audience, { tops: string[]; bottoms: string[]; shoes: string[] }> = {
  men: {
    tops: ['XS', 'S', 'M', 'L', 'XL'],
    bottoms: ['30', '32', '34', '36'],
    shoes: ['UK 8', 'UK 9', 'UK 10'],
  },
  women: {
    tops: ['8', '10', '12', '14', '16'],
    bottoms: ['8', '10', '12', '14', '16'],
    shoes: ['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'],
  },
};

export const defaultProfile: Profile = {
  audience: 'men',
  topSize: 'M',
  bottomSize: '32',
  shoeSize: 'UK 9',
  budget: 200,
  style: 'any',
  occasion: 'any',
  preferredColor: 'any',
  avoidedColors: [],
};

export function profileFor(audience: Audience, budget = 200, preferences: Partial<Profile> = {}): Profile {
  return {
    audience,
    topSize: audience === 'men' ? 'M' : '12',
    bottomSize: audience === 'men' ? '32' : '12',
    shoeSize: audience === 'men' ? 'UK 9' : 'UK 6',
    budget: Number.isFinite(budget) && budget > 0 ? budget : 200,
    style: preferences.style ?? 'any',
    occasion: preferences.occasion ?? 'any',
    preferredColor: preferences.preferredColor ?? 'any',
    avoidedColors: preferences.avoidedColors ?? [],
  };
}

export function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') return defaultProfile;
  const input = value as Partial<Profile>;
  const audience: Audience = input.audience === 'women' ? 'women' : 'men';
  const defaults = profileFor(audience);
  const options = sizes[audience];
  const budget = Number(input.budget);
  const style = styles.find(option => option.value === input.style)?.value ?? 'any';
  const occasion = occasions.find(option => option.value === input.occasion)?.value ?? 'any';
  const colorSet: ReadonlySet<string> = new Set(colors);
  const avoidedColors = Array.isArray(input.avoidedColors)
    ? [...new Set(input.avoidedColors.filter((color): color is Color => typeof color === 'string' && colorSet.has(color)))]
    : [];
  const preferredColor = input.preferredColor && colorSet.has(input.preferredColor) && !avoidedColors.includes(input.preferredColor as Color)
    ? input.preferredColor as Color : 'any';
  return {
    audience,
    topSize: options.tops.includes(input.topSize ?? '') ? input.topSize! : defaults.topSize,
    bottomSize: options.bottoms.includes(input.bottomSize ?? '') ? input.bottomSize! : defaults.bottomSize,
    shoeSize: options.shoes.includes(input.shoeSize ?? '') ? input.shoeSize! : defaults.shoeSize,
    budget: Number.isFinite(budget) && budget > 0 ? budget : defaults.budget,
    style,
    occasion,
    preferredColor,
    avoidedColors,
  };
}

export function loadProfile(): Profile {
  try {
    const saved = localStorage.getItem('fitshop_profile');
    return saved ? normalizeProfile(JSON.parse(saved)) : defaultProfile;
  } catch {
    return defaultProfile;
  }
}
