import type { PrintifyBlueprint } from './printify';

export type CatalogAudience = 'all' | 'women' | 'men' | 'unisex';
export type CatalogCategory = 'all' | 'clothing' | 'dresses' | 'tops' | 'bottoms' | 'outerwear' | 'accessories';

const women = /\b(women(?:['’]?s)?|woman|ladies|lady|female)\b/i;
const men = /\b(men(?:['’]?s)?|man|male)\b/i;
const unisex = /\bunisex\b/i;
const children = /\b(kids?|children|boys?|girls?|baby|infants?|toddlers?|youth)\b/i;
const dresses = /\b(dress(?:es)?|gowns?|skirts?|rompers?|jumpsuits?)\b/i;
const tops = /\b(tees?|t-shirts?|shirts?|blouses?|polos?|tanks?|tops?|crop tops?|sweatshirts?|sweaters?|jumpers?|hoodies?|jerseys?)\b/i;
const bottoms = /\b(jeans?|pants?|trousers?|shorts?|leggings?|joggers?|sweatpants?)\b/i;
const outerwear = /\b(jackets?|coats?|blazers?|vests?|cardigans?)\b/i;
const accessories = /\b(shoes?|boots?|sneakers?|trainers?|socks?|hats?|caps?|beanies?|scarves?|bags?)\b/i;
const otherClothing = /\b(swimsuits?|swimwear|bikinis?|bras?|bodysuits?|robes?|pajamas?|pyjamas?|activewear)\b/i;

const relatedTerms: Record<string, string[]> = {
  gown: ['dress'], gowns: ['dress'], frock: ['dress'], frocks: ['dress'],
  trainers: ['sneakers'], trainer: ['sneaker'],
  trousers: ['pants'], trouser: ['pants'],
  jumper: ['sweater'], jumpers: ['sweater'],
};

function matchesSearch(item: PrintifyBlueprint, query: string) {
  if (!query) return true;
  const text = `${item.title} ${item.brand} ${item.model}`.toLowerCase();
  if (text.includes(query)) return true;
  // Printify uses different names for some familiar garment terms.
  return (relatedTerms[query] || []).some(term => text.includes(term));
}

function matchesAudience(title: string, audience: CatalogAudience) {
  if (audience === 'all') return true;
  if (children.test(title)) return false;
  if (audience === 'unisex') return unisex.test(title);
  if (audience === 'women') return women.test(title) || (dresses.test(title) && !men.test(title));
  return men.test(title);
}

function matchesCategory(title: string, category: CatalogCategory) {
  if (category === 'all') return true;
  if (category === 'dresses') return dresses.test(title);
  if (category === 'tops') return tops.test(title);
  if (category === 'bottoms') return bottoms.test(title);
  if (category === 'outerwear') return outerwear.test(title);
  if (category === 'accessories') return accessories.test(title);
  return dresses.test(title) || tops.test(title) || bottoms.test(title)
    || outerwear.test(title) || otherClothing.test(title);
}

function balancedBrowse(items: PrintifyBlueprint[]) {
  const groups: PrintifyBlueprint[][] = [[], [], [], []];
  const extras: PrintifyBlueprint[] = [];
  for (const item of items) {
    const title = item.title;
    if (children.test(title) || !matchesCategory(title, 'clothing')) {
      extras.push(item);
    } else if (women.test(title)) {
      groups[0].push(item);
    } else if (men.test(title)) {
      groups[1].push(item);
    } else if (unisex.test(title)) {
      groups[2].push(item);
    } else {
      groups[3].push(item);
    }
  }
  for (const group of [...groups, extras]) group.sort((a, b) => a.title.localeCompare(b.title));
  const ordered: PrintifyBlueprint[] = [];
  for (let i = 0; groups.some(group => i < group.length); i++) {
    for (const group of groups) if (group[i]) ordered.push(group[i]);
  }
  return ordered.concat(extras);
}

export function browsePrintify(
  blueprints: PrintifyBlueprint[], query: string, audience: CatalogAudience, category: CatalogCategory,
) {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const matching = blueprints.filter(item => matchesSearch(item, q)
    && matchesAudience(item.title, audience) && matchesCategory(item.title, category));
  if (!q && audience === 'all' && category === 'all') return balancedBrowse(matching);
  return matching.sort((a, b) => a.title.localeCompare(b.title));
}
