'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import ItemArt from '../item-art';
import { defaultProfile, loadProfile, profileFor, sizes, type Audience, type Profile } from '@/lib/profile';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [error, setError] = useState('');

  useEffect(() => setProfile(loadProfile()), []);

  function chooseAudience(audience: Audience) {
    setProfile(profileFor(audience, profile.budget));
    setError('');
  }

  function saveAndBuild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(profile.budget) || profile.budget < 1 || profile.budget > 10000) {
      setError('Enter a budget between £1 and £10,000.');
      return;
    }
    localStorage.setItem('fitshop_profile', JSON.stringify(profile));
    window.location.assign('/?generate=1');
  }

  const options = sizes[profile.audience];
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Fit and Shop home">fit<span>&</span>shop<span className="brand-dot">.</span></Link>
        <nav aria-label="Main navigation"><Link href="/">Back to home</Link><span className="nav-profile">Your fit <span aria-hidden="true">↗</span></span></nav>
      </header>
      <main className="profile-page">
        <div className="profile-intro">
          <span className="eyebrow"><span className="eyebrow-line" /> YOUR FIT PROFILE</span>
          <h1>Great style starts <em>with you.</em></h1>
          <p>Tell us what fits and what you want to spend. We’ll use it to put together looks you can actually picture wearing.</p>
          <div className="profile-visual">
            <div className="profile-art"><ItemArt category="top" color="white" /></div>
            <div className="profile-art"><ItemArt category="bottom" color="navy" /></div>
            <div className="profile-art"><ItemArt category="shoe" color="brown" /></div>
            <div className="profile-visual-caption">A whole look, made around your budget.</div>
          </div>
          <p className="profile-privacy">Your preferences stay in this browser for this demo. No address or account is needed.</p>
        </div>
        <form className="profile-form" onSubmit={saveAndBuild}>
          <div className="form-heading"><span className="eyebrow">01 / THE DETAILS</span><h2>Make it yours.</h2><p>You can change these whenever you like.</p></div>
          <fieldset className="form-group">
            <legend className="field-label">SHOPPING FOR</legend>
            <div className="audience-switch audience-switch-form">
              <button type="button" className={profile.audience === 'men' ? 'selected' : ''} aria-pressed={profile.audience === 'men'} onClick={() => chooseAudience('men')}>Men</button>
              <button type="button" className={profile.audience === 'women' ? 'selected' : ''} aria-pressed={profile.audience === 'women'} onClick={() => chooseAudience('women')}>Women</button>
            </div>
          </fieldset>
          <div className="form-divider" />
          <div className="form-row">
            <label className="form-group"><span>Top size</span><select value={profile.topSize} onChange={e => setProfile({ ...profile, topSize: e.target.value })}>{options.tops.map(size => <option key={size}>{size}</option>)}</select></label>
            <label className="form-group"><span>Bottom size</span><select value={profile.bottomSize} onChange={e => setProfile({ ...profile, bottomSize: e.target.value })}>{options.bottoms.map(size => <option key={size}>{size}</option>)}</select></label>
          </div>
          <div className="form-row">
            <label className="form-group"><span>Shoe size</span><select value={profile.shoeSize} onChange={e => setProfile({ ...profile, shoeSize: e.target.value })}>{options.shoes.map(size => <option key={size}>{size}</option>)}</select></label>
            <label className="form-group"><span>Total outfit budget</span><span className="currency-input"><span>£</span><input type="number" min="1" max="10000" step="1" value={profile.budget} onChange={e => setProfile({ ...profile, budget: Number(e.target.value) })} required /></span></label>
          </div>
          <p className="form-hint">This budget covers the complete outfit, not each individual item.</p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="button button-dark form-submit" type="submit">Save and see my outfits <span aria-hidden="true">→</span></button>
          <p className="form-footnote">You’ll see sample looks first. Shopping links will follow when stores join Fit&Shop.</p>
        </form>
      </main>
      <footer className="site-footer"><span className="brand">fit<span>&</span>shop<span className="brand-dot">.</span></span><span>Outfits, without the overthinking.</span><span>Early product demo</span></footer>
    </div>
  );
}
