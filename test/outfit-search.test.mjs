import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateOutfitPage } from '../src/lib/outfit-search.ts';
import { emptyFeedback, normalizeFeedback, recordFeedback } from '../src/lib/outfit-feedback.ts';

const profile = {
  audience: 'women', topSize: '12', bottomSize: '12', shoeSize: 'UK 6',
  budget: 400, style: 'relaxed', occasion: 'everyday', preferredColor: 'any', avoidedColors: [],
};

function product(id, category, price_pennies, retailer = 'Store A', audience = 'women') {
  return {
    id, name: id, category, price_pennies, retailer, audience, color_family: 'black',
    sizes: [category === 'shoe' ? 'UK 6' : '12'],
    style_tags: ['relaxed'], occasion_tags: ['everyday'],
  };
}

test('offers value, middle and higher-priced outfits within a budget across retailers', () => {
  const products = [
    product('shoe', 'shoe', 3000, 'Footwear'),
    product('value-dress', 'one-piece', 2000, 'Value Store'),
    product('middle-dress', 'one-piece', 12000, 'Mid Store'),
    product('higher-dress', 'one-piece', 33000, 'Designer Store'),
    product('unaffordable', 'one-piece', 45000),
    product('wrong-audience', 'one-piece', 1000, 'Store', 'men'),
  ];
  const first = generateOutfitPage(profile, products, 0, 2);
  const second = generateOutfitPage(profile, products, 1, 2);
  assert.equal(first.total, 3);
  assert.equal(first.nextPage, 1);
  assert.equal(second.nextPage, null);
  const looks = [...first.outfits, ...second.outfits];
  assert.deepEqual(looks.map(look => look.total_price).sort((a, b) => a - b), [5000, 15000, 36000]);
  assert.deepEqual(new Set(first.outfits.map(look => look.total_price)), new Set([5000, 36000]));
  assert.deepEqual(new Set(looks.map(look => look.items[0].retailer)), new Set(['Value Store', 'Mid Store', 'Designer Store']));
  assert.ok(looks.every(look => look.total_price <= profile.budget * 100));
});

test('can page through all matching looks without a catalogue or outfit cap', () => {
  const products = [product('shoe-a', 'shoe', 3000), product('shoe-b', 'shoe', 4000),
    ...Array.from({ length: 31 }, (_, index) => product(`dress-${index}`, 'one-piece', 2000 + index * 100))];
  const ids = new Set();
  for (let page = 0; page < 11; page++) {
    const result = generateOutfitPage(profile, products, page, 6);
    assert.equal(result.total, 62);
    for (const outfit of result.outfits) ids.add(outfit.id);
    assert.equal(result.nextPage, page === 10 ? null : page + 1);
  }
  assert.equal(ids.size, 62);
});

test('keeps optional layers and accessories only when the complete look fits', () => {
  const smallBudget = { ...profile, budget: 100 };
  const products = [
    product('top', 'top', 2000), product('bottom', 'bottom', 3000), product('shoes', 'shoe', 2000),
    product('coat', 'outerwear', 2000), product('belt', 'accessory', 1000),
  ];
  const result = generateOutfitPage(smallBudget, products, 0, 6);
  assert.equal(result.total, 2);
  assert.deepEqual(result.outfits.map(outfit => outfit.total_price).sort((a, b) => a - b), [8000, 10000]);
  assert.ok(result.outfits.every(outfit => outfit.items.some(item => item.id === 'belt')));
});

test('outfit reactions change ranking, skip rejected looks and stay separate by audience', () => {
  const products = [
    product('shoe', 'shoe', 3000),
    { ...product('a-wide', 'one-piece', 2000), name: 'Wide Dress', color_family: 'blue' },
    { ...product('m-slim', 'one-piece', 2000), name: 'Slim Dress' },
    { ...product('z-slim', 'one-piece', 2000), name: 'Slim Dress' },
  ];
  const original = generateOutfitPage(profile, products, 0, 6);
  const liked = original.outfits.find(outfit => outfit.items[0].id === 'z-slim');
  const rejected = original.outfits.find(outfit => outfit.items[0].id === 'a-wide');
  let feedback = recordFeedback(emptyFeedback(), 'women', liked, 'more');
  assert.equal(feedback.men.length, 0);
  const ranked = generateOutfitPage(profile, products, 0, 6, feedback.women);
  assert.deepEqual(ranked.outfits.map(outfit => outfit.items[0].id), ['z-slim', 'm-slim', 'a-wide']);

  feedback = recordFeedback(feedback, 'women', rejected, 'less');
  const filtered = generateOutfitPage(profile, products, 0, 6, feedback.women);
  assert.equal(filtered.total, 2);
  assert.ok(filtered.outfits.every(outfit => outfit.id !== rejected.id));
  assert.equal(generateOutfitPage(profile, products, 0, 6, feedback.men).total, 3);
  assert.deepEqual(normalizeFeedback([{ id: 'bad', reaction: 'less', style: 'invalid', colors: [], features: [] }]), []);
});
