import { NextRequest, NextResponse } from 'next/server';
import { PrintifyNotConnectedError, printifyBlueprints } from '@/lib/printify';
import { browsePrintify, type CatalogAudience, type CatalogCategory } from '@/lib/printify-catalog';

const pageSize = 24;
const audiences = ['all', 'women', 'men', 'unisex'] as const;
const categories = ['all', 'clothing', 'dresses', 'tops', 'bottoms', 'outerwear', 'accessories'] as const;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80).toLowerCase() || '';
  const requestedAudience = request.nextUrl.searchParams.get('audience');
  const audience: CatalogAudience = audiences.find(value => value === requestedAudience) || 'all';
  const requestedCategory = request.nextUrl.searchParams.get('category');
  const category: CatalogCategory = categories.find(value => value === requestedCategory) || 'all';
  const requestedPage = Number(request.nextUrl.searchParams.get('page') || '0');
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  try {
    const blueprints = await printifyBlueprints();
    const matching = browsePrintify(blueprints, query, audience, category);
    return NextResponse.json({ products: matching.slice(page * pageSize, (page + 1) * pageSize), total: matching.length,
      nextPage: (page + 1) * pageSize < matching.length ? page + 1 : null });
  } catch (error) {
    const disconnected = error instanceof PrintifyNotConnectedError;
    return NextResponse.json({ error: disconnected ? error.message : 'Printify catalog is unavailable right now.' },
      { status: disconnected ? 503 : 502 });
  }
}
