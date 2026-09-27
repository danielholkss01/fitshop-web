'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Outfit } from '@/lib/outfits';
import { demoLookImage } from '@/lib/demo-look-images';
import { defaultProfile, loadProfile, profileFor, type Audience, type Profile } from '@/lib/profile';

type Response = { outfits: Outfit[]; demo: boolean; total: number; nextPage: number | null };
const money = (pennies: number) => '£' + (pennies / 100).toFixed(2);

export default function Home() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [result, setResult] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const buildOutfits = useCallback(async (selected: Profile) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selected, page: 0 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to build outfits right now');
      if (requestId.current !== currentRequest) return;
      setResult(data as Response);
      window.setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (cause) {
      if (requestId.current === currentRequest) setError(cause instanceof Error ? cause.message : 'Unable to build outfits right now');
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  async function loadMore() {
    if (!result || result.nextPage === null || loadingMore) return;
    const currentRequest = requestId.current;
    setLoadingMore(true);
    setError('');
    try {
      const response = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, page: result.nextPage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load more looks');
      if (requestId.current !== currentRequest) return;
      setResult(previous => previous ? { ...data, outfits: [...previous.outfits, ...data.outfits] } as Response : data as Response);
    } catch (cause) {
      if (requestId.current === currentRequest) setError(cause instanceof Error ? cause.message : 'Unable to load more looks');
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const saved = loadProfile();
    setProfile(saved);
    if (new URLSearchParams(window.location.search).get('generate') === '1') {
      window.history.replaceState({}, '', '/');
      void buildOutfits(saved);
    }
  }, [buildOutfits]);

  function chooseAudience(audience: Audience) {
    ++requestId.current;
    setLoading(false);
    setError('');
    const next = profileFor(audience, profile.budget, profile);
    setProfile(next);
    setResult(null);
    localStorage.setItem('fitshop_profile', JSON.stringify(next));
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Fit and Shop home">fit<span>&</span>shop<span className="brand-dot">.</span></Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/profile" className="nav-profile">Your fit <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> THE OUTFIT EDIT</span>
            <h1>Get dressed without <em>the guesswork.</em></h1>
            <p>Tell us your sizes and budget. We’ll put together complete looks that work together, so you can spend less time deciding what to wear.</p>
            <div className="hero-actions">
              <a href="#build" className="button button-dark">Find my outfits <span aria-hidden="true">↗</span></a>
              <span className="hero-note">A few details. Looks for your taste.</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Generated examples of men's and women's complete outfits">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="art-card art-top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/looks/t2-b2-s1.webp" alt="Man wearing a black T-shirt, black jeans and white trainers" />
              <span>MEN’S SAMPLE LOOK</span>
            </div>
            <div className="art-card art-bottom">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/looks/wt1-wb2-ws1.webp" alt="Woman wearing a white shirt, blue straight-leg jeans and white trainers" />
              <span>WOMEN’S SAMPLE LOOK</span>
            </div>
            <div className="art-stamp">YOUR LOOK<br /><strong>MADE EASY</strong></div>
          </div>
        </section>

        <section id="build" className="builder-section">
          <div className="section-heading">
            <div><span className="eyebrow">01 / START HERE</span><h2>Let’s put a look together.</h2></div>
            <p>Try the sample catalogue now. Partner store products appear here when available.</p>
          </div>
          <div className="builder-panel">
            <div className="builder-main">
              <span className="field-label">WHO ARE WE STYLING?</span>
              <div className="audience-switch" role="group" aria-label="Shopping for">
                <button type="button" className={profile.audience === 'men' ? 'selected' : ''} aria-pressed={profile.audience === 'men'} onClick={() => chooseAudience('men')}>Men</button>
                <button type="button" className={profile.audience === 'women' ? 'selected' : ''} aria-pressed={profile.audience === 'women'} onClick={() => chooseAudience('women')}>Women</button>
              </div>
              <div className="fit-summary">
                <div><span>TOP</span><strong>{profile.topSize}</strong></div>
                <div><span>BOTTOM</span><strong>{profile.bottomSize}</strong></div>
                <div><span>SHOE</span><strong>{profile.shoeSize}</strong></div>
                <div><span>BUDGET</span><strong>£{profile.budget}</strong></div>
              </div>
              <p className="taste-summary">Style: {profile.style === 'any' ? 'open to options' : profile.style} · Occasion: {profile.occasion === 'any' ? 'any' : profile.occasion.replace('-', ' ')}{profile.avoidedColors.length ? ` · Skipping ${profile.avoidedColors.join(', ')}` : ''}</p>
              <Link href="/profile" className="text-link">Change sizes or taste <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="builder-action">
              <div className="sparkle" aria-hidden="true">✳</div>
              <p>Good outfits start with what you like.</p>
              <button type="button" className="button button-light" onClick={() => void buildOutfits(profile)} disabled={loading}>
                {loading ? 'Putting looks together…' : 'Build my outfits'} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          {error && !result && <p role="alert" className="error-message">{error} Please try again.</p>}
        </section>

        {result && (
          <section id="results" className="results-section" aria-live="polite">
            <div className="section-heading">
              <div><span className="eyebrow">02 / YOUR LOOKS</span><h2>Looks for your choices.</h2></div>
              <p>{result.demo ? `Sample combinations using a £${profile.budget} example budget` : `Partner items within your £${profile.budget} budget`}. Showing {result.outfits.length} of {result.total} looks.</p>
            </div>
            {result.outfits.length === 0 ? (
              <div className="empty-state">
                <span aria-hidden="true">✳</span>
                <h3>No complete looks for these choices yet.</h3>
                <p>Try increasing your budget or changing your sizes, style, occasion or colours.</p>
                <Link href="/profile" className="button button-dark">Adjust my profile <span aria-hidden="true">↗</span></Link>
              </div>
            ) : (
              <div className="outfit-grid">
                {result.outfits.map((outfit, index) => (
                  <article className="outfit-card" key={outfit.items.map(item => item.id).join('-')}>
                    <div className="outfit-card-head"><span>LOOK {String(index + 1).padStart(2, '0')}{result.demo ? ' / DEMO' : ''}</span><span>{outfit.style.toUpperCase()}</span></div>
                    {result.demo && demoLookImage(outfit.id) && (
                      <div className="outfit-model">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={demoLookImage(outfit.id)} alt={`Generated model wearing ${outfit.items.map(item => item.name).join(', ')}`} loading="lazy" />
                        <span>Generated styling example</span>
                      </div>
                    )}
                    <div className="outfit-card-body">
                      <h3>{outfit.style[0].toUpperCase() + outfit.style.slice(1)} look</h3>
                      <p>{outfit.reason} {result.demo ? 'The details below come from this same example image.' : 'Check each retailer’s fit guide before buying.'}</p>
                      <ul className="outfit-items">{outfit.items.map(item => (
                        <li className="outfit-item" key={item.id}>
                          <div className={`outfit-item-visual${result.demo ? ' demo-crop' : ''}`}>
                            {result.demo && demoLookImage(outfit.id) ? (
                              // A detail crop from the exact full-body photo above.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img className={`crop-${item.category}`} src={demoLookImage(outfit.id)} alt={`Detail of ${item.name} in this look`} loading="lazy" />
                            ) : <span className="image-placeholder">Image unavailable</span>}
                            {!result.demo && item.image_url && (
                              // Approved partner images represent the linked product.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image_url} alt={item.name} loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} />
                            )}
                          </div>
                          <div className="outfit-item-details">
                            <span className="outfit-item-category">{item.garment_type || (item.category === 'one-piece' ? 'Dress or one-piece' : item.category)}</span>
                            <strong>{item.name}</strong>
                            {!result.demo && (item.brand || item.material || item.style_details?.length) && <span className="outfit-item-meta">{[item.brand, item.material, item.style_details?.join(', ')].filter(Boolean).join(' · ')}</span>}
                            {!result.demo && item.product_url && (
                              <a href={item.product_url} target="_blank" rel="sponsored noopener noreferrer">
                                View at {item.retailer} <span aria-hidden="true">↗</span>
                              </a>
                            )}
                          </div>
                          <strong className="outfit-item-price">{money(item.price_pennies)}</strong>
                        </li>
                      ))}</ul>
                      <div className="outfit-total"><span>Outfit total</span><strong>{money(outfit.total_price)}</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {result.nextPage !== null && <div className="more-looks"><button type="button" className="button button-dark" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Finding more looks…' : 'Show more looks'} <span aria-hidden="true">↓</span></button></div>}
            {error && <p role="alert" className="error-message">{error} Please try again.</p>}
            <p className="demo-note">
              {result.demo ? (
                <><strong>Sample looks:</strong> The model images are generated styling examples of the listed combinations. Detail crops come from the same image. These are not retailer product photos, a preview of your own body, or a guarantee of fit. Sizes and prices are illustrative.</>
              ) : (
                <><strong>Partner products:</strong> Check the final size, price, availability and delivery on the retailer’s site before buying. Fit&Shop may earn a commission from store links.</>
              )}
            </p>
          </section>
        )}

        <section id="how-it-works" className="how-section">
          <div><span className="eyebrow">A SIMPLER WAY TO SHOP</span><h2>Less scrolling.<br /><em>More wearing.</em></h2></div>
          <div className="how-steps">
            <div><span>01</span><h3>Set your fit and taste</h3><p>Choose sizes, budget, style, occasion and colours to skip.</p></div>
            <div><span>02</span><h3>See complete looks</h3><p>Explore dresses, separates, layers and shoes that go together as the catalogue grows.</p></div>
            <div><span>03</span><h3>Shop with confidence</h3><p>When partner products are available, open each item at its store to purchase.</p></div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><span className="brand">fit<span>&</span>shop<span className="brand-dot">.</span></span><span>Outfits, without the overthinking.</span><span>Early product demo · Generated sample looks</span></footer>
    </div>
  );
}
