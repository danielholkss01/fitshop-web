'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Item = {
  id: string;
  category: 'top' | 'bottom' | 'shoe' | 'accessory';
  name: string;
  price_pennies: number;
  image_url?: string | null;
};

type Outfit = {
  total_price: number; // in pennies
  items: Item[];
};

type ApiResponse = { outfits: Outfit[] };

const toGBP = (pennies: number) => `£${(pennies / 100).toFixed(2)}`;

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);

  const API = process.env.NEXT_PUBLIC_API_BASE || '';
  const canCallApi = API.startsWith('http');

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('fitshop_profile') : null;
    if (raw) {
      try {
        const prof = JSON.parse(raw);
        if (prof?.budget) setBudget(Number(prof.budget));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  async function buildOutfit() {
    if (!canCallApi) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const profRaw = typeof window !== 'undefined' ? localStorage.getItem('fitshop_profile') : null;
      let payload: {
        topSize?: string;
        bottomSize?: string;
        shoeSize?: string;
        budget?: number;
      } = {};

      if (profRaw) {
        const p = JSON.parse(profRaw);
        payload = {
          topSize: p.topSize,
          bottomSize: p.bottomSize,
          shoeSize: p.shoeSize,
          budget: p.budget ? Number(p.budget) : undefined,
        };
      }

      const res = await fetch(`${API}/outfits/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
      }

      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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

      <p className="mb-4 text-gray-700">
        <span className="mr-3">
          <Link href="/profile" className="underline">
            Profile
          </Link>
        </span>
        <button
          onClick={buildOutfit}
          className="px-5 py-3 rounded-xl text-white disabled:opacity-50"
          style={{ background: canCallApi ? 'black' : 'gray' }}
          disabled={!canCallApi || loading}
          title={!canCallApi ? 'API not configured yet' : undefined}
        >
          {loading ? 'Styling…' : 'Build My Outfit'}
        </button>
      </p>

      {error && <div className="text-red-600 mb-4">Error: {error}</div>}

      {!data && !error && (
        <div className="text-gray-600">Click “Build My Outfit” to see suggestions (when API is online).</div>
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
                    <div className="w-20 h-20 relative flex-shrink-0">
                      <Image
                        src={it.image_url || 'https://picsum.photos/seed/placeholder/200/200'}
                        alt={it.name}
                        fill
                        sizes="80px"
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    </div>
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
