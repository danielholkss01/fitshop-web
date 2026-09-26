import type { Category } from '@/lib/outfits';

const fills: Record<string, string> = {
  white: '#f2f0ea', black: '#343638', navy: '#34455a', grey: '#92949a',
  blue: '#617f9b', brown: '#8e674c', tan: '#c2a582',
};
const ink = '#25292d';

export default function ItemArt({ category, color, name = '' }: { category: Category; color: string; name?: string }) {
  const fill = fills[color] ?? '#8f8278';
  const item = name.toLowerCase();
  const isShirt = item.includes('shirt') && !item.includes('t-shirt');
  const isPolo = item.includes('polo');
  const isRibbed = item.includes('ribbed');
  const isBlouse = item.includes('blouse');
  const isWide = item.includes('wide leg');
  const isJeans = item.includes('jeans');
  const isBoot = item.includes('boot');
  const isLoafer = item.includes('loafer');
  const isDerby = item.includes('derby');

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="item-art">
      {category === 'top' && (isRibbed ? (
        <>
          <path d="M43 18 32 23 34 39 40 39 40 83 Q60 91 80 83 V39 H86 L88 23 77 18 68 26 H52Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M52 18 Q60 37 68 18 M47 39 V81 M53 40 V84 M60 40 V86 M67 40 V84 M73 39 V81" fill="none" stroke={ink} strokeOpacity=".3" strokeWidth="1.3" />
        </>
      ) : isBlouse ? (
        <>
          <path d="M41 19 25 27 12 60 29 67 38 46 34 96 Q60 103 86 96 L82 46 91 67 108 60 95 27 79 19 70 31 H50Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M50 19 60 42 70 19 M60 42 V92 M39 76 Q60 85 81 76" fill="none" stroke={ink} strokeWidth="1.5" />
        </>
      ) : isShirt ? (
        <>
          <path d="M42 16 26 23 12 47 27 55 36 43 36 101 84 101 84 43 93 55 108 47 94 23 78 16 70 29 H50Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M50 16 60 37 70 16 M50 16 42 26 54 39 60 37 66 39 78 26 70 16 M60 37 V98 M58 51 H62 M58 64 H62 M58 77 H62" fill="none" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M42 18 26 24 12 47 29 56 37 43 37 99 83 99 83 43 91 56 108 47 94 24 78 18 70 28 H50Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          {isPolo ? (
            <path d="M50 18 60 35 70 18 M50 18 42 27 53 38 60 35 67 38 78 27 70 18 M60 35 V59 M58 45 H62 M58 53 H62" fill="none" stroke={ink} strokeWidth="1.6" />
          ) : (
            <path d="M50 18 Q60 39 70 18" fill="none" stroke={ink} strokeWidth="2" />
          )}
        </>
      ))}
      {category === 'bottom' && (
        <>
          <path d={isWide
            ? 'M33 17 H87 L96 104 H66 L60 54 54 104 H24Z'
            : isJeans
              ? 'M34 17 H86 L86 103 H64 L60 56 56 103 H34Z'
              : 'M34 17 H86 L80 103 H62 L60 54 58 103 H40Z'} fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M34 29 H86 M60 29 V54 M38 34 Q45 43 51 34 M69 34 Q75 43 82 34" fill="none" stroke={ink} strokeWidth="1.5" />
          {isJeans ? <path d="M39 22 H52 M68 22 H81 M45 42 V94 M75 42 V94" fill="none" stroke={ink} strokeOpacity=".55" strokeWidth="1.4" strokeDasharray="3 2" />
            : <path d="M53 31 50 48 M67 31 70 48" fill="none" stroke={ink} strokeOpacity=".45" strokeWidth="1.3" />}
        </>
      )}
      {category === 'shoe' && (isBoot ? (
        <>
          <path d="M35 21 H71 L72 65 Q83 78 102 79 L109 96 H24 Q17 95 17 88 L30 68Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 89 H106 M42 29 H65 M45 38 H67 M47 47 H69" fill="none" stroke={ink} strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M18 69 Q31 75 44 55 L64 65 Q76 77 95 77 Q108 78 110 90 Q110 98 101 99 H19 Q11 99 11 90 Q11 76 18 69Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          {isLoafer ? <path d="M39 70 Q56 85 82 79 M45 69 64 77" fill="none" stroke={ink} strokeWidth="2" />
            : isDerby ? <path d="M43 66 68 77 M48 64 52 72 M55 67 59 75 M62 70 66 78" fill="none" stroke={ink} strokeWidth="1.7" />
              : <path d="M16 88 H107 M49 68 58 73 M55 64 64 70" fill="none" stroke={ink} strokeWidth="2" />}
        </>
      ))}
      {category === 'accessory' && (item.includes('scarf') ? (
        <path d="M36 18 Q58 12 74 25 Q86 39 73 52 L69 102 H54 L55 53 Q44 51 39 43 L29 98 H15 L25 40 Q19 24 36 18Z" fill={fill} stroke={ink} strokeWidth="2" />
      ) : item.includes('cap') ? (
        <path d="M25 72 Q25 31 60 31 Q91 31 94 70 Q104 70 110 80 Q90 88 73 76 H28 Q18 82 10 78 Q15 73 25 72Z" fill={fill} stroke={ink} strokeWidth="2" />
      ) : item.includes('belt') ? (
        <>
          <path d="M12 55 H108 V69 H12Z" fill={fill} stroke={ink} strokeWidth="2" />
          <rect x="42" y="48" width="32" height="28" rx="3" fill="none" stroke={ink} strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M31 48 H89 L96 99 H24Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M43 51 V36 Q43 21 60 21 Q77 21 77 36 V51" fill="none" stroke={ink} strokeWidth="5" />
        </>
      ))}
    </svg>
  );
}
