export type ColorCategory = 'foncee' | 'fluo' | 'spectre';

export interface ChameleonColor {
  id: number;
  code: string;
  nameFr: string;
  nameZh: string;
  category: ColorCategory;
  categoryLabelFr: string;
  primary: string;
  secondary: string;
  glow: string;
  soft: string;
  border: string;
  onPrimary: string;
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getContrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.66 ? '#0F172A' : '#FFFFFF';
}

const DARK_NAMES_FR = [
  'Indigo Abysses', 'Violet Obsidienne', 'Saphir Minuit', 'Émeraude Forêt Noire',
  'Bordeaux Impérial', 'Bleu Nuit Cosmique', 'Prune Royale', 'Vert Pin Profond',
  'Carmin Sombre', 'Ardoise Boréale', 'Teal Océanique', 'Bronze Antique',
  'Améthyste Ombre', 'Grenat Nocturne', 'Cobalt Profond', 'Brun Expresso',
  'Jade Impérial Foncé', 'Pourpre Byzantin', 'Bleu Pétrole', 'Cuivre Oxydé',
];

const DARK_NAMES_ZH = [
  '深渊靛蓝', '黑曜紫', '午夜蓝宝', '黑森林祖母绿',
  '帝国酒红', '宇宙夜蓝', '皇家深李紫', '深松墨绿',
  '暗绯红', '极光深石板', '深海鸭绿', '古董暗铜',
  '暗影紫晶', '夜光石榴红', '深邃钴蓝', '浓缩咖啡棕',
  '帝国深翡翠', '拜占庭深紫', '深石油蓝', '氧化暗铜',
];

const FLUO_NAMES_FR = [
  'Fluo Ultraviolet', 'Néon Cyber Magenta', 'Cyan Laser Fluo', 'Vert Citron Électrique',
  'Corail Atomique', 'Bleu Plasma Fluo', 'Rose Hyper-Néon', 'Menthe Électrique',
  'Ambre Fluo Solaire', 'Turquoise Acide', 'Fuchsia Synthwave', 'Or Fluo Pulsant',
  'Indigo Électrique', 'Mandarine Laser', 'Vert Boréal Fluo', 'Lavande Cybernétique',
  'Rouge Rubis Néon', 'Aigue-Marine Fluo', 'Violet Photon', 'Jaune Volt Fluo',
];

const FLUO_NAMES_ZH = [
  '荧光紫外线', '赛博霓虹洋红', '激光荧光青', '电光青柠绿',
  '原子荧光珊瑚', '等离子荧光蓝', '超霓虹亮粉', '电光薄荷绿',
  '太阳荧光琥珀', '酸性荧光绿松石', '合成波紫红', '脉动荧光金',
  '电光靛紫', '激光荧光柑橘', '极光荧光绿', '赛博荧光薰衣草',
  '霓虹红宝石', '荧光海蓝宝', '光子荧光紫', '伏特荧光黄',
];

const SPECTRE_NAMES_FR = [
  'Violet MindLabZ', 'Bleu Saphir Céleste', 'Émeraude Botanique', 'Rose Sakura Satin',
  'Ambre Miel Doré', 'Turquoise Lagune', 'Corail Méditerranée', 'Lavande Provence',
  'Rubis Velours', 'Bleu Glacier', 'Jade Céladon', 'Ocre Toscane',
  'Pervenche Iris', 'Pêche Aurore', 'Prune Veloutée', 'Vert Sauge Argenté',
  'Cramoisi Noble', 'Azur Riviera', 'Mauve Orchidée', 'Terre de Sienne',
];

const SPECTRE_NAMES_ZH = [
  '智心堂经典紫', '天穹蓝宝石', '植物祖母绿', '缎面樱花粉',
  '金蜜琥珀', '泻湖绿松石', '地中海珊瑚', '普罗旺斯薰衣草',
  '丝绒红宝', '冰川蔚蓝', '青瓷翡翠', '托斯卡纳赭金',
  '鸢尾长春花蓝', '极光蜜桃', '丝绒李子紫', '银鼠尾草绿',
  '高贵绯红', '里维埃拉天蓝', '兰花淡紫', '西耶纳暖棕',
];

function build240Palette(): ChameleonColor[] {
  const palette: ChameleonColor[] = [];
  let idCounter = 1;

  // We interleave categories (Spectre -> Foncée -> Fluo) across 80 triads = 240 colors total!
  // This ensures that every 30-second step naturally alternates across all styles
  // while also allowing filtering by category if desired.
  for (let i = 0; i < 80; i++) {
    const hueBase = (i * 4.5) % 360;

    // 1. Spectre Complet (Full Spectrum / Jewel & Satin tones)
    const hSpec = Math.round((hueBase + 258) % 360);
    const sSpec = 72 + (i % 4) * 5; // 72% - 87%
    const lSpec = 46 + (i % 3) * 4; // 46% - 54%
    const primarySpec = i === 0 ? '#6C4CF1' : hslToHex(hSpec, sSpec, lSpec);
    const secondarySpec = i === 0 ? '#532CD8' : hslToHex((hSpec + 22) % 360, sSpec, Math.max(32, lSpec - 10));
    const rgbSpec = hexToRgb(primarySpec);

    palette.push({
      id: idCounter,
      code: `#${String(idCounter).padStart(3, '0')}`,
      nameFr: `${SPECTRE_NAMES_FR[i % SPECTRE_NAMES_FR.length]} ${Math.floor(i / 20) + 1}`,
      nameZh: `${SPECTRE_NAMES_ZH[i % SPECTRE_NAMES_ZH.length]} · ${String(idCounter).padStart(3, '0')}`,
      category: 'spectre',
      categoryLabelFr: 'Spectre Chromatique',
      primary: primarySpec,
      secondary: secondarySpec,
      glow: `rgba(${rgbSpec.r}, ${rgbSpec.g}, ${rgbSpec.b}, 0.28)`,
      soft: `rgba(${rgbSpec.r}, ${rgbSpec.g}, ${rgbSpec.b}, 0.12)`,
      border: `rgba(${rgbSpec.r}, ${rgbSpec.g}, ${rgbSpec.b}, 0.36)`,
      onPrimary: getContrastText(primarySpec),
    });
    idCounter++;

    // 2. Couleur Foncée (Dark & Deep tones)
    const hDark = Math.round((hueBase + 195) % 360);
    const sDark = 62 + (i % 5) * 6; // 62% - 86%
    const lDark = 22 + (i % 4) * 4; // 22% - 34% (Rich Dark tones)
    const primaryDark = hslToHex(hDark, sDark, lDark);
    const secondaryDark = hslToHex((hDark + 18) % 360, Math.min(95, sDark + 8), Math.max(16, lDark - 6));
    const rgbDark = hexToRgb(primaryDark);

    palette.push({
      id: idCounter,
      code: `#${String(idCounter).padStart(3, '0')}`,
      nameFr: `${DARK_NAMES_FR[i % DARK_NAMES_FR.length]} ${Math.floor(i / 20) + 1}`,
      nameZh: `${DARK_NAMES_ZH[i % DARK_NAMES_ZH.length]} · ${String(idCounter).padStart(3, '0')}`,
      category: 'foncee',
      categoryLabelFr: 'Couleur Foncée',
      primary: primaryDark,
      secondary: secondaryDark,
      glow: `rgba(${rgbDark.r}, ${rgbDark.g}, ${rgbDark.b}, 0.32)`,
      soft: `rgba(${rgbDark.r}, ${rgbDark.g}, ${rgbDark.b}, 0.12)`,
      border: `rgba(${rgbDark.r}, ${rgbDark.g}, ${rgbDark.b}, 0.42)`,
      onPrimary: '#FFFFFF',
    });
    idCounter++;

    // 3. Couleur Fluo / Néon (Fluorescent & Electric tones)
    const hFluo = Math.round((hueBase + 310) % 360);
    const sFluo = 95 + (i % 2) * 5; // 95% - 100% saturation
    const lFluo = 50 + (i % 3) * 4; // 50% - 58% lightness (Vivid Fluo)
    const primaryFluo = hslToHex(hFluo, sFluo, lFluo);
    const secondaryFluo = hslToHex((hFluo + 28) % 360, 96, Math.max(42, lFluo - 8));
    const rgbFluo = hexToRgb(primaryFluo);

    palette.push({
      id: idCounter,
      code: `#${String(idCounter).padStart(3, '0')}`,
      nameFr: `${FLUO_NAMES_FR[i % FLUO_NAMES_FR.length]} ${Math.floor(i / 20) + 1}`,
      nameZh: `${FLUO_NAMES_ZH[i % FLUO_NAMES_ZH.length]} · ${String(idCounter).padStart(3, '0')}`,
      category: 'fluo',
      categoryLabelFr: 'Couleur Fluo / Néon',
      primary: primaryFluo,
      secondary: secondaryFluo,
      glow: `rgba(${rgbFluo.r}, ${rgbFluo.g}, ${rgbFluo.b}, 0.34)`,
      soft: `rgba(${rgbFluo.r}, ${rgbFluo.g}, ${rgbFluo.b}, 0.13)`,
      border: `rgba(${rgbFluo.r}, ${rgbFluo.g}, ${rgbFluo.b}, 0.45)`,
      onPrimary: getContrastText(primaryFluo),
    });
    idCounter++;
  }

  return palette;
}

export const CHAMELEON_PALETTE_240: ChameleonColor[] = build240Palette();
