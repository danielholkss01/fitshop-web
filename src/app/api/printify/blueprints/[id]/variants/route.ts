import { NextRequest, NextResponse } from 'next/server';
import { printifyVariants } from '@/lib/printify';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const providerId = Number(request.nextUrl.searchParams.get('provider'));
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(providerId) || providerId <= 0) {
    return NextResponse.json({ error: 'Invalid product or provider.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ variants: await printifyVariants(id, providerId) });
  } catch {
    return NextResponse.json({ error: 'Printify sizes and colours are unavailable right now.' }, { status: 502 });
  }
}
