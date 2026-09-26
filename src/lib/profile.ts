export type Audience = 'men' | 'women';

export type Profile = {
  audience: Audience;
  topSize: string;
  bottomSize: string;
  shoeSize: string;
  budget: number;
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
};

export function profileFor(audience: Audience, budget = 200): Profile {
  return {
    audience,
    topSize: audience === 'men' ? 'M' : '12',
    bottomSize: audience === 'men' ? '32' : '12',
    shoeSize: audience === 'men' ? 'UK 9' : 'UK 6',
    budget: Number.isFinite(budget) && budget > 0 ? budget : 200,
  };
}

export function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') return defaultProfile;
  const input = value as Partial<Profile>;
  const audience: Audience = input.audience === 'women' ? 'women' : 'men';
  const defaults = profileFor(audience);
  const options = sizes[audience];
  const budget = Number(input.budget);
  return {
    audience,
    topSize: options.tops.includes(input.topSize ?? '') ? input.topSize! : defaults.topSize,
    bottomSize: options.bottoms.includes(input.bottomSize ?? '') ? input.bottomSize! : defaults.bottomSize,
    shoeSize: options.shoes.includes(input.shoeSize ?? '') ? input.shoeSize! : defaults.shoeSize,
    budget: Number.isFinite(budget) && budget > 0 ? budget : defaults.budget,
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
