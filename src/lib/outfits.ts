import catalog from './catalog.json';
import partnerCatalog from './partner-products.json';
import { generateOutfitPage } from './outfit-search';
import type { Profile } from './profile';

export type { Category, Outfit, Product } from './outfit-search';
import type { Product } from './outfit-search';

const sampleProducts = catalog.products as Product[];
const partnerProducts = partnerCatalog.products as Product[];
const maxFeedAge = 7 * 24 * 60 * 60 * 1000;

export function currentPartnerProducts(): Product[] {
  return partnerProducts.filter(product => {
    const age = product.updated_at ? Date.now() - Date.parse(product.updated_at) : NaN;
    return Boolean(product.product_url && product.image_url && age >= 0 && age < maxFeedAge);
  });
}

export function outfitPage(profile: Profile, page: number, pageSize: number) {
  const partnerPage = generateOutfitPage(profile, currentPartnerProducts(), page, pageSize);
  if (partnerPage.total) return { ...partnerPage, demo: false };
  return { ...generateOutfitPage(profile, sampleProducts, page, pageSize), demo: true };
}
