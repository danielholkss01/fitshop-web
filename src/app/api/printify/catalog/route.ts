import { NextRequest, NextResponse } from 'next/server';
import { PrintifyNotConnectedError, printifyBlueprints } from '@/lib/printify';

const pageSize = 24;
const adultClothing = /\b(tee|t-shirt|shirt|polo|tank|hoodie|sweatshirt|sweater|jumper|dress|gown|skirt|jacket|coat|blazer|jeans|pants|trousers|shorts|leggings|joggers|shoes|boots|sneakers|trainers|socks|hat|cap|scarf|bag)s?\b/i;
const childClothing = /\b(kids?|children|boys?|girls?|baby|infants?|toddlers?|youth)\b/i;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80).toLowerCase() || '';
  const requestedPage = Number(request.nextUrl.searchParams.get('page') || '0');
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  try {
    const blueprints = await printifyBlueprints();
    const matching = blueprints.filter(item => `${item.title} ${item.brand} ${item.model}`.toLowerCase().includes(query));
    // Keep the whole Printify catalog reachable; just show adult clothing first.
    matching.sort((a, b) =>
      Number(adultClothing.test(b.title) && !childClothing.test(b.title))
      - Number(adultClothing.test(a.title) && !childClothing.test(a.title))
      || a.title.localeCompare(b.title));
    return NextResponse.json({ products: matching.slice(page * pageSize, (page + 1) * pageSize), total: matching.length,
      nextPage: (page + 1) * pageSize < matching.length ? page + 1 : null });
  } catch (error) {
    const disconnected = error instanceof PrintifyNotConnectedError;
    return NextResponse.json({ error: disconnected ? error.message : 'Printify catalog is unavailable right now.' },
      { status: disconnected ? 503 : 502 });
  }
}
