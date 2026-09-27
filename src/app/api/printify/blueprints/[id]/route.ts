import { NextResponse } from 'next/server';
import { printifyBlueprint, printifyProviders } from '@/lib/printify';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid product.' }, { status: 400 });
  try {
    const [product, providers] = await Promise.all([printifyBlueprint(id), printifyProviders(id)]);
    return NextResponse.json({ product, providers });
  } catch {
    return NextResponse.json({ error: 'Printify product details are unavailable right now.' }, { status: 502 });
  }
}
