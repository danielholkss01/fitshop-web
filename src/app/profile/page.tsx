'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Audience = 'men' | 'women';
type Profile = {
  audience: Audience;
  topSize: string;
  bottomSize: string;
  shoeSize: string;
  budget: number | '';
};

const sizes: Record<Audience, { tops: string[]; bottoms: string[]; shoes: string[] }> = {
  men: {
    tops: ['XS', 'S', 'M', 'L', 'XL'],
    bottoms: ['30', '32', '34', '36'],
    shoes: ['UK 8', 'UK 9', 'UK 10'],
  },
  women: {
    tops: ['8', '10', '12', '14', '16'],
    bottoms: ['8', '10', '12', '14', '16'],
    shoes: ['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'],
  },
};

const defaultProfile: Profile = {
  audience: 'men',
  topSize: 'M',
  bottomSize: '32',
  shoeSize: 'UK 9',
  budget: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('fitshop_profile');
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Partial<Profile>;
        const audience: Audience = stored.audience === 'women' ? 'women' : 'men';
        const options = sizes[audience];
        setProfile({
          audience,
          topSize: options.tops.includes(stored.topSize ?? '') ? stored.topSize! : options.tops[0],
          bottomSize: options.bottoms.includes(stored.bottomSize ?? '') ? stored.bottomSize! : options.bottoms[0],
          shoeSize: options.shoes.includes(stored.shoeSize ?? '') ? stored.shoeSize! : options.shoes[0],
          budget: typeof stored.budget === 'number' ? stored.budget : '',
        });
      } catch {
        // Ignore invalid saved profiles.
      }
    }
  }, []);

  function chooseAudience(audience: Audience) {
    const options = sizes[audience];
    setProfile(prev => ({
      audience,
      topSize: options.tops[0],
      bottomSize: options.bottoms[0],
      shoeSize: options.shoes[0],
      budget: prev.budget,
    }));
    setSaved(false);
  }

  function changeSize(name: 'topSize' | 'bottomSize' | 'shoeSize', value: string) {
    setProfile(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem('fitshop_profile', JSON.stringify(profile));
    setSaved(true);
  }

  const options = sizes[profile.audience];

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      <label className="block">
        <span>Shopping for</span>
        <select
          value={profile.audience}
          onChange={e => chooseAudience(e.target.value as Audience)}
          className="block w-full p-2 border rounded"
        >
          <option value="men">Men</option>
          <option value="women">Women</option>
        </select>
      </label>

      {([
        ['topSize', 'Top size', options.tops],
        ['bottomSize', 'Bottom size', options.bottoms],
        ['shoeSize', 'Shoe size', options.shoes],
      ] as const).map(([name, label, values]) => (
        <label key={name} className="block">
          <span>{label}</span>
          <select
            value={profile[name]}
            onChange={e => changeSize(name, e.target.value)}
            className="block w-full p-2 border rounded"
          >
            {values.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      ))}

      <label className="block">
        <span>Total budget (£)</span>
        <input
          name="budget"
          type="number"
          min="1"
          value={profile.budget}
          onChange={e => {
            setProfile(prev => ({ ...prev, budget: e.target.value === '' ? '' : Number(e.target.value) }));
            setSaved(false);
          }}
          className="block w-full p-2 border rounded"
        />
      </label>

      <div className="flex items-center gap-3">
        <button onClick={save} className="px-6 py-3 rounded bg-black text-white">
          Save
        </button>
        {saved && <div className="text-green-700">Saved!</div>}
        <Link href="/" className="underline">Home</Link>
      </div>
    </main>
  );
}
