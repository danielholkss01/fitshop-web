import { createReadStream, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { parse } from 'csv-parse';
import { mapAwinProduct } from './awin-product.mjs';

const args = process.argv.slice(2);
function option(name) {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
}
const input = args[0];
const format = option('--format') || (/\.jsonl(?:\.gz)?$/i.test(input || '') ? 'enhanced' : 'legacy');
const dryRun = args.includes('--dry-run');
if (!input || input.startsWith('--') || !['legacy', 'enhanced'].includes(format)) {
  console.error('Usage: npm run import:awin -- /path/to/approved-feed.csv[.gz] [--format legacy|enhanced] [--advertiser-id ID] [--publisher-id ID] [--merchant NAME] [--feed-id ID] [--size-system UK|EU|US] [--dry-run]');
  process.exit(1);
}
const settings = {
  format, advertiserId: option('--advertiser-id'), publisherId: option('--publisher-id'),
  merchant: option('--merchant'), feedId: option('--feed-id') || 'default', sizeSystem: option('--size-system'), importedAt: new Date().toISOString(),
};
if (format === 'enhanced' && !/^\d+$/.test(settings.publisherId || '')) throw new Error('Enhanced feeds need your numeric Awin publisher ID for tracked links');
if (settings.sizeSystem && !['UK', 'EU', 'US', 'AU', 'DE', 'FR', 'IT'].includes(settings.sizeSystem.toUpperCase())) throw new Error('Unsupported size system');

const source = createReadStream(resolve(input));
const stream = /\.gz$/i.test(input) ? source.pipe(createGunzip()) : source;
source.on('error', error => stream.destroy(error));
const rows = format === 'legacy'
  ? stream.pipe(parse({ columns: true, skip_empty_lines: true, bom: true, trim: true }))
  : createInterface({ input: stream, crlfDelay: Infinity });

const products = new Map();
const skipped = new Map();
let total = 0;
let sourceId;
for await (const record of rows) {
  const row = format === 'enhanced' ? JSON.parse(record) : record;
  if (row.error) throw new Error('Awin returned a feed error; no products were imported');
  total++;
  const result = mapAwinProduct(row, settings);
  if (result.skip) {
    skipped.set(result.skip, (skipped.get(result.skip) || 0) + 1);
    continue;
  }
  const product = result.product;
  if (sourceId && product.source_id !== sourceId) throw new Error('Feed contains products from more than one advertiser');
  sourceId = product.source_id;
  const variant = createHash('sha256').update(JSON.stringify([product.color_name, product.price_pennies, product.product_url])).digest('hex').slice(0, 12);
  product.id += ':' + variant;
  const existing = products.get(product.id);
  if (existing) {
    if (JSON.stringify({ ...existing, sizes: [] }) !== JSON.stringify({ ...product, sizes: [] })) {
      throw new Error('Conflicting rows for product ' + product.id);
    }
    for (const size of product.sizes) if (!existing.sizes.includes(size)) existing.sizes.push(size);
  } else products.set(product.id, product);
}

if (!sourceId || !products.size) throw new Error('No usable in-stock fashion products; leaving existing catalog unchanged');
const output = resolve('src/lib/partner-products.json');
const previous = JSON.parse(readFileSync(output, 'utf8'));
const next = [...previous.products.filter(product => product.source_id !== sourceId), ...products.values()];
console.log(`${sourceId}: ${total} rows, ${products.size} usable products, ${next.length} partner products total`);
for (const [reason, count] of skipped) console.log(`  Skipped ${count}: ${reason}`);
if (!dryRun) {
  const temporary = output + '.tmp';
  writeFileSync(temporary, JSON.stringify({ products: next }, null, 2) + '\n');
  renameSync(temporary, output);
  console.log('Updated partner catalog. Review the JSON diff before deployment.');
}
