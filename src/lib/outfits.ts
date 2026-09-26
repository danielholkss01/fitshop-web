import catalog from './catalog.json';
import partnerCatalog from './partner-products.json';
import type { Audience, Profile } from './profile';

export type Category = 'top' | 'bottom' | 'shoe' | 'accessory';
export type Product = {
  id: string;
  audience: Audience;
  category: Category;
  name: string;
  price_pennies: number;
  color_family: string;
  sizes: string[];
  retailer?: string;
  product_url?: string;
  image_url?: string;
  updated_at?: string;
};
export type Outfit = { total_price: number; items: Product[] };

const sampleProducts = catalog.products as Product[];
const partnerProducts = partnerCatalog.products as Product[];
const maxFeedAge = 7 * 24 * 60 * 60 * 1000;

export function currentPartnerProducts(): Product[] {
  return partnerProducts.filter(product => {
    const age = product.updated_at ? Date.now() - Date.parse(product.updated_at) : NaN;
    return Boolean(product.product_url && product.image_url && age >= 0 && age < maxFeedAge);
  });
}
const neutral = new Set(['black', 'white', 'grey', 'navy', 'tan', 'brown']);
const complements: Record<string, string> = {
  blue: 'orange',
  red: 'green',
  yellow: 'purple',
  green: 'red',
  orange: 'blue',
  purple: 'yellow',
};

function worksWith(a: string, b: string) {
  return neutral.has(a) || neutral.has(b) || a === b || complements[a] === b;
}

export function generateOutfits(profile: Profile, products: Product[] = sampleProducts): Outfit[] {
  const budgetPennies = Math.round(profile.budget * 100);
  const selection = products.filter(product => product.audience === profile.audience);
  const tops = selection.filter(product => product.category === 'top' && product.sizes.includes(profile.topSize));
  const bottoms = selection.filter(product => product.category === 'bottom' && product.sizes.includes(profile.bottomSize));
  const shoes = selection.filter(product => product.category === 'shoe' && product.sizes.includes(profile.shoeSize));
  const accessories = selection.filter(product => product.category === 'accessory');
  const candidates: Outfit[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!worksWith(top.color_family, bottom.color_family)) continue;
      for (const shoe of shoes) {
        if (!worksWith(top.color_family, shoe.color_family)) continue;
        const base = [top, bottom, shoe];
        const basePrice = base.reduce((sum, item) => sum + item.price_pennies, 0);
        if (basePrice > budgetPennies) continue;
        const accessory = accessories.find(item => basePrice + item.price_pennies <= budgetPennies);
        const items = accessory ? [...base, accessory] : base;
        candidates.push({
          items,
          total_price: items.reduce((sum, item) => sum + item.price_pennies, 0),
        });
      }
    }
  }

  // Vary the main garments so the results are useful alternatives.
  candidates.sort((a, b) => b.total_price - a.total_price);
  const chosen: Outfit[] = [];
  const usedPairs = new Set<string>();
  for (const outfit of candidates) {
    const pair = outfit.items[0].id + ':' + outfit.items[1].id;
    if (usedPairs.has(pair)) continue;
    chosen.push(outfit);
    usedPairs.add(pair);
    if (chosen.length === 3) break;
  }
  return chosen;
}
