import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const inputPath = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!inputPath || inputPath.startsWith('--')) {
  console.error('Usage: npm run import:partner -- /path/to/approved-feed.csv [--dry-run]');
  process.exit(1);
}

const outputPath = resolve('src/lib/partner-products.json');
const required = ['merchant', 'sku', 'audience', 'category', 'name', 'price_gbp', 'color_family', 'size', 'style_tags', 'occasion_tags', 'product_url', 'image_url', 'in_stock'];
const categories = new Set(['top', 'bottom', 'one-piece', 'outerwear', 'shoe', 'accessory']);
const colours = new Set(['black', 'white', 'grey', 'navy', 'tan', 'brown', 'blue', 'orange', 'red', 'green', 'yellow', 'purple']);
const audiences = new Set(['men', 'women', 'unisex']);
const styles = new Set(['relaxed', 'polished', 'street']);
const occasions = new Set(['everyday', 'work', 'going-out']);

function parseTags(value, field, allowed, line) {
  const tags = [...new Set(requireText(value, field, line).toLowerCase().split('|').map(tag => tag.trim()))].sort();
  if (tags.some(tag => !allowed.has(tag))) throw new Error('Row ' + line + ': invalid ' + field);
  return tags;
}

function httpsUrl(value, field, line) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname.includes('.')) return url.toString();
  } catch {}
  throw new Error('Row ' + line + ': ' + field + ' must be an HTTPS URL');
}

function requireText(value, field, line) {
  if (!value || !value.trim()) throw new Error('Row ' + line + ': missing ' + field);
  return value.trim();
}

function optionalText(value, field, line) {
  if (!value?.trim()) return undefined;
  if (value.trim().length > 160) throw new Error('Row ' + line + ': ' + field + ' is too long');
  return value.trim();
}

function descriptiveTags(value, line) {
  const tags = [...new Set((value || '').split('|').map(tag => tag.trim()).filter(Boolean))];
  if (tags.some(tag => tag.length > 50)) throw new Error('Row ' + line + ': style_details entry is too long');
  return tags;
}

const csv = readFileSync(resolve(inputPath), 'utf8');
const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true, bom: true });
if (!rows.length) throw new Error('Feed has no product rows');
for (const field of required) {
  if (!Object.hasOwn(rows[0], field)) throw new Error('Missing column: ' + field);
}

const merchant = requireText(rows[0].merchant, 'merchant', 2);
const imported = new Map();
for (const [index, row] of rows.entries()) {
  const line = index + 2;
  if (requireText(row.merchant, 'merchant', line) !== merchant) {
    throw new Error('One feed must contain products from one merchant only');
  }
  const sku = requireText(row.sku, 'sku', line);
  const name = requireText(row.name, 'name', line);
  const garment_type = optionalText(row.garment_type, 'garment_type', line);
  const brand = optionalText(row.brand, 'brand', line);
  const material = optionalText(row.material, 'material', line);
  const style_details = descriptiveTags(row.style_details, line);
  const audience = requireText(row.audience, 'audience', line).toLowerCase();
  const category = requireText(row.category, 'category', line).toLowerCase();
  const color_family = requireText(row.color_family, 'color_family', line).toLowerCase();
  const size = requireText(row.size, 'size', line);
  const style_tags = parseTags(row.style_tags, 'style_tags', styles, line);
  const occasion_tags = parseTags(row.occasion_tags, 'occasion_tags', occasions, line);
  if (!audiences.has(audience)) throw new Error('Row ' + line + ': audience must be men, women or unisex');
  if (!categories.has(category)) throw new Error('Row ' + line + ': invalid category');
  if (!colours.has(color_family)) throw new Error('Row ' + line + ': invalid color_family');
  if (!/^\d+(?:\.\d{1,2})?$/.test(row.price_gbp)) throw new Error('Row ' + line + ': invalid GBP price');
  const price_pennies = Math.round(Number(row.price_gbp) * 100);
  if (price_pennies < 1 || price_pennies > 1000000) throw new Error('Row ' + line + ': price out of range');
  if (!['true', 'false'].includes(row.in_stock?.toLowerCase())) throw new Error('Row ' + line + ': in_stock must be true or false');
  const product_url = httpsUrl(row.product_url, 'product_url', line);
  const image_url = httpsUrl(row.image_url, 'image_url', line);
  if (row.in_stock.toLowerCase() === 'false') continue;

  const id = merchant + ':' + sku;
  const existing = imported.get(id);
  if (existing) {
    for (const key of ['name', 'audience', 'category', 'garment_type', 'brand', 'material', 'style_details', 'color_family', 'price_pennies', 'product_url', 'image_url', 'style_tags', 'occasion_tags']) {
      if (JSON.stringify(existing[key]) !== JSON.stringify(({ name, audience, category, garment_type, brand, material, style_details, color_family, price_pennies, product_url, image_url, style_tags, occasion_tags })[key])) {
        throw new Error('Row ' + line + ': SKU has inconsistent product details');
      }
    }
    if (!existing.sizes.includes(size)) existing.sizes.push(size);
  } else {
    imported.set(id, {
      id, retailer: merchant, audience, category, name, garment_type, brand, material, style_details,
      price_pennies, color_family, sizes: [size], style_tags, occasion_tags, product_url, image_url,
      updated_at: new Date().toISOString(),
    });
  }
}

const previous = JSON.parse(readFileSync(outputPath, 'utf8'));
const products = [
  ...previous.products.filter(product => product.retailer !== merchant),
  ...imported.values(),
];
console.log(merchant + ': ' + imported.size + ' in-stock products; ' + products.length + ' total partner products');
if (!dryRun) {
  const temporary = outputPath + '.tmp';
  writeFileSync(temporary, JSON.stringify({ products }, null, 2) + '\n');
  renameSync(temporary, outputPath);
  console.log('Updated ' + outputPath + '. Review the changes before deployment.');
}
