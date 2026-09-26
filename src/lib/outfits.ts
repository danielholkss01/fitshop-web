import catalog from './catalog.json';
import partnerCatalog from './partner-products.json';
import type { Audience, Color, Occasion, Profile, Style } from './profile';

export type Category = 'top' | 'bottom' | 'shoe' | 'accessory';
type SpecificStyle = Exclude<Style, 'any'>;
type SpecificOccasion = Exclude<Occasion, 'any'>;
export type Product = {
  id: string;
  audience: Audience;
  category: Category;
  name: string;
  price_pennies: number;
  color_family: Color;
  sizes: string[];
  style_tags: SpecificStyle[];
  occasion_tags: SpecificOccasion[];
  retailer?: string;
  product_url?: string;
  image_url?: string;
  updated_at?: string;
};
export type Outfit = { id: string; total_price: number; items: Product[]; style: SpecificStyle; reason: string };

const sampleProducts = catalog.products as Product[];
const partnerProducts = partnerCatalog.products as Product[];
const maxFeedAge = 7 * 24 * 60 * 60 * 1000;
const styleOrder: SpecificStyle[] = ['relaxed', 'polished', 'street'];
const occasionOrder: SpecificOccasion[] = ['everyday', 'work', 'going-out'];
const occasionDescription: Record<SpecificOccasion, string> = {
  everyday: 'everyday wear', work: 'work', 'going-out': 'going out',
};

export function currentPartnerProducts(): Product[] {
  return partnerProducts.filter(product => {
    const age = product.updated_at ? Date.now() - Date.parse(product.updated_at) : NaN;
    return Boolean(product.product_url && product.image_url && age >= 0 && age < maxFeedAge);
  });
}

const neutral = new Set(['black', 'white', 'grey', 'navy', 'tan', 'brown']);
const complements: Record<string, string> = {
  blue: 'orange', red: 'green', yellow: 'purple', green: 'red', orange: 'blue', purple: 'yellow',
};

function worksWith(a: string, b: string) {
  return neutral.has(a) || neutral.has(b) || a === b || complements[a] === b;
}

function paletteScore(items: Product[], profile: Profile) {
  const colors = items.map(item => item.color_family);
  const distinct = new Set(colors);
  return (distinct.size === 1 ? 5 : distinct.size === 2 ? 4 : 1)
    + (colors[2] === colors[0] || colors[2] === colors[1] ? 2 : 0)
    + (profile.preferredColor === 'any' ? 0 : colors.filter(color => color === profile.preferredColor).length * 3);
}

// Generate every complete, tagged, size-appropriate look. The API pages the ranked list;
// there is no fixed number of looks, only the combinations in the current catalogue.
export function generateOutfits(profile: Profile, products: Product[] = sampleProducts): Outfit[] {
  const budgetPennies = Math.round(profile.budget * 100);
  const selection = products.filter(product => product.audience === profile.audience
    && !profile.avoidedColors.includes(product.color_family)
    && product.style_tags?.length && product.occasion_tags?.length);
  const eligible = (category: Category, size: string) => selection.filter(product => product.category === category && product.sizes.includes(size)
    && (profile.style === 'any' || product.style_tags.includes(profile.style))
    && (profile.occasion === 'any' || product.occasion_tags.includes(profile.occasion)));
  const tops = eligible('top', profile.topSize);
  const bottoms = eligible('bottom', profile.bottomSize);
  const shoes = eligible('shoe', profile.shoeSize);
  const accessories = selection.filter(product => product.category === 'accessory');
  const candidates: { outfit: Outfit; score: number }[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!worksWith(top.color_family, bottom.color_family)) continue;
      for (const shoe of shoes) {
        const base = [top, bottom, shoe];
        if (!worksWith(top.color_family, shoe.color_family) || !worksWith(bottom.color_family, shoe.color_family)) continue;
        const style = profile.style === 'any' ? styleOrder.find(tag => base.every(item => item.style_tags.includes(tag))) : profile.style;
        const occasion = profile.occasion === 'any' ? occasionOrder.find(tag => base.every(item => item.occasion_tags.includes(tag))) : profile.occasion;
        if (!style || !occasion || !base.every(item => item.style_tags.includes(style) && item.occasion_tags.includes(occasion))) continue;
        const basePrice = base.reduce((sum, item) => sum + item.price_pennies, 0);
        if (basePrice > budgetPennies) continue;

        const accessory = accessories.filter(item => item.style_tags.includes(style) && item.occasion_tags.includes(occasion)
          && base.every(piece => worksWith(item.color_family, piece.color_family))
          && basePrice + item.price_pennies <= budgetPennies)
          .sort((a, b) => (Number(b.color_family === profile.preferredColor) - Number(a.color_family === profile.preferredColor))
            || a.price_pennies - b.price_pennies || a.id.localeCompare(b.id))[0];
        const items = accessory ? [...base, accessory] : base;
        const colors = [...new Set(base.map(item => item.color_family))];
        candidates.push({
          outfit: {
            id: base.map(item => item.id).join(':'),
            items,
            total_price: items.reduce((sum, item) => sum + item.price_pennies, 0),
            style,
            reason: `${style[0].toUpperCase() + style.slice(1)} pieces for ${occasionDescription[occasion]}, in ${colors.join(', ')}.`,
          },
          score: paletteScore(base, profile),
        });
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score || a.outfit.total_price - b.outfit.total_price
    || a.outfit.id.localeCompare(b.outfit.id)).map(candidate => candidate.outfit);
}
