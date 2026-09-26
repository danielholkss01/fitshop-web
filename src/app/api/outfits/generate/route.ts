import { NextResponse } from 'next/server';
import { generateOutfits } from '@/lib/outfits';
import { normalizeProfile } from '@/lib/profile';

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
  }
  const profile = normalizeProfile(input);
  const rawBudget = Number((input as { budget?: unknown }).budget);
  if (!Number.isFinite(rawBudget) || rawBudget <= 0 || rawBudget > 10000) {
    return NextResponse.json({ error: 'Enter a budget between £1 and £10,000' }, { status: 400 });
  }

  return NextResponse.json({ outfits: generateOutfits(profile), demo: true });
}
