// Map Awin fashion feed rows into Fit&Shop's product contract. Unknown fit,
// availability, currency or category must never become a claimed recommendation.
const typeRules = [
  ['outerwear', /\b(blazer(?:s)?|jacket(?:s)?|coat(?:s)?|parka(?:s)?|cardigan(?:s)?|waistcoat(?:s)?)\b/i],
  ['shoe', /\b(shoe(?:s)?|trainer(?:s)?|sneaker(?:s)?|boot(?:s)?|sandal(?:s)?|heel(?:s)?|loafer(?:s)?|flat(?:s)?|mule(?:s)?|brogue(?:s)?)\b/i],
  ['one-piece', /\b(dress(?:es)?|gown(?:s)?|jumpsuit(?:s)?|playsuit(?:s)?|romper(?:s)?)\b/i],
  ['bottom', /\b(jean(?:s)?|chino(?:s)?|trouser(?:s)?|pant(?:s)?|short(?:s)?|skirt(?:s)?|legging(?:s)?|jogger(?:s)?)\b/i],
  ['top', /\b(polo(?:s)?|shirt(?:s)?|tee(?:s)?|t-shirt(?:s)?|blouse(?:s)?|hoodie(?:s)?|sweater(?:s)?|sweatshirt(?:s)?|jumper(?:s)?|top(?:s)?|tank(?:s)?|knitwear)\b/i],
  ['accessory', /\b(bag(?:s)?|belt(?:s)?|hat(?:s)?|scarf|scarves|necklace(?:s)?|earring(?:s)?|bracelet(?:s)?|watch(?:es)?)\b/i],
];
const childTerms = /\b(kid(?:s)?|child(?:ren)?|baby|infant(?:s)?|toddler(?:s)?|boy(?:s)?|girl(?:s)?)\b/i;
const colourAliases = [
  ['navy', /\bnavy\b/i], ['black', /\bblack\b/i], ['white', /\bwhite\b/i],
  ['grey', /\b(grey|gray|silver)\b/i], ['tan', /\b(tan|beige|cream|ivory|camel|ecru)\b/i],
  ['brown', /\b(brown|chocolate)\b/i], ['red', /\b(red|burgundy|maroon|pink|rose)\b/i],
  ['green', /\b(green|olive|khaki|mint)\b/i], ['blue', /\b(blue|teal|turquoise)\b/i],
  ['orange', /\b(orange|coral)\b/i], ['yellow', /\b(yellow|gold|mustard)\b/i],
  ['purple', /\b(purple|lilac|lavender|violet)\b/i],
];

function value(...items) {
  return items.find(item => typeof item === 'string' && item.trim())?.trim() || '';
}

function httpsUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && url.hostname.includes('.') ? url.toString() : '';
  } catch { return ''; }
}

function trackedAwinUrl(input) {
  try {
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol) || !['awin1.com', 'www.awin1.com'].includes(url.hostname.toLowerCase())) return '';
    if (!['/pclick.php', '/cread.php', '/awclick.php'].includes(url.pathname.toLowerCase())) return '';
    url.protocol = 'https:';
    return url.toString();
  } catch { return ''; }
}

function priceInPennies(amount, currency) {
  const match = String(amount || '').trim().match(/^(\d+(?:\.\d{1,2})?)(?:\s+([A-Za-z]{3}))?$/);
  if (!match || (match[2] || currency || '').toUpperCase() !== 'GBP') return 0;
  const pennies = Math.round(Number(match[1]) * 100);
  return pennies > 0 && pennies <= 1000000 ? pennies : 0;
}

function audienceFor(audience, categoryPath) {
  if (childTerms.test(`${audience} ${categoryPath}`)) return '';
  if (/\b(unisex|gender.?neutral)\b/i.test(audience)) return 'unisex';
  if (/\b(women|womens|womenswear|woman|female|ladies)\b/i.test(`${audience} ${categoryPath}`)) return 'women';
  if (/\b(men|mens|menswear|man|male|gentlemen)\b/i.test(`${audience} ${categoryPath}`)) return 'men';
  return '';
}

function wearTags(category, name) {
  const formal = /\b(formal|tailored|office|blazers?|chinos?|trousers?|shirts?|blouses?|polos?|heels?|loafers?|gowns?|dress(?:es)?)\b/i.test(name);
  const casual = /\b(casual|denim|jeans?|hoodies?|sweats?|trainers?|sneakers?|joggers?|tees?|t-shirts?)\b/i.test(name);
  if (category === 'accessory') return { style_tags: ['relaxed', 'polished', 'street'], occasion_tags: ['everyday', 'work', 'going-out'] };
  if (formal && !casual) return { style_tags: ['polished'], occasion_tags: ['work', 'going-out'] };
  if (casual && !formal) return { style_tags: ['relaxed', 'street'], occasion_tags: ['everyday', 'going-out'] };
  if (category === 'one-piece' || category === 'outerwear') return { style_tags: ['relaxed', 'polished'], occasion_tags: ['everyday', 'going-out'] };
  return { style_tags: ['relaxed', 'polished'], occasion_tags: ['everyday', 'work', 'going-out'] };
}

function enhancedFields(row) {
  // Awin describes a flat Google-format example and sectioned product responses.
  return Object.assign({}, ...Object.entries(row).filter(([key]) =>
    key.startsWith('product_') || key === 'price_and_availability' || key === 'fashion').map(([, entry]) => entry), row);
}

export function mapAwinProduct(row, { format, advertiserId, publisherId, merchant, feedId = 'default', sizeSystem, importedAt = new Date().toISOString() }) {
  if (row?.error) return { skip: 'feed error' };
  const details = format === 'enhanced' ? enhancedFields(row) : row;
  const meta = row.meta || {};
  const feedAdvertiser = String(meta.advertiser_id || details.merchant_id || '').trim();
  if (advertiserId && feedAdvertiser && String(advertiserId) !== feedAdvertiser) return { skip: 'advertiser mismatch' };
  const sourceAdvertiser = String(advertiserId || meta.advertiser_id || details.merchant_id || '').trim();
  const retailer = value(merchant, meta.advertiser_name, details.merchant_name);
  const sourceSku = value(details.aw_product_id, details.merchant_product_id, details.id, details.product_id);
  const name = value(details.product_name, details.title);
  const categoryPath = value(details.merchant_product_category_path, details.merchant_category, details.category_name, details.google_product_category, details.product_type);
  const audience = audienceFor(value(details.suitable_for, details.gender), categoryPath);
  const matchText = `${categoryPath} ${name}`;
  const category = typeRules.find(([, pattern]) => pattern.test(matchText))?.[0];
  if (!sourceAdvertiser || !retailer || !sourceSku || !name || !audience || !category || childTerms.test(matchText)) return { skip: 'missing apparel identity' };
  if (details.age_group && value(details.age_group).toLowerCase() !== 'adult') return { skip: 'not adult apparel' };

  const stock = value(details.in_stock, details.stock_status, details.availability).toLowerCase();
  if (!['1', 'true', 'yes', 'in_stock', 'available'].includes(stock)
    || ['0', 'false', 'no'].includes(value(details.is_for_sale).toLowerCase())) return { skip: 'stock unverified' };
  const price_pennies = priceInPennies(value(details.search_price, details.price), details.currency);
  if (!price_pennies) return { skip: 'price or currency unverified' };
  const rawSize = value(details.size);
  const system = value(details.size_system, sizeSystem).toUpperCase();
  if (rawSize && !/^(UK|EU|US|AU|DE|FR|IT)\s/i.test(rawSize) && /^\d+(?:\.5)?$/.test(rawSize) && category === 'shoe' && !system) return { skip: 'shoe size system missing' };
  const size = rawSize && system && /^\d+(?:\.5)?$/.test(rawSize) && (category === 'shoe' || system !== 'UK')
    ? `${system} ${rawSize}` : rawSize;
  // No exact size means we cannot claim this piece fits a shopper.
  if (!size && category !== 'accessory') return { skip: 'size missing' };
  const rawColour = value(details.colour, details.color);
  if (!rawColour) return { skip: 'colour missing' };
  const color_family = colourAliases.find(([, pattern]) => pattern.test(rawColour))?.[0] || rawColour.toLowerCase();
  const image_url = httpsUrl(value(details.aw_image_url, details.merchant_image_url, details.image_url, details.image_link));
  if (!image_url) return { skip: 'image missing' };

  // Legacy deep_link/merchant_deep_link are direct retailer URLs, not tracked links.
  let product_url = trackedAwinUrl(value(details.aw_deep_link, details.awin_deep_link));
  if (!product_url && format === 'enhanced' && /^\d+$/.test(sourceAdvertiser) && /^\d+$/.test(String(publisherId))) {
    const destination = httpsUrl(details.link);
    if (destination) {
      const tracking = new URL('https://www.awin1.com/cread.php');
      tracking.searchParams.set('awinmid', sourceAdvertiser);
      tracking.searchParams.set('awinaffid', String(publisherId));
      tracking.searchParams.set('ued', destination);
      product_url = tracking.toString();
    }
  }
  if (!product_url) return { skip: 'tracked link missing' };

  const garment_type = categoryPath.split(/>|\//).map(part => part.trim()).filter(Boolean).at(-1) || category;
  const tags = wearTags(category, `${garment_type} ${name}`);
  return { product: {
    id: `awin:${sourceAdvertiser}:${sourceSku}`, source_id: `awin:${sourceAdvertiser}:${feedId}`,
    retailer, audience, category, name, garment_type, brand: value(details.brand_name, details.brand) || undefined,
    material: value(details.material) || undefined, color_name: rawColour, color_family,
    sizes: size ? [size] : [], price_pennies, ...tags,
    product_url, image_url, updated_at: importedAt,
  } };
}
