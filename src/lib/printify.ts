// Printify credentials stay on the server. Catalog blueprints are blank items;
// they are not priced, designed or ready to buy on Fit&Shop.
const baseUrl = 'https://api.printify.com/v1';

export class PrintifyNotConnectedError extends Error {}

export type PrintifyBlueprint = {
  id: number;
  title: string;
  brand: string;
  model: string;
  image: string;
};

export type PrintifyProvider = { id: number; title: string };
export type PrintifyPlaceholder = { position: string; decoration_method?: string; width: number; height: number };
export type PrintifyVariant = {
  id: number;
  title: string;
  options: Record<string, string>;
  placeholders: PrintifyPlaceholder[];
};

type RawBlueprint = { id?: unknown; title?: unknown; brand?: unknown; model?: unknown; images?: unknown };
const string = (value: unknown) => typeof value === 'string' ? value : '';
const number = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) ? value : 0;
function imageUrl(value: unknown) {
  try {
    const url = new URL(string(value));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch { return ''; }
}

async function printifyGet(path: string, revalidate: number): Promise<unknown> {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new PrintifyNotConnectedError('Printify catalog is being connected. You can still draft artwork below.');
  const response = await fetch(baseUrl + path, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'FitShop/0.1' },
    next: { revalidate },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Printify catalog unavailable (${response.status}).`);
  return response.json();
}

function blueprintFrom(raw: RawBlueprint): PrintifyBlueprint | null {
  const id = number(raw.id);
  const title = string(raw.title);
  if (!id || !title) return null;
  return {
    id, title, brand: string(raw.brand), model: string(raw.model),
    image: Array.isArray(raw.images) ? imageUrl(raw.images[0]) : '',
  };
}

export async function printifyBlueprints(): Promise<PrintifyBlueprint[]> {
  const data = await printifyGet('/catalog/blueprints.json', 3600);
  if (!Array.isArray(data)) throw new Error('Printify catalog format changed.');
  return data.map(item => blueprintFrom(item || {})).filter((item): item is PrintifyBlueprint => item !== null);
}

export async function printifyBlueprint(id: number): Promise<PrintifyBlueprint> {
  const data = await printifyGet(`/catalog/blueprints/${id}.json`, 3600);
  const blueprint = blueprintFrom((data || {}) as RawBlueprint);
  if (!blueprint) throw new Error('Printify product unavailable.');
  return blueprint;
}

export async function printifyProviders(id: number): Promise<PrintifyProvider[]> {
  const data = await printifyGet(`/catalog/blueprints/${id}/print_providers.json`, 900);
  if (!Array.isArray(data)) throw new Error('Printify provider format changed.');
  return data.map(item => ({ id: number(item?.id), title: string(item?.title) }))
    .filter(item => item.id && item.title);
}

export async function printifyVariants(id: number, providerId: number): Promise<PrintifyVariant[]> {
  const data = await printifyGet(`/catalog/blueprints/${id}/print_providers/${providerId}/variants.json`, 300);
  const rows = Array.isArray(data) ? data : (data && typeof data === 'object' && 'variants' in data ? data.variants : null);
  if (!Array.isArray(rows)) throw new Error('Printify variant format changed.');
  return rows.map(row => {
    const options = row?.options && typeof row.options === 'object' && !Array.isArray(row.options)
      ? Object.fromEntries(Object.entries(row.options).filter(([, value]) => typeof value === 'string')) as Record<string, string>
      : {};
    const placeholders = Array.isArray(row?.placeholders) ? row.placeholders.map((placeholder: Record<string, unknown>) => ({
      position: string(placeholder.position), decoration_method: string(placeholder.decoration_method) || undefined,
      width: number(placeholder.width), height: number(placeholder.height),
    })).filter((placeholder: PrintifyPlaceholder) => placeholder.position && placeholder.width && placeholder.height) : [];
    return { id: number(row?.id), title: string(row?.title), options, placeholders };
  }).filter(row => row.id && row.title && row.placeholders.length);
}
