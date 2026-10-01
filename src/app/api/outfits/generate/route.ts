import { NextResponse } from 'next/server';
import { outfitPage } from '@/lib/outfits';
import { normalizeProfile } from '@/lib/profile';
import { normalizeFeedback } from '@/lib/outfit-feedback';

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

  const page = (input as { page?: unknown }).page ?? 0;
  if (!Number.isSafeInteger(page) || Number(page) < 0) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
  }

  const pageSize = 6;
  if (!Number.isSafeInteger((Number(page) + 1) * pageSize)) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
  }
  const feedback = normalizeFeedback((input as { feedback?: unknown }).feedback);
  return NextResponse.json(outfitPage(profile, Number(page), pageSize, feedback));
}
