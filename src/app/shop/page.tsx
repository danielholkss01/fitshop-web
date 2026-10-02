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
          <span className="eyebrow">STORE CATALOG</span>
          <h1>Store products are unavailable.</h1>
          <p>Our outfit builder still has sample looks for men and women. We’ll add store products here when an active partnership is in place.</p>
        </div>
        {products.length ? <ShopCatalog products={products} /> : (
          <div className="empty-state">
            <h2>No store products right now.</h2>
            <p>Explore sample outfits while we work on new retailer partnerships.</p>
            <Link className="button button-dark" href="/">Explore sample outfits <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </main>
      <footer className="site-footer"><Link href="/" className="brand">fit<span>&</span>shop<span className="brand-dot">.</span></Link><span>Outfits, without the overthinking.</span><span>Early product demo</span></footer>
    </div>
  );
}
