'use client';

import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { COLOR_THEMES, DEFAULT_THEME_ID, THEME_STORAGE_KEY, applyTheme, type ColorTheme } from '@/lib/themes';

function ThemeCard({ theme, active, onSelect }: { theme: ColorTheme; active: boolean; onSelect: () => void }) {
  const [g, a] = [theme.gray, theme.accent];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
        active ? 'ring-2 ring-teal-400 shadow-gold' : 'ring-1 ring-white/10 hover:ring-white/30 hover:-translate-y-0.5'
      }`}
      style={{ backgroundColor: g[9] }}
    >
      {/* Mini preview of the scheme */}
      <div
        className="relative h-24 p-3"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 10% 0%, ${a[4]}33, transparent 60%), radial-gradient(80% 80% at 100% 100%, ${a[5]}40, transparent 70%)`,
        }}
      >
        <div className="h-full rounded-lg p-2.5" style={{ backgroundColor: g[8], border: `1px solid ${a[4]}26` }}>
          <div
            className="font-display text-lg font-semibold leading-none"
            style={{
              backgroundImage: `linear-gradient(100deg, ${a[3]}, ${a[4]}, ${a[1]}, ${a[5]})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Aa
          </div>
          <div className="mt-2 h-1.5 w-3/4 rounded-full" style={{ backgroundColor: g[6] }} />
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: g[7] }} />
            <div className="ml-auto h-3 w-8 rounded" style={{ background: `linear-gradient(90deg, ${a[5]}, ${a[4]})` }} />
          </div>
        </div>
        {active && (
          <span
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full shadow"
            style={{ backgroundColor: a[4], color: g[10] }}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="px-3 pb-3 pt-2">
        <div className="flex items-center gap-1">
          {[g[8], g[6], g[3], a[5], a[4], a[2]].map((c, i) => (
            <span key={i} className="h-3 w-3 rounded-full ring-1 ring-black/30" style={{ backgroundColor: c }} />
          ))}
        </div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: a[4] }}>
          {theme.genre}
        </p>
        <p className="font-display text-base font-semibold" style={{ color: g[1] }}>
          {theme.name}
        </p>
        <p className="mt-1 text-xs leading-snug" style={{ color: g[4] }}>
          {theme.description}
        </p>
      </div>
    </button>
  );
}

export function ThemePicker({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(DEFAULT_THEME_ID);

  useEffect(() => {
    try {
      setCurrent(localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const select = (id: string) => {
    applyTheme(id);
    setCurrent(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className ?? 'text-gray-400 hover:text-white'}>
          <Palette className="h-4 w-4 mr-2" />
          Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto border-gray-700 bg-gray-900 text-gray-100">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold-gradient">Color Scheme</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a premium palette inspired by your genre. Changes apply instantly and are remembered on this device.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COLOR_THEMES.map((t) => (
            <ThemeCard key={t.id} theme={t} active={current === t.id} onSelect={() => select(t.id)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ThemePicker;
