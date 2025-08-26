'use client';

import { useEffect, useState } from 'react';

type Outfit = {
  total_price: number; // pennies
  items: { id: string; category: string; name: string; price_pennies: number; image_url?: string | null }[];
};
type ApiResponse = { outfits: Outfit[] };

const toGBP = (pennies: number) => `£${(pennies / 100).toFixed(2)}`;

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('fitshop_profile');
    if (raw) {
      const prof = JSON.parse(raw);
      if (prof.budget) setBudget(Number(prof.budget));
    }
  }, []);

  async function buildOutfit() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      const profRaw = localStorage.getItem('fitshop_profile');
      let payload: any = {};
      if (profRaw) {
        const p = JSON.parse(profRaw);
        payload = {
          topSize: p.topSize,
          bottomSize: p.bottomSize,
          shoeSize: p.shoeSize,
          budget: p.budget ? Number(p.budget) : undefined
        };
      }
      const res = await fetch(`${API}/outfits/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Fit&Shop — MVP</h1>
        {budget !== null && <div className="text-gray-700">Your budget: £{budget}</div>}
      </div>

      <div className="mb-6 space-x-3">
        <a href="/profile" className="underline">Profile</a>
        <button
          onClick={buildOutfit}
          className="px-5 py-3 rounded-xl bg-black text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Styling…' : 'Build My Outfit'}
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">Error: {error}</div>}

      {!data && !error && (
        <div className="text-gray-600">Click “Build My Outfit” to see suggestions.</div>
      )}

      {data && data.outfits.length === 0 && (
        <div className="text-gray-600">No outfits fit your sizes/budget. Try increasing your budget or adjusting sizes.</div>
      )}

      {data && data.outfits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.outfits.map((o, idx) => (
            <div key={idx} className="border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 font-semibold">Outfit #{idx + 1} — Total {toGBP(o.total_price)}</div>
              <div className="divide-y">
                {o.items.map((it) => (
                  <div key={it.id} className="p-4 flex gap-4 items-center">
                    <img
                      src={it.image_url || 'https://picsum.photos/seed/placeholder/200/200'}
                      alt={it.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{it.category}</div>
                    </div>
                    <div className="ml-auto font-semibold">{toGBP(it.price_pennies)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
