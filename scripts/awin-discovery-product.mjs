// Products without size-level availability can be browsed, but never used as
// size-matched outfit recommendations.
const fashionCategory = /\b(shirts?|t-shirts?|tops?|polos?|hoodies?|sweatshirts?|jumpers?|knitwear|jeans?|trousers?|cargos?|joggers?|shorts?|skirts?|dresses?|gowns?|jackets?|coats?|gilets?|overshirts?|trainers?|shoes?|boots?|sandals?|underwear|lingerie|socks?|caps?|hats?|belts?|bags?|wallets?)\b/i;
const childCategory = /\b(kids?|children|baby|infants?|toddlers?|boys?|girls?)\b/i;

function httpsUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && url.hostname.includes('.') ? url.toString() : '';
  } catch { return ''; }
}

export function mapAwinDiscoveryProduct(row, { advertiserId, publisherId, audience, feedId = 'default', importedAt }) {
  if (String(row.merchant_id || '').trim() !== String(advertiserId)) return { skip: 'advertiser mismatch' };
  const name = String(row.product_name || '').trim();
  const category = String(row.merchant_category || row.merchant_product_category_path || '').trim();
  // A brand can contain a child word, such as "Billionaire Boys Club".
  const itemName = name.includes(' - ') ? name.slice(name.indexOf(' - ') + 3) : name;
  if (!name || !fashionCategory.test(category) || childCategory.test(`${itemName} ${category}`)) return { skip: 'not adult fashion' };
  if (String(row.in_stock || '').trim() !== '1' || String(row.is_for_sale || '').trim() === '0') return { skip: 'not confirmed for sale' };
  if (String(row.currency || '').trim().toUpperCase() !== 'GBP') return { skip: 'currency missing or not GBP' };
  const price = Number(row.search_price);
  if (!Number.isFinite(price) || price <= 0 || price > 10000) return { skip: 'price missing or invalid' };
  const image_url = httpsUrl(row.merchant_image_url || row.aw_image_url);
  if (!image_url) return { skip: 'image missing' };

  let product_url;
  try {
    product_url = new URL(row.aw_deep_link);
    if (!['awin1.com', 'www.awin1.com'].includes(product_url.hostname.toLowerCase()) ||
        !['http:', 'https:'].includes(product_url.protocol) ||
        product_url.pathname.toLowerCase() !== '/pclick.php' ||
        product_url.searchParams.get('m') !== String(advertiserId) ||
        product_url.searchParams.get('a') !== String(publisherId) ||
        product_url.searchParams.get('p') !== String(row.aw_product_id)) {
      return { skip: 'tracked link missing or for another account' };
    }
    product_url.protocol = 'https:';
  } catch { return { skip: 'tracked link missing or for another account' }; }

  const id = String(row.aw_product_id || '').trim();
  const retailer = String(row.merchant_name || '').trim();
  if (!id || !retailer) return { skip: 'product identity missing' };
  const titleBrand = name.split(' - ')[0]?.replaceAll('&amp;', '&').trim();
  const feedBrand = String(row.brand_name || '').trim();
  const keywords = String(row.keywords || '').trim().replaceAll('&amp;', '&');
  const brand = feedBrand || (keywords.toLowerCase() === titleBrand?.toLowerCase() ? titleBrand : '');

  return { product: {
    id: `awin:${advertiserId}:${id}`,
    source_id: `awin:${advertiserId}:${feedId}`,
    retailer,
    audience,
    category,
    name: name.replaceAll('&amp;', '&'),
    brand,
    price_pennies: Math.round(price * 100),
    image_url,
    product_url: product_url.toString(),
    updated_at: importedAt,
  } };
}
