import { createReadStream, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGunzip } from 'node:zlib';
import { parse } from 'csv-parse';
import { mapAwinDiscoveryProduct } from './awin-discovery-product.mjs';

const args = process.argv.slice(2);
function option(name) {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
}
const input = args[0];
const advertiserId = option('--advertiser-id');
const publisherId = option('--publisher-id');
const audience = option('--audience');
const feedId = option('--feed-id') || 'default';
const dryRun = args.includes('--dry-run');
if (!input || input.startsWith('--') || !/^\d+$/.test(advertiserId || '') ||
    !/^\d+$/.test(publisherId || '') || !['men', 'women', 'unisex'].includes(audience) ||
    !/^[\w-]+$/.test(feedId)) {
  console.error('Usage: npm run import:awin:discovery -- /path/to/feed.csv[.gz] --advertiser-id ID --publisher-id ID --audience men|women|unisex [--feed-id ID] [--dry-run]');
  process.exit(1);
}

const source = createReadStream(resolve(input));
const stream = /\.gz$/i.test(input) ? source.pipe(createGunzip()) : source;
const rows = stream.pipe(parse({ columns: true, skip_empty_lines: true, bom: true, trim: true }));
const importedAt = new Date().toISOString();
const products = new Map();
const skipped = new Map();
let total = 0;
for await (const row of rows) {
  total++;
  const result = mapAwinDiscoveryProduct(row, { advertiserId, publisherId, audience, feedId, importedAt });
  if (result.skip) {
    skipped.set(result.skip, (skipped.get(result.skip) || 0) + 1);
    continue;
  }
  products.set(result.product.id, result.product);
}
console.log(`${total} feed rows, ${products.size} products available for browsing`);
for (const [reason, count] of skipped) console.log(`  Skipped ${count}: ${reason}`);
if (!products.size) throw new Error('No usable products; existing discovery catalog unchanged');
if (!dryRun) {
  const output = resolve('src/lib/discovery-products.json');
  const previous = JSON.parse(readFileSync(output, 'utf8'));
  const sourceId = `awin:${advertiserId}:${feedId}`;
  const next = [...previous.products.filter(product => product.source_id !== sourceId), ...products.values()];
  writeFileSync(output + '.tmp', JSON.stringify({ products: next }, null, 2) + '\n');
  renameSync(output + '.tmp', output);
  console.log(`Updated discovery catalog: ${next.length} products total`);
}
