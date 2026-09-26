'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ItemArt from './item-art';
import type { Outfit } from '@/lib/outfits';
import { defaultProfile, loadProfile, profileFor, type Audience, type Profile } from '@/lib/profile';

type Response = { outfits: Outfit[]; demo: true };
const money = (pennies: number) => '£' + (pennies / 100).toFixed(2);

export default function Home() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [result, setResult] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildOutfits = useCallback(async (selected: Profile) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/outfits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to build outfits right now');
      setResult(data as Response);
      window.setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to build outfits right now');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = loadProfile();
    setProfile(saved);
    if (new URLSearchParams(window.location.search).get('generate') === '1') {
      window.history.replaceState({}, '', '/');
      void buildOutfits(saved);
    }
  }, [buildOutfits]);

  function chooseAudience(audience: Audience) {
    const next = profileFor(audience, profile.budget);
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
              <span className="hero-note">A few details. Three fresh ideas.</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Photographs of men's and women's outfit inspiration">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="art-card art-top">
              {/* These local photos are styling examples, not products for sale. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/men-white-shirt.jpg" alt="White men's shirt on a hanger" />
              <span>MEN’S STYLE</span>
            </div>
            <div className="art-card art-bottom">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/women-white-shirt.jpg" alt="Woman wearing a white shirt and jeans" />
              <span>WOMEN’S STYLE</span>
            </div>
            <div className="art-card art-shoe">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/men-brown-loafers.jpg" alt="Brown leather loafers" />
              <span>THE DETAILS</span>
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
              <Link href="/profile" className="text-link">Change sizes or budget <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="builder-action">
              <div className="sparkle" aria-hidden="true">✳</div>
              <p>Good outfits start with the right fit.</p>
              <button type="button" className="button button-light" onClick={() => void buildOutfits(profile)} disabled={loading}>
                {loading ? 'Putting looks together…' : 'Build my outfits'} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          {error && <p role="alert" className="error-message">{error} Please try again.</p>}
        </section>

        {result && (
          <section id="results" className="results-section" aria-live="polite">
            <div className="section-heading">
              <div><span className="eyebrow">02 / YOUR LOOKS</span><h2>Made for your fit.</h2></div>
              <p>{result.demo ? 'Sample looks' : 'From partner stores'} within your £{profile.budget} budget.</p>
            </div>
            {result.outfits.length === 0 ? (
              <div className="empty-state">
                <span aria-hidden="true">✳</span>
                <h3>No complete looks within this budget yet.</h3>
                <p>Try increasing your budget or changing your sizes to see more sample combinations.</p>
                <Link href="/profile" className="button button-dark">Adjust my profile <span aria-hidden="true">↗</span></Link>
              </div>
            ) : (
              <div className="outfit-grid">
                {result.outfits.map((outfit, index) => (
                  <article className="outfit-card" key={outfit.items.map(item => item.id).join('-')}>
                    <div className="outfit-card-head"><span>LOOK 0{index + 1}{result.demo ? ' / DEMO' : ''}</span><strong>{money(outfit.total_price)}</strong></div>
                    <div className="outfit-art-grid">
                      {outfit.items.map(item => (
                        <div className={'outfit-art outfit-art-' + item.category} key={item.id}>
                          <ItemArt category={item.category} color={item.color_family} />
                          {item.image_url && (
                            // Sample photos are local. Partner image hosts vary and importer checks HTTPS URLs.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image_url} alt={result.demo ? `Styling example: ${item.name}` : item.name} loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="outfit-card-body">
                      <h3>{['The everyday edit', 'The easy pairing', 'The considered look'][index]}</h3>
                      <p>Colours that work together, in your size.</p>
                      <ul>{outfit.items.map(item => (
                        <li key={item.id}>
                          <div className="product-name">
                            <span>{item.name}</span>
                            {!result.demo && item.product_url && (
                              <a href={item.product_url} target="_blank" rel="sponsored noopener noreferrer">
                                View at {item.retailer} <span aria-hidden="true">↗</span>
                              </a>
                            )}
                          </div>
                          <strong>{money(item.price_pennies)}</strong>
                        </li>
                      ))}</ul>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="demo-note">
              {result.demo ? (
                <><strong>Sample looks:</strong> The photos show clothing styles, not products for sale. Sizes and prices are examples for testing the outfit builder. No store links are available yet.</>
              ) : (
                <><strong>Partner products:</strong> Check the final size, price, availability and delivery on the retailer’s site before buying. Fit&Shop may earn a commission from store links.</>
              )}
            </p>
          </section>
        )}

        <section id="how-it-works" className="how-section">
          <div><span className="eyebrow">A SIMPLER WAY TO SHOP</span><h2>Less scrolling.<br /><em>More wearing.</em></h2></div>
          <div className="how-steps">
            <div><span>01</span><h3>Set your fit</h3><p>Choose who you’re shopping for, then add your sizes and budget.</p></div>
            <div><span>02</span><h3>See complete looks</h3><p>Explore combinations of tops, bottoms and shoes that go together.</p></div>
            <div><span>03</span><h3>Shop with confidence</h3><p>When partner products are available, open each item at its store to purchase.</p></div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><span className="brand">fit<span>&</span>shop<span className="brand-dot">.</span></span><span>Outfits, without the overthinking.</span><span>Early product demo · Styling photos from <a href="https://www.pexels.com/" target="_blank" rel="noopener noreferrer">Pexels</a></span></footer>
    </div>
  );
}
