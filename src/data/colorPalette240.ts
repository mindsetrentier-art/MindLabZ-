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
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  // Relative WCAG luminance
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.38 ? '#181411' : '#FAF8F5';
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

  // Curated gallery chromatic tuning: nuanced saturation & analogous depth across 240 tones
  for (let i = 0; i < 80; i++) {
    const hueBase = (i * 4.5) % 360;

    // 1. Spectre Chromatique (Velvety Jewel & Satin Gallery tones)
    const hSpec = Math.round((hueBase + 258) % 360);
    const sSpec = 48 + (i % 4) * 5; // 48% - 63% refined saturation
    const lSpec = 41 + (i % 3) * 4; // 41% - 49% rich mid-luminance
    const primarySpec = i === 0 ? '#5B45B8' : hslToHex(hSpec, sSpec, lSpec);
    const secondarySpec = i === 0 ? '#3E2C8A' : hslToHex((hSpec + 15) % 360, Math.max(40, sSpec - 4), Math.max(28, lSpec - 9));
    const rgbSpec = hexToRgb(primarySpec);

    palette.push({
      id: idCounter,
      code: `#${String(idCounter).padStart(3, '0')}`,
      nameFr: `${SPECTRE_NAMES_FR[i % SPECTRE_NAMES_FR.length]} ${Math.floor(i / 20) + 1}`,
      nameZh: `${SPECTRE_NAMES_ZH[i % SPECTRE_NAMES_ZH.length]} · ${String(idCounter).padStart(3, '0')}`,
      category: 'spectre',
      categoryLabelFr: 'Spectre Satin',
      primary: primarySpec,
      secondary: secondarySpec,
      glow: `rgba(${rgbSpec.r}, ${rgbSpec.g}, ${rgbSpec.b}, 0.22)`,
      soft: `rgba(${rgbSpec.r}, ${rgbSpec.g}, ${rgbSpec.b}, 0.08)`,
      border: `rgba(${rgbSpec.r}, ${rgbSpec.g}, ${rgbSpec.b}, 0.28)`,
      onPrimary: getContrastText(primarySpec),
    });
    idCounter++;

    // 2. Couleur Foncée (Mineral Obsidian, Prussian & Patina Bronze tones)
    const hDark = Math.round((hueBase + 195) % 360);
    const sDark = 38 + (i % 5) * 4; // 38% - 54% mineral nuance
    const lDark = 18 + (i % 4) * 3; // 18% - 27% deep gallery shadow
    const primaryDark = hslToHex(hDark, sDark, lDark);
    const secondaryDark = hslToHex((hDark + 14) % 360, Math.min(62, sDark + 6), Math.max(13, lDark - 5));
    const rgbDark = hexToRgb(primaryDark);

    palette.push({
      id: idCounter,
      code: `#${String(idCounter).padStart(3, '0')}`,
      nameFr: `${DARK_NAMES_FR[i % DARK_NAMES_FR.length]} ${Math.floor(i / 20) + 1}`,
      nameZh: `${DARK_NAMES_ZH[i % DARK_NAMES_ZH.length]} · ${String(idCounter).padStart(3, '0')}`,
      category: 'foncee',
      categoryLabelFr: 'Minéral Profond',
      primary: primaryDark,
      secondary: secondaryDark,
      glow: `rgba(${rgbDark.r}, ${rgbDark.g}, ${rgbDark.b}, 0.24)`,
      soft: `rgba(${rgbDark.r}, ${rgbDark.g}, ${rgbDark.b}, 0.075)`,
      border: `rgba(${rgbDark.r}, ${rgbDark.g}, ${rgbDark.b}, 0.30)`,
      onPrimary: '#FAF8F5',
    });
    idCounter++;

    // 3. Couleur Fluo / Éclat (Controlled Luminous Silk Accents — vibrant without harsh neon)
    const hFluo = Math.round((hueBase + 310) % 360);
    const sFluo = 72 + (i % 3) * 4; // 72% - 80% poised radiance
    const lFluo = 45 + (i % 3) * 3; // 45% - 51% balanced luminance
    const primaryFluo = hslToHex(hFluo, sFluo, lFluo);
    const secondaryFluo = hslToHex((hFluo + 18) % 360, Math.max(62, sFluo - 6), Math.max(36, lFluo - 8));
    const rgbFluo = hexToRgb(primaryFluo);

    palette.push({
      id: idCounter,
      code: `#${String(idCounter).padStart(3, '0')}`,
      nameFr: `${FLUO_NAMES_FR[i % FLUO_NAMES_FR.length]} ${Math.floor(i / 20) + 1}`,
      nameZh: `${FLUO_NAMES_ZH[i % FLUO_NAMES_ZH.length]} · ${String(idCounter).padStart(3, '0')}`,
      category: 'fluo',
      categoryLabelFr: 'Éclat Lumineux',
      primary: primaryFluo,
      secondary: secondaryFluo,
      glow: `rgba(${rgbFluo.r}, ${rgbFluo.g}, ${rgbFluo.b}, 0.24)`,
      soft: `rgba(${rgbFluo.r}, ${rgbFluo.g}, ${rgbFluo.b}, 0.09)`,
      border: `rgba(${rgbFluo.r}, ${rgbFluo.g}, ${rgbFluo.b}, 0.32)`,
      onPrimary: getContrastText(primaryFluo),
    });
    idCounter++;
  }

  return palette;
}

export const CHAMELEON_PALETTE_240: ChameleonColor[] = build240Palette();
