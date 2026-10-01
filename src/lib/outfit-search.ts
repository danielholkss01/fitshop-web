import type { Audience, Occasion, Profile, Style } from './profile';

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
  color_name?: string;
  source_id?: string;
  price_pennies: number;
  color_family: string;
  sizes: string[];
  style_tags: SpecificStyle[];
  occasion_tags: SpecificOccasion[];
  retailer?: string;
  product_url?: string;
  image_url?: string;
  updated_at?: string;
};
export type Outfit = { id: string; total_price: number; items: Product[]; style: SpecificStyle; reason: string };
type RankedOutfit = { outfit: Outfit; score: number };

const styleOrder: SpecificStyle[] = ['relaxed', 'polished', 'street'];
const occasionOrder: SpecificOccasion[] = ['everyday', 'work', 'going-out'];
const occasionDescription: Record<SpecificOccasion, string> = {
  everyday: 'everyday wear', work: 'work', 'going-out': 'going out',
};
const neutral = new Set(['black', 'white', 'grey', 'navy', 'tan', 'brown']);
const complements: Record<string, string> = {
  blue: 'orange', red: 'green', yellow: 'purple', green: 'red', orange: 'blue', purple: 'yellow',
};

function worksWith(a: string, b: string) {
  return neutral.has(a) || neutral.has(b) || a === b || complements[a] === b;
}

function compatible(items: Product[]) {
  return items.every((item, index) => items.slice(index + 1).every(other => worksWith(item.color_family, other.color_family)));
}

function paletteScore(items: Product[], profile: Profile) {
  const colors = items.map(item => item.color_family);
  const distinct = new Set(colors);
  const shoe = items.find(item => item.category === 'shoe');
  return (distinct.size === 1 ? 5 : distinct.size === 2 ? 4 : 1)
    + (shoe && items.some(item => item !== shoe && item.color_family === shoe.color_family) ? 2 : 0)
    + (profile.preferredColor === 'any' ? 0 : colors.filter(color => color === profile.preferredColor).length * 3);
}

function visitOutfits(profile: Profile, products: Product[], visit: (candidate: RankedOutfit) => void) {
  const budgetPennies = Math.round(profile.budget * 100);
  const selection = products.filter(product => (product.audience === profile.audience || product.audience === 'unisex')
    && !profile.avoidedColors.some(color => color === product.color_family)
    && product.style_tags?.length && product.occasion_tags?.length
    && Number.isSafeInteger(product.price_pennies) && product.price_pennies > 0 && product.price_pennies <= budgetPennies);
  const byPrice = (a: Product, b: Product) => a.price_pennies - b.price_pennies || a.id.localeCompare(b.id);
  const eligible = (category: Category, size: string) => selection.filter(product => product.category === category && product.sizes.includes(size)
    && (profile.style === 'any' || product.style_tags.includes(profile.style))
    && (profile.occasion === 'any' || product.occasion_tags.includes(profile.occasion))).sort(byPrice);
  const tops = eligible('top', profile.topSize);
  const bottoms = eligible('bottom', profile.bottomSize);
  const onePieces = eligible('one-piece', profile.topSize);
  const outerwear = eligible('outerwear', profile.topSize);
  const shoes = eligible('shoe', profile.shoeSize);
  const accessories = selection.filter(product => product.category === 'accessory').sort((a, b) =>
    Number(b.color_family === profile.preferredColor) - Number(a.color_family === profile.preferredColor) || byPrice(a, b));

  function addCore(core: Product[], corePrice: number) {
    const style = profile.style === 'any' ? styleOrder.find(tag => core.every(item => item.style_tags.includes(tag))) : profile.style;
    const occasion = profile.occasion === 'any' ? occasionOrder.find(tag => core.every(item => item.occasion_tags.includes(tag))) : profile.occasion;
    if (!style || !occasion || !core.every(item => item.style_tags.includes(style) && item.occasion_tags.includes(occasion))) return;
    const accessory = accessories.find(item => item.style_tags.includes(style) && item.occasion_tags.includes(occasion)
      && corePrice + item.price_pennies <= budgetPennies && core.every(piece => worksWith(item.color_family, piece.color_family)));
    const items = accessory ? [...core, accessory] : core;
    const colors = [...new Set(core.map(item => item.color_family))];
    visit({ outfit: {
      id: core.map(item => item.id).join(':'), items,
      total_price: corePrice + (accessory?.price_pennies || 0), style,
      reason: `${style[0].toUpperCase() + style.slice(1)} pieces for ${occasionDescription[occasion]}, in ${colors.join(', ')}.`,
    }, score: paletteScore(core, profile) });
  }

  function addLooks(base: Product[], basePrice: number) {
    if (!compatible(base)) return;
    addCore(base, basePrice);
    for (const layer of outerwear) {
      if (basePrice + layer.price_pennies > budgetPennies) break;
      if (base.every(piece => worksWith(piece.color_family, layer.color_family))) addCore([...base, layer], basePrice + layer.price_pennies);
    }
  }

  for (const shoe of shoes) {
    for (const onePiece of onePieces) {
      if (shoe.price_pennies + onePiece.price_pennies > budgetPennies) break;
      addLooks([onePiece, shoe], shoe.price_pennies + onePiece.price_pennies);
    }
    for (const top of tops) {
      if (!bottoms.length || shoe.price_pennies + top.price_pennies + bottoms[0].price_pennies > budgetPennies) break;
      if (!worksWith(shoe.color_family, top.color_family)) continue;
      for (const bottom of bottoms) {
        const basePrice = shoe.price_pennies + top.price_pennies + bottom.price_pennies;
        if (basePrice > budgetPennies) break;
        if (worksWith(top.color_family, bottom.color_family) && worksWith(bottom.color_family, shoe.color_family)) {
          addLooks([top, bottom, shoe], basePrice);
        }
      }
    }
  }
}

// Negative means a should appear before b. These heaps retain only results
// needed for the requested page, even if a feed produces many combinations.
function rank(a: RankedOutfit, b: RankedOutfit) {
  return b.score - a.score || a.outfit.total_price - b.outfit.total_price || a.outfit.id.localeCompare(b.outfit.id);
}

class BestCandidates {
  private heap: RankedOutfit[] = [];
  private readonly limit: number;
  constructor(limit: number) { this.limit = limit; }

  add(candidate: RankedOutfit) {
    if (this.heap.length < this.limit) {
      this.heap.push(candidate);
      let index = this.heap.length - 1;
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (rank(this.heap[index], this.heap[parent]) <= 0) break;
        [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
        index = parent;
      }
    } else if (this.limit && rank(candidate, this.heap[0]) < 0) {
      this.heap[0] = candidate;
      let index = 0;
      while (2 * index + 1 < this.heap.length) {
        const left = 2 * index + 1;
        const right = left + 1;
        const worst = right < this.heap.length && rank(this.heap[right], this.heap[left]) > 0 ? right : left;
        if (rank(this.heap[worst], this.heap[index]) <= 0) break;
        [this.heap[index], this.heap[worst]] = [this.heap[worst], this.heap[index]];
        index = worst;
      }
    }
  }

  sorted() { return this.heap.sort(rank); }
}

export function generateOutfitPage(profile: Profile, products: Product[], page: number, pageSize: number) {
  if (!Number.isSafeInteger(page) || page < 0 || !Number.isSafeInteger(pageSize) || pageSize < 1
    || !Number.isSafeInteger((page + 1) * pageSize)) throw new Error('Invalid outfit page');
  let total = 0;
  let lowest = Infinity;
  let highest = 0;
  visitOutfits(profile, products, ({ outfit }) => {
    total++;
    lowest = Math.min(lowest, outfit.total_price);
    highest = Math.max(highest, outfit.total_price);
  });
  if (!total) return { outfits: [] as Outfit[], total, nextPage: null as number | null };

  const end = (page + 1) * pageSize;
  const bands = [new BestCandidates(end), new BestCandidates(end), new BestCandidates(end)];
  const first = lowest + (highest - lowest) / 3;
  const second = lowest + 2 * (highest - lowest) / 3;
  visitOutfits(profile, products, candidate => {
    const price = candidate.outfit.total_price;
    const band = lowest === highest ? 1 : price < first ? 0 : price < second ? 1 : 2;
    bands[band].add(candidate);
  });

  const sorted = bands.map(band => band.sorted());
  const prefix: Outfit[] = [];
  for (let index = 0; prefix.length < end; index++) {
    let found = false;
    for (const band of sorted) {
      if (band[index] && prefix.length < end) {
        prefix.push(band[index].outfit);
        found = true;
      }
    }
    if (!found) break;
  }
  return { outfits: prefix.slice(page * pageSize), total, nextPage: end < total ? page + 1 : null };
}
