// Curated sample combinations have a dedicated generated full-body photograph.
// Do not infer an image path for a new combination until the asset has been reviewed.
const lookIds = new Set([
  't2:b2:s1', 't3:b1:s1', 't3:b1:s3', 't3:b1:s2',
  't2:b1:s1', 't3:b2:s1', 't3:b3:s3', 't1:b1:s2',
  't1:b1:s3', 't1:b3:s2', 't3:b3:s2', 't1:b3:s3',
  'wt3:wb1:ws2', 'wt1:wb1:ws2', 'wt1:wb2:ws1', 'wt2:wb2:ws1',
  'wt2:wb2:ws3', 'wt3:wb3:ws2', 'wt1:wb3:ws2', 'wt3:wb1:ws3',
]);

export function demoLookImage(outfitId: string): string | undefined {
  return lookIds.has(outfitId) ? `/demo/looks/${outfitId.replaceAll(':', '-')}.webp` : undefined;
}
