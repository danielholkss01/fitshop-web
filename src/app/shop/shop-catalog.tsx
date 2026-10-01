'use client';

import { useMemo, useState } from 'react';

export type DiscoveryProduct = {
  id: string;
  source_id: string;
  retailer: string;
  audience: 'men' | 'women' | 'unisex';
  category: string;
  name: string;
  brand: string;
  price_pennies: number;
  image_url: string;
  product_url: string;
  updated_at: string;
};

const money = (pennies: number) => '£' + (pennies / 100).toFixed(2);

export default function ShopCatalog({ products }: { products: DiscoveryProduct[] }) {
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState('all');
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [visible, setVisible] = useState(24);
  const categories = useMemo(() => [...new Set(products.map(product => product.category))].sort(), [products]);
  const matching = useMemo(() => products.filter(product =>
    (audience === 'all' || product.audience === audience || product.audience === 'unisex') &&
    (category === 'all' || product.category === category) &&
    (!maxPrice || product.price_pennies <= Number(maxPrice) * 100) &&
    `${product.name} ${product.brand} ${product.retailer}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [products, audience, category, maxPrice, search]);

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setVisible(24);
  }

  return (
    <>
      <div className="shop-filters">
        <label>Search clothes or brands
          <input type="search" value={search} placeholder="e.g. polo, Lacoste" onChange={event => changeFilter(setSearch, event.target.value)} />
        </label>
        <label>Shop for
          <select value={audience} onChange={event => changeFilter(setAudience, event.target.value)}>
            <option value="all">Everyone</option><option value="men">Men</option><option value="women">Women</option>
          </select>
        </label>
        <label>Category
          <select value={category} onChange={event => changeFilter(setCategory, event.target.value)}>
            <option value="all">All clothing</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Maximum price (£)
          <input type="number" min="0" step="1" inputMode="numeric" value={maxPrice} placeholder="Any" onChange={event => changeFilter(setMaxPrice, event.target.value)} />
        </label>
      </div>
      <p className="shop-count">Showing {Math.min(visible, matching.length)} of {matching.length} matching products</p>
      {matching.length ? (
        <div className="shop-grid">
          {matching.slice(0, visible).map(product => (
            <article className="shop-card" key={product.id}>
              <a href={product.product_url} target="_blank" rel="sponsored noopener noreferrer" aria-label={`View ${product.name} at ${product.retailer}`} className="shop-image-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_url} alt={product.name} loading="lazy" referrerPolicy="no-referrer" />
              </a>
              <div className="shop-card-details">
                <span className="shop-card-category">{product.category} · {product.retailer}</span>
                <h2>{product.name}</h2>
                <strong>{money(product.price_pennies)}</strong>
                <a href={product.product_url} target="_blank" rel="sponsored noopener noreferrer">Check sizes at {product.retailer} <span aria-hidden="true">↗</span></a>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="shop-no-results">No products match these filters. Try another category or price.</p>}
      {matching.length > visible && <div className="more-looks"><button type="button" className="button button-dark" onClick={() => setVisible(count => count + 24)}>Show more products <span aria-hidden="true">↓</span></button></div>}
      <p className="shop-disclosure">These are retailer product photos and feed prices, not virtual try-ons or size-matched recommendations. Confirm size, price, availability and delivery at the store. Fit&Shop may earn a commission from these links.</p>
    </>
  );
}
