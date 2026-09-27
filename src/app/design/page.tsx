'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import type { PrintifyBlueprint, PrintifyPlaceholder, PrintifyProvider, PrintifyVariant } from '@/lib/printify';
import type { CatalogAudience, CatalogCategory } from '@/lib/printify-catalog';

type CatalogResponse = { products: PrintifyBlueprint[]; total: number; nextPage: number | null; error?: string };
type ProductResponse = { product: PrintifyBlueprint; providers: PrintifyProvider[]; error?: string };
type VariantResponse = { variants: PrintifyVariant[]; error?: string };

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Please try again.');
  return data as T;
}

function catalogUrl(search: string, audience: CatalogAudience, category: CatalogCategory, page: number) {
  return `/api/printify/catalog?${new URLSearchParams({ q: search, audience, category, page: String(page) })}`;
}

function artworkSize(area?: PrintifyPlaceholder) {
  const width = area?.width || 1200;
  const height = area?.height || 1500;
  const ratio = Math.min(1, 5000 / width, 5000 / height);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

const areaKey = (area: PrintifyPlaceholder) => `${area.position}|${area.decoration_method || ''}`;

function drawArtwork(canvas: HTMLCanvasElement, area: PrintifyPlaceholder | undefined, text: string, ink: string, picture?: HTMLImageElement) {
  const { width, height } = artworkSize(area);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (picture) {
    const maxWidth = width * .76;
    const maxHeight = height * (text ? .57 : .76);
    const scale = Math.min(maxWidth / picture.width, maxHeight / picture.height);
    const pictureWidth = picture.width * scale;
    const pictureHeight = picture.height * scale;
    ctx.drawImage(picture, (width - pictureWidth) / 2, (height * .43) - pictureHeight / 2, pictureWidth, pictureHeight);
  }
  if (text) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ink;
    let fontSize = Math.round(width * .095);
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    while (fontSize > 18 && ctx.measureText(text).width > width * .82) {
      fontSize -= 4;
      ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    }
    ctx.fillText(text, width / 2, height * (picture ? .79 : .5));
  }
}

export default function DesignPage() {
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState<CatalogAudience>('all');
  const [category, setCategory] = useState<CatalogCategory>('all');
  const [products, setProducts] = useState<PrintifyBlueprint[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [product, setProduct] = useState<PrintifyBlueprint | null>(null);
  const [providers, setProviders] = useState<PrintifyProvider[]>([]);
  const [providerId, setProviderId] = useState(0);
  const [variants, setVariants] = useState<PrintifyVariant[]>([]);
  const [variantId, setVariantId] = useState(0);
  const [areaPosition, setAreaPosition] = useState('');
  const [productError, setProductError] = useState('');
  const [working, setWorking] = useState(false);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [designText, setDesignText] = useState('');
  const [ink, setInk] = useState('#242723');
  const [artError, setArtError] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const productRequest = useRef(0);
  const catalogRequest = useRef(0);

  const currentVariant = variants.find(item => item.id === variantId);
  const currentArea = currentVariant?.placeholders.find(item => areaKey(item) === areaPosition)
    || currentVariant?.placeholders[0];

  useEffect(() => {
    const controller = new AbortController();
    ++catalogRequest.current;
    setLoadingCatalog(true);
    const timeout = window.setTimeout(async () => {
      setCatalogError('');
      try {
        const data = await getJson<CatalogResponse>(catalogUrl(search, audience, category, 0), controller.signal);
        if (!controller.signal.aborted) {
          setProducts(data.products);
          setTotal(data.total);
          setNextPage(data.nextPage);
        }
      } catch (error) {
        if (!controller.signal.aborted) { setProducts([]); setCatalogError(error instanceof Error ? error.message : 'Catalog unavailable.'); }
      } finally {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      }
    }, search ? 280 : 0);
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [search, audience, category]);

  async function loadMore() {
    if (nextPage === null || loadingCatalog) return;
    const request = catalogRequest.current;
    setLoadingCatalog(true);
    try {
      const data = await getJson<CatalogResponse>(catalogUrl(search, audience, category, nextPage));
      if (request === catalogRequest.current) {
        setProducts(previous => [...previous, ...data.products]);
        setNextPage(data.nextPage);
      }
    } catch (error) {
      if (request === catalogRequest.current) setCatalogError(error instanceof Error ? error.message : 'Could not load more products.');
    } finally { if (request === catalogRequest.current) setLoadingCatalog(false); }
  }

  async function chooseProduct(item: PrintifyBlueprint) {
    const request = ++productRequest.current;
    setWorking(true);
    setProductError('');
    setProduct(null);
    setProviders([]);
    setVariants([]);
    setProviderId(0);
    setVariantId(0);
    try {
      const data = await getJson<ProductResponse>(`/api/printify/blueprints/${item.id}`);
      if (request !== productRequest.current) return;
      setProduct(data.product);
      setProviders(data.providers);
      setProviderId(data.providers[0]?.id || 0);
      if (!data.providers.length) setProductError('No print provider currently offers this item.');
    } catch (error) {
      if (request === productRequest.current) setProductError(error instanceof Error ? error.message : 'Product unavailable.');
    } finally { if (request === productRequest.current) setWorking(false); }
  }

  useEffect(() => {
    if (!product || !providerId) return;
    const controller = new AbortController();
    getJson<VariantResponse>(`/api/printify/blueprints/${product.id}/variants?provider=${providerId}`, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        setVariants(data.variants);
        setVariantId(data.variants[0]?.id || 0);
        if (!data.variants.length) setProductError('No printable size and colour options are currently available from this provider.');
      })
      .catch(error => { if (!controller.signal.aborted) setProductError(error instanceof Error ? error.message : 'Sizes unavailable.'); });
    return () => controller.abort();
  }, [product, providerId]);

  useEffect(() => { setAreaPosition(currentVariant?.placeholders[0] ? areaKey(currentVariant.placeholders[0]) : ''); }, [currentVariant]);

  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    if (!artwork) { drawArtwork(target, currentArea, designText.trim(), ink); return; }
    const url = URL.createObjectURL(artwork);
    const picture = new Image();
    let active = true;
    picture.onload = () => { if (active) drawArtwork(target, currentArea, designText.trim(), ink, picture); };
    picture.onerror = () => { if (active) setArtError('This image could not be opened. Please choose another PNG or JPEG.'); };
    picture.src = url;
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [artwork, designText, ink, currentArea]);

  function chooseArtwork(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) { setArtwork(null); return; }
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setArtError('Choose a PNG or JPEG image under 10 MB.');
      event.target.value = '';
      return;
    }
    setArtError('');
    setArtwork(file);
  }

  const downloadArtwork = useCallback(() => {
    if (!canvas.current || (!artwork && !designText.trim())) return;
    canvas.current.toBlob(blob => {
      if (!blob) { setArtError('Could not export this artwork.'); return; }
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `fitshop-artwork-${product?.id || 'draft'}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }, [artwork, designText, product]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Fit and Shop home">fit<span>&</span>shop<span className="brand-dot">.</span></Link>
        <nav aria-label="Main navigation"><Link href="/">Outfits</Link><Link href="/profile" className="nav-profile">Your fit <span aria-hidden="true">↗</span></Link></nav>
      </header>
      <main className="design-page">
        <div className="design-intro"><span className="eyebrow">DESIGN ON FIT&SHOP</span><h1>Make it yours.</h1>
          <p>Pick a blank item from Printify, choose a printable colour and size, then add your own artwork. You can draft artwork now. Ordering will open when checkout and fulfilment are connected.</p>
        </div>
        <section className="design-layout" aria-label="Create a design">
          <div className="design-catalog">
            <div className="design-section-title"><span className="eyebrow">01 / THE GARMENT</span><h2>Choose your canvas.</h2></div>
            <label className="design-label" htmlFor="catalog-search">Search the Printify catalog</label>
            <input id="catalog-search" className="design-input" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Try dress, polo, hoodie, shoes…" />
            <div className="design-filters">
              <div><label className="design-label" htmlFor="catalog-audience">Who is it for?</label>
                <select id="catalog-audience" className="design-input" value={audience} onChange={event => setAudience(event.target.value as CatalogAudience)}>
                  <option value="all">Everyone</option><option value="women">Women</option><option value="men">Men</option><option value="unisex">Unisex</option>
                </select></div>
              <div><label className="design-label" htmlFor="catalog-category">Type of item</label>
                <select id="catalog-category" className="design-input" value={category} onChange={event => setCategory(event.target.value as CatalogCategory)}>
                  <option value="all">All items</option><option value="clothing">Clothing</option><option value="dresses">Dresses & skirts</option>
                  <option value="tops">Tops & polos</option><option value="bottoms">Trousers & shorts</option>
                  <option value="outerwear">Jackets & coats</option><option value="accessories">Shoes & accessories</option>
                </select></div>
            </div>
            {catalogError && <p className="design-status" role="status">{catalogError}</p>}
            {!catalogError && <p className="design-count">{loadingCatalog && !products.length ? 'Loading products…' : `${total} products found`}</p>}
            {/^gowns?$/i.test(search.trim()) && !catalogError && <p className="design-count">Printify usually calls these dresses, so the search includes dresses.</p>}
            {!loadingCatalog && !catalogError && total === 0 && <p className="design-status">No matching Printify items. Try another search or set the filters to All items and Everyone.</p>}
            <div className="design-products">
              {products.map(item => (
                <button type="button" className={`design-product${product?.id === item.id ? ' selected' : ''}`} key={item.id} onClick={() => void chooseProduct(item)}>
                  {item.image ? (
                    // Printify supplies dynamic catalog image URLs; display them directly.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ) : <span className="design-no-photo">Photo unavailable</span>}
                  <span><strong>{item.title}</strong><small>{item.brand}{item.model ? ` · ${item.model}` : ''}</small></span>
                </button>
              ))}
            </div>
            {nextPage !== null && <button type="button" className="design-more" onClick={() => void loadMore()} disabled={loadingCatalog}>{loadingCatalog ? 'Loading…' : 'Show more products'}</button>}
            <p className="design-footnote">These are blank items for custom printing. Ready-to-wear brands need a separate shop catalog. The filters use Printify product names, so items without a clear category or audience may only appear under All items and Everyone.</p>
            {working && <p className="design-count">Checking print providers…</p>}
            {productError && <p className="error-message" role="alert">{productError}</p>}
            {product && <div className="design-variant-panel">
              <h3>{product.title}</h3>
              <p>Plain product photo. Your artwork is shown separately until we can generate an accurate product mockup.</p>
              <label className="design-label" htmlFor="design-provider">Print provider</label>
              <select id="design-provider" className="design-input" value={providerId} onChange={event => {
                setVariants([]); setVariantId(0); setProductError(''); setProviderId(Number(event.target.value));
              }}>{providers.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select>
              <label className="design-label" htmlFor="design-variant">Colour and size</label>
              <select id="design-variant" className="design-input" value={variantId} disabled={!variants.length} onChange={event => setVariantId(Number(event.target.value))}>
                {variants.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
              </select>
              {currentVariant && <><label className="design-label" htmlFor="design-area">Print area</label>
                <select id="design-area" className="design-input" value={areaPosition} onChange={event => setAreaPosition(event.target.value)}>
                  {currentVariant.placeholders.map(item => <option value={areaKey(item)} key={areaKey(item)}>{item.position.replaceAll('_', ' ')}{item.decoration_method ? ` · ${item.decoration_method}` : ''}</option>)}
                </select></>}
            </div>}
          </div>
          <div className="design-editor">
            <div className="design-section-title"><span className="eyebrow">02 / YOUR ARTWORK</span><h2>Make the print.</h2></div>
            <p className="design-explanation">This is the artwork file for a printable area. It is not a photo of the finished garment or a preview on your body.</p>
            <div className="design-preview"><canvas ref={canvas} aria-label="Preview of your print artwork" role="img" /></div>
            <label className="design-label" htmlFor="design-upload">Add a picture or logo</label>
            <input id="design-upload" className="design-input" type="file" accept="image/png,image/jpeg" onChange={chooseArtwork} />
            {artwork && <p className="design-count">{artwork.name} <button type="button" className="design-remove" onClick={() => setArtwork(null)}>Remove</button></p>}
            <label className="design-label" htmlFor="design-text">Add text</label>
            <input id="design-text" className="design-input" type="text" value={designText} maxLength={36} onChange={event => setDesignText(event.target.value)} placeholder="Your words here" />
            <label className="design-label" htmlFor="design-ink">Text colour</label>
            <input id="design-ink" className="design-colour" type="color" value={ink} onChange={event => setInk(event.target.value)} />
            {artError && <p className="error-message" role="alert">{artError}</p>}
            <button type="button" className="button button-dark design-download" onClick={downloadArtwork} disabled={!artwork && !designText.trim()}>Download artwork draft <span aria-hidden="true">↓</span></button>
            <p className="design-footnote">Your picture stays in this browser during this draft. No order is placed and no Printify account is needed to make artwork. Print quality and placement will need a final mockup review before purchase.</p>
          </div>
        </section>
      </main>
      <footer className="site-footer"><Link href="/" className="brand">fit<span>&</span>shop<span className="brand-dot">.</span></Link><span>Customer design studio · Early preview</span></footer>
    </div>
  );
}
