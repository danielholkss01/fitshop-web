import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapAwinDiscoveryProduct } from '../scripts/awin-discovery-product.mjs';

const options = { advertiserId: '130505', publisherId: '3111579', audience: 'men', feedId: '118153', importedAt: '2026-10-01T15:30:00.000Z' };
const row = {
  merchant_id: '130505', merchant_name: 'Baccus', aw_product_id: '1234',
  product_name: 'HUGO - Polo Shirt - Navy', merchant_category: 'Polo Shirts',
  search_price: '55.00', currency: 'GBP', in_stock: '1', is_for_sale: '1',
  merchant_image_url: 'https://www.baccusstore.co.uk/polo.webp',
  aw_deep_link: 'https://www.awin1.com/pclick.php?p=1234&a=3111579&m=130505',
};

test('keeps a size-unknown item for browsing with its original image, price and affiliate link', () => {
  const { product } = mapAwinDiscoveryProduct(row, options);
  assert.equal(product.audience, 'men');
  assert.equal(product.price_pennies, 5500);
  assert.equal(product.image_url, row.merchant_image_url);
  assert.equal(product.product_url, row.aw_deep_link);
  assert.equal(product.sizes, undefined);
});

test('does not publish unsaleable items or another publisher’s links', () => {
  assert.equal(mapAwinDiscoveryProduct({ ...row, is_for_sale: '0' }, options).skip, 'not confirmed for sale');
  assert.equal(mapAwinDiscoveryProduct({ ...row, aw_deep_link: row.aw_deep_link.replace('a=3111579', 'a=999') }, options).skip, 'tracked link missing or for another account');
  assert.equal(mapAwinDiscoveryProduct({ ...row, merchant_category: 'Boys Polo Shirts' }, options).skip, 'not adult fashion');
});

test('a brand name containing Boys does not turn adult fashion into childrenswear', () => {
  const { product } = mapAwinDiscoveryProduct({ ...row, product_name: 'Billionaire Boys Club - Popover Hoodie - Orange', merchant_category: 'Hoodies & Sweatshirts' }, options);
  assert.equal(product.audience, 'men');
});
