import Link from 'next/link';
import catalog from '@/lib/discovery-products.json';
import ShopCatalog, { type DiscoveryProduct } from './shop-catalog';

// Recheck feed age on each request so stale prices and stock do not remain online.
export const dynamic = 'force-dynamic';
const maxFeedAge = 7 * 24 * 60 * 60 * 1000;

export default function ShopPage() {
  const now = Date.now();
  const products = (catalog.products as DiscoveryProduct[]).filter(product => {
    const age = now - Date.parse(product.updated_at);
    return age >= 0 && age < maxFeedAge;
  });

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Fit and Shop home">fit<span>&</span>shop<span className="brand-dot">.</span></Link>
        <nav aria-label="Main navigation">
          <Link href="/">Outfit builder</Link>
          <Link href="/profile" className="nav-profile">Your fit <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>
      <main className="shop-page">
        <div className="shop-intro">
          <span className="eyebrow">REAL PARTNER PRODUCTS</span>
          <h1>Explore the pieces.</h1>
          <p>Browse clothing from partner stores, with the retailer’s product photo and price. Choose your size on the retailer’s website before buying.</p>
        </div>
        {products.length ? <ShopCatalog products={products} /> : (
          <div className="empty-state">
            <h2>Partner products are being refreshed.</h2>
            <p>We hide a feed after seven days until we have current prices and availability again.</p>
            <Link className="button button-dark" href="/">Explore sample outfits <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </main>
      <footer className="site-footer"><Link href="/" className="brand">fit<span>&</span>shop<span className="brand-dot">.</span></Link><span>Outfits, without the overthinking.</span><span>Partner links may earn a commission.</span></footer>
    </div>
  );
}
