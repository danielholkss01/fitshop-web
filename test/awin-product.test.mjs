import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapAwinProduct } from '../scripts/awin-product.mjs';

const settings = { format: 'legacy', advertiserId: '42', importedAt: '2026-09-27T00:00:00.000Z', sizeSystem: 'UK' };

test('legacy fashion rows retain the exact item, tracked link, size, brand and material', () => {
  const row = {
    merchant_id: '42', merchant_name: 'Example Store', aw_product_id: 'dress-12',
    product_name: 'Red Midi Dress', merchant_category: 'Women > Dresses', suitable_for: 'Female',
    search_price: '79.99', currency: 'GBP', colour: 'Burgundy', size: '12', material: 'Viscose',
    brand_name: 'Example Brand', in_stock: '1',
    aw_deep_link: 'https://www.awin1.com/pclick.php?p=1&a=2&m=42',
    merchant_image_url: 'https://images.example.com/dress.jpg',
  };
  const { product } = mapAwinProduct(row, settings);
  assert.equal(product.category, 'one-piece');
  assert.equal(product.audience, 'women');
  assert.equal(product.price_pennies, 7999);
  assert.deepEqual(product.sizes, ['12']);
  assert.equal(product.color_name, 'Burgundy');
  assert.equal(product.brand, 'Example Brand');
  assert.equal(product.material, 'Viscose');
  assert.match(product.product_url, /awin1\.com\/pclick/);
});

test('enhanced nested rows get a tracked Awin link and named shoe size', () => {
  const row = {
    meta: { advertiser_id: 42, advertiser_name: 'Example Store' },
    product_basic: { id: 'heels-1', title: 'Black Heels', link: 'https://shop.example.com/heels?colour=black', image_link: 'https://images.example.com/heels.jpg' },
    price_and_availability: { price: '45.00 GBP', availability: 'in_stock' },
    product_category: { product_type: 'Women > Shoes > Heels' },
    fashion: { gender: 'female', size: '6', size_system: 'UK', color: 'Black', material: 'Leather' },
  };
  const { product } = mapAwinProduct(row, { format: 'enhanced', publisherId: '123', importedAt: settings.importedAt });
  assert.equal(product.category, 'shoe');
  assert.deepEqual(product.sizes, ['UK 6']);
  assert.equal(product.price_pennies, 4500);
  const link = new URL(product.product_url);
  assert.equal(link.searchParams.get('awinmid'), '42');
  assert.equal(link.searchParams.get('awinaffid'), '123');
  assert.equal(link.searchParams.get('ued'), 'https://shop.example.com/heels?colour=black');
});

test('flat enhanced rows use the advertiser destination in a tracked link', () => {
  const row = {
    id: 'tee-1', title: 'Blue Cotton T-Shirt', product_type: 'Men > T-Shirts',
    link: 'https://shop.example.com/tee-1', image_link: 'https://images.example.com/tee.jpg',
    price: '20.00 GBP', availability: 'in_stock', age_group: 'adult', gender: 'male',
    size: 'M', color: 'Blue', brand: 'Example Brand',
  };
  const { product } = mapAwinProduct(row, { format: 'enhanced', advertiserId: '42', publisherId: '123', merchant: 'Example Store' });
  assert.equal(product.audience, 'men');
  assert.equal(product.category, 'top');
  assert.equal(product.price_pennies, 2000);
  assert.equal(product.brand, 'Example Brand');
  assert.equal(new URL(product.product_url).searchParams.get('ued'), row.link);
});

test('unverified stock, sizes, prices, audience and advertiser are excluded', () => {
  const base = {
    merchant_id: '42', merchant_name: 'Example Store', aw_product_id: 'polo-1',
    product_name: 'Navy Polo', merchant_category: 'Men > Polo Shirts', suitable_for: 'Male',
    search_price: '39.00', currency: 'GBP', colour: 'Navy', size: 'M', in_stock: '1',
    aw_deep_link: 'https://www.awin1.com/pclick.php?p=1&a=2&m=42',
    merchant_image_url: 'https://images.example.com/polo.jpg',
  };
  for (const patch of [{ in_stock: '0' }, { is_for_sale: '0' }, { size: '' }, { currency: 'USD' },
    { suitable_for: 'Boys' }, { age_group: 'kids' }, { merchant_id: '99' },
    { aw_deep_link: '', deep_link: 'https://shop.example.com/polo-1' },
    { aw_deep_link: 'https://shop.example.com/polo-1' }]) {
    assert.ok(mapAwinProduct({ ...base, ...patch }, settings).skip, JSON.stringify(patch));
  }
});

test('legacy HTTP Awin links are upgraded to HTTPS', () => {
  const row = {
    merchant_id: '42', merchant_name: 'Example Store', aw_product_id: 'shoe-1',
    product_name: 'Tan Dress Shoes', merchant_category: 'Men > Shoes', suitable_for: 'Male',
    search_price: '39.00', currency: 'GBP', colour: 'Tan', size: '9', in_stock: '1',
    aw_deep_link: 'http://www.awin1.com/pclick.php?p=1&a=2&m=42',
    merchant_image_url: 'https://images.example.com/shoes.jpg',
  };
  const { product } = mapAwinProduct(row, settings);
  assert.equal(product.category, 'shoe');
  assert.deepEqual(product.sizes, ['UK 9']);
  assert.match(product.product_url, /^https:\/\/www\.awin1\.com\/pclick/);
});
