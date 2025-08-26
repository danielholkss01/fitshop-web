'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Profile = {
  topSize: string;
  bottomSize: string;
  shoeSize: string;
  budget: number | '';
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    topSize: 'M',
    bottomSize: '32',
    shoeSize: 'UK 9',
    budget: '',
  });
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('fitshop_profile') : null;
    if (raw) {
      try {
        setProfile(JSON.parse(raw) as Profile);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'budget' ? (value === '' ? '' : Number(value)) : value,
    }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem('fitshop_profile', JSON.stringify(profile));
    setSaved(true);
  }

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      <label className="block">
        <span>Top Size</span>
        <select
          name="topSize"
          value={profile.topSize}
          onChange={handleChange}
          className="block w-full p-2 border rounded"
        >
          <option>XS</option>
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
        </select>
      </label>

      <label className="block">
        <span>Bottom Size</span>
        <input
          name="bottomSize"
          value={profile.bottomSize}
          onChange={handleChange}
          className="block w-full p-2 border rounded"
        />
      </label>

      <label className="block">
        <span>Shoe Size</span>
        <input
          name="shoeSize"
          value={profile.shoeSize}
          onChange={handleChange}
          className="block w-full p-2 border rounded"
        />
      </label>

      <label className="block">
        <span>Total Budget (£)</span>
        <input
          name="budget"
          type="number"
          value={profile.budget}
          onChange={handleChange}
          className="block w-full p-2 border rounded"
        />
      </label>

      <div className="flex items-center gap-3">
        <button onClick={save} className="px-6 py-3 rounded bg-black text-white">
          Save
        </button>
        {saved && <div className="text-green-700">Saved!</div>}
        <Link href="/" className="underline">
          Home
        </Link>
      </div>
    </main>
  );
}
