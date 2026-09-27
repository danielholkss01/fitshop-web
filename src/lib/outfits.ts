import catalog from './catalog.json';
import partnerCatalog from './partner-products.json';
import type { Audience, Color, Occasion, Profile, Style } from './profile';

// Garment type is free text (polo, gown, jeans, etc.); category describes how it is worn.
export type Category = 'top' | 'bottom' | 'one-piece' | 'outerwear' | 'shoe' | 'accessory';
type SpecificStyle = Exclude<Style, 'any'>;
type SpecificOccasion = Exclude<Occasion, 'any'>;
export type Product = {
  id: string;
  audience: Audience | 'unisex';
  category: Category;
  name: string;
  garment_type?: string;
  brand?: string;
  material?: string;
  style_details?: string[];
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
  const shoe = items.find(item => item.category === 'shoe');
  return (distinct.size === 1 ? 5 : distinct.size === 2 ? 4 : 1)
    + (shoe && items.some(item => item !== shoe && item.color_family === shoe.color_family) ? 2 : 0)
    + (profile.preferredColor === 'any' ? 0 : colors.filter(color => color === profile.preferredColor).length * 3);
}

// Complete looks can use separate tops and bottoms or a dress/jumpsuit. Layers are
// optional and only appear when their size, palette, style and budget fit the base.
export function generateOutfits(profile: Profile, products: Product[] = sampleProducts): Outfit[] {
  const budgetPennies = Math.round(profile.budget * 100);
  const selection = products.filter(product => (product.audience === profile.audience || product.audience === 'unisex')
    && !profile.avoidedColors.includes(product.color_family)
    && product.style_tags?.length && product.occasion_tags?.length);
  const eligible = (category: Category, size: string) => selection.filter(product => product.category === category && product.sizes.includes(size)
    && (profile.style === 'any' || product.style_tags.includes(profile.style))
    && (profile.occasion === 'any' || product.occasion_tags.includes(profile.occasion)));
  const tops = eligible('top', profile.topSize);
  const bottoms = eligible('bottom', profile.bottomSize);
  const onePieces = eligible('one-piece', profile.topSize);
  const outerwear = eligible('outerwear', profile.topSize);
  const shoes = eligible('shoe', profile.shoeSize);
  const accessories = selection.filter(product => product.category === 'accessory');
  const candidates: { outfit: Outfit; score: number }[] = [];

  const compatible = (items: Product[]) => items.every((item, index) =>
    items.slice(index + 1).every(other => worksWith(item.color_family, other.color_family)));

  function addLooks(base: Product[]) {
    if (!compatible(base)) return;
    for (const layer of [undefined, ...outerwear.filter(item => compatible([...base, item]))]) {
      const core = layer ? [...base, layer] : base;
      const style = profile.style === 'any' ? styleOrder.find(tag => core.every(item => item.style_tags.includes(tag))) : profile.style;
      const occasion = profile.occasion === 'any' ? occasionOrder.find(tag => core.every(item => item.occasion_tags.includes(tag))) : profile.occasion;
      if (!style || !occasion || !core.every(item => item.style_tags.includes(style) && item.occasion_tags.includes(occasion))) continue;
      const basePrice = core.reduce((sum, item) => sum + item.price_pennies, 0);
      if (basePrice > budgetPennies) continue;
      const accessory = accessories.filter(item => item.style_tags.includes(style) && item.occasion_tags.includes(occasion)
        && core.every(piece => worksWith(item.color_family, piece.color_family))
        && basePrice + item.price_pennies <= budgetPennies)
        .sort((a, b) => (Number(b.color_family === profile.preferredColor) - Number(a.color_family === profile.preferredColor))
          || a.price_pennies - b.price_pennies || a.id.localeCompare(b.id))[0];
      const items = accessory ? [...core, accessory] : core;
      const colors = [...new Set(core.map(item => item.color_family))];
      candidates.push({
        outfit: {
          id: core.map(item => item.id).join(':'),
          items,
          total_price: items.reduce((sum, item) => sum + item.price_pennies, 0),
          style,
          reason: `${style[0].toUpperCase() + style.slice(1)} pieces for ${occasionDescription[occasion]}, in ${colors.join(', ')}.`,
        },
        score: paletteScore(core, profile),
      });
    }
  }

  for (const shoe of shoes) {
    for (const onePiece of onePieces) addLooks([onePiece, shoe]);
    for (const top of tops) {
      for (const bottom of bottoms) {
        addLooks([top, bottom, shoe]);
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score || a.outfit.total_price - b.outfit.total_price
    || a.outfit.id.localeCompare(b.outfit.id)).map(candidate => candidate.outfit);
}
