import type { Category } from '@/lib/outfits';

const fills: Record<string, string> = {
  white: '#eee9df',
  black: '#343638',
  navy: '#34455a',
  grey: '#92949a',
  blue: '#617f9b',
  brown: '#8e674c',
  tan: '#c2a582',
};

export default function ItemArt({
  category,
  color,
}: {
  category: Category;
  color: string;
}) {
  const fill = fills[color] ?? '#8f8278';
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={category} className="item-art">
      {category === 'top' && (
        <>
          <path d="M42 18 26 25 12 47 28 56 36 44 36 100 84 100 84 44 92 56 108 47 94 25 78 18 69 28 51 28Z" fill={fill} stroke="#25292d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M51 28 Q60 42 69 28 M60 39 V94" fill="none" stroke="#25292d" strokeWidth="2" />
        </>
      )}
      {category === 'bottom' && (
        <>
          <path d="M34 17 H86 L91 103 H66 L60 53 54 103 H29Z" fill={fill} stroke="#25292d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M34 30 H86 M60 30 V53" fill="none" stroke="#25292d" strokeWidth="2" />
        </>
      )}
      {category === 'shoe' && (
        <>
          <path d="M18 69 Q31 75 44 55 L64 65 Q76 77 95 77 Q108 78 110 90 Q110 97 101 98 H19 Q11 98 11 90 Q11 76 18 69Z" fill={fill} stroke="#25292d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 88 H107 M49 68 58 73 M55 64 64 70" fill="none" stroke="#25292d" strokeWidth="2" />
        </>
      )}
      {category === 'accessory' && (
        <>
          <path d="M31 48 H89 L96 99 H24Z" fill={fill} stroke="#25292d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M43 51 V36 Q43 21 60 21 Q77 21 77 36 V51" fill="none" stroke="#25292d" strokeWidth="5" />
        </>
      )}
    </svg>
  );
}
