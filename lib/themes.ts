// Selectable premium color schemes. Every theme is dark and re-maps the two
// palette ramps the whole UI is built on (`gray` = neutrals, `teal` = accent)
// through CSS variables, so a theme change re-skins every page at once.

export const THEME_STORAGE_KEY = 'aa_color_theme';
export const DEFAULT_THEME_ID = 'ink-parchment';

export const GRAY_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export const ACCENT_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export interface ColorTheme {
  id: string;
  name: string;
  genre: string;
  description: string;
  gray: string[]; // 11 hex values, 50 → 950
  accent: string[]; // 10 hex values, 50 → 900
}

// ---------- color helpers ----------
function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function hexToHsl(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const rgbTriplet = (hex: string) => hexToRgb(hex).join(' ');

// Lightness / saturation profiles tuned from the original ink & parchment ramps.
const NEUTRAL_L = [96, 91, 83, 71, 57, 44, 29, 20, 12.5, 8.3, 5];
const NEUTRAL_S = [2.4, 2.2, 2, 1.5, 1, 0.7, 0.7, 0.8, 0.9, 1, 1];
const ACCENT_L = [93, 86, 77, 69, 62, 34, 28, 24, 18, 11];
const ACCENT_S = [1.15, 1.1, 1.05, 1, 1, 1, 0.95, 0.85, 0.8, 0.75];

function neutralRamp(h: number, s: number): string[] {
  return NEUTRAL_L.map((l, i) => hslToHex(h, Math.min(70, s * NEUTRAL_S[i]), l));
}
// lShift brightens/dims the light steps (50-400); deepShift darkens the deep steps
// (500-900) for luminous hues so white button text keeps AA contrast.
function accentRamp(h: number, s: number, lShift = 0, deepShift = 0): string[] {
  return ACCENT_L.map((l, i) => hslToHex(h, Math.min(100, s * ACCENT_S[i]), l + (i < 5 ? lShift : deepShift)));
}

function makeTheme(
  id: string,
  name: string,
  genre: string,
  description: string,
  neutral: [number, number],
  accent: [number, number, number?, number?],
): ColorTheme {
  return {
    id,
    name,
    genre,
    description,
    gray: neutralRamp(neutral[0], neutral[1]),
    accent: accentRamp(accent[0], accent[1], accent[2] ?? 0, accent[3] ?? 0),
  };
}

// ---------- themes ----------
export const COLOR_THEMES: ColorTheme[] = [
  {
    id: DEFAULT_THEME_ID,
    name: 'Ink & Parchment',
    genre: 'Signature',
    description: 'Warm espresso ink, aged parchment and antique gold. The classic author’s study.',
    gray: ['#FBF7EF', '#F4ECDC', '#E6D9BF', '#CDBD9B', '#A99A7C', '#7F7260', '#554C3F', '#3B332A', '#262019', '#1A1510', '#110D09'],
    accent: ['#FBF3E0', '#F6E7C1', '#EFD79B', '#E6C77A', '#D9B466', '#8C641F', '#6F4F18', '#5E431C', '#4A3516', '#2F2210'],
  },
  makeTheme('rosewood-blush', 'Rosewood & Blush', 'Romance',
    'Candlelit wine-dark velvet with rose-gold blush. Sweeping, sensual and heartfelt.',
    [340, 22], [345, 62, 2]),
  makeTheme('enchanted-emerald', 'Enchanted Emerald', 'Epic Fantasy',
    'Ancient forest shadows lit by elven emerald. Myth, magic and quests of old.',
    [150, 20], [145, 52, 0, -2]),
  makeTheme('nebula-circuit', 'Nebula Circuit', 'Science Fiction',
    'Deep-space navy with electric cyan light. Starships, AI and far horizons.',
    [222, 32], [188, 85, 0, -6]),
  makeTheme('steel-ember', 'Steel & Ember', 'Thriller',
    'Cold gunmetal with a burning ember edge. Pulse-racing tension on every page.',
    [215, 12], [22, 92]),
  makeTheme('blood-moon', 'Blood Moon', 'Horror',
    'Near-black crypt shadows with a blood-red glow. Dread that lingers.',
    [355, 18], [356, 78, -4]),
  makeTheme('gaslight-noir', 'Gaslight Noir', 'Mystery & Crime',
    'Smoke-grey city streets under silver gaslight. Clues, shadows and secrets.',
    [220, 6], [210, 18, 4]),
  makeTheme('witching-hour', 'Witching Hour', 'Paranormal',
    'Midnight aubergine with spectral amethyst. Ghosts, witches and the uncanny.',
    [275, 22], [275, 68, 2]),
  makeTheme('antique-verdigris', 'Antique Verdigris', 'Historical Fiction',
    'Bronze-age patina on old mahogany. Grand eras and the weight of history.',
    [28, 18], [172, 42]),
  makeTheme('desert-sunset', 'Desert Sunset', 'Western',
    'Dusty saddle leather and a copper frontier sunset. Grit and open plains.',
    [24, 26], [16, 74]),
  makeTheme('bluestocking', 'Bluestocking', 'Literary Fiction',
    'Library-slate indigo with soft periwinkle. Quiet, considered and timeless.',
    [232, 18], [230, 62, 4]),
  makeTheme('golden-hour', 'Golden Hour', 'Young Adult',
    'Twilight dusk violet with glowing coral. Coming-of-age and first everything.',
    [262, 20], [12, 88, 2]),
  makeTheme('ashfall', 'Ashfall', 'Dystopian',
    'Ash-grey ruins with a toxic acid-lime signal. Survival after the fall.',
    [90, 6], [78, 72, 0, -8]),
];

export function getTheme(id: string | null | undefined): ColorTheme {
  return COLOR_THEMES.find((t) => t.id === id) ?? COLOR_THEMES[0];
}

/** All CSS custom properties a theme sets on <html>. */
export function themeCssVars(theme: ColorTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  GRAY_STEPS.forEach((s, i) => (vars[`--c-gray-${s}`] = rgbTriplet(theme.gray[i])));
  ACCENT_STEPS.forEach((s, i) => (vars[`--c-teal-${s}`] = rgbTriplet(theme.accent[i])));
  const g = (step: number) => theme.gray[GRAY_STEPS.indexOf(step as (typeof GRAY_STEPS)[number])];
  const a = (step: number) => theme.accent[ACCENT_STEPS.indexOf(step as (typeof ACCENT_STEPS)[number])];
  vars['--glow'] = rgbTriplet(a(400));
  vars['--glow-deep'] = rgbTriplet(a(500));
  vars['--accent-light'] = rgbTriplet(a(100));
  vars['--accent-mid'] = rgbTriplet(a(500));
  vars['--bg-base'] = g(900);
  if (theme.id !== DEFAULT_THEME_ID) {
    Object.assign(vars, {
      '--background': hexToHsl(g(900)),
      '--foreground': hexToHsl(g(100)),
      '--card': hexToHsl(g(800)),
      '--card-foreground': hexToHsl(g(100)),
      '--popover': hexToHsl(g(900)),
      '--popover-foreground': hexToHsl(g(100)),
      '--primary': hexToHsl(a(400)),
      '--primary-foreground': hexToHsl(g(950)),
      '--secondary': hexToHsl(g(700)),
      '--secondary-foreground': hexToHsl(g(100)),
      '--muted': hexToHsl(g(700)),
      '--muted-foreground': hexToHsl(g(400)),
      '--accent': hexToHsl(a(800)),
      '--accent-foreground': hexToHsl(a(200)),
      '--border': hexToHsl(g(700)),
      '--input': hexToHsl(g(700)),
      '--ring': hexToHsl(a(400)),
    });
  }
  return vars;
}

const ALL_VAR_NAMES = Object.keys(themeCssVars(COLOR_THEMES[1]));

/** Apply a theme in the browser and persist the choice. */
export function applyTheme(id: string) {
  if (typeof document === 'undefined') return;
  const theme = getTheme(id);
  const root = document.documentElement;
  ALL_VAR_NAMES.forEach((n) => root.style.removeProperty(n));
  if (theme.id !== DEFAULT_THEME_ID) {
    Object.entries(themeCssVars(theme)).forEach(([k, v]) => root.style.setProperty(k, v));
  }
  root.setAttribute('data-theme', theme.id);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.gray[9]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    /* storage unavailable (private mode) — theme still applies for this visit */
  }
}

/** Inline script run before first paint so a saved theme never flashes. */
export function themeBootScript(): string {
  const map: Record<string, Record<string, string>> = {};
  COLOR_THEMES.forEach((t) => {
    if (t.id !== DEFAULT_THEME_ID) map[t.id] = themeCssVars(t);
  });
  return `(function(){try{var id=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var m=${JSON.stringify(map)};var v=id&&m[id];if(!v)return;var r=document.documentElement;for(var k in v)r.style.setProperty(k,v[k]);r.setAttribute('data-theme',id);}catch(e){}})();`;
}
