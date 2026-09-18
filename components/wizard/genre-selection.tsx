'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BOOK_GENRES } from '@/lib/genres';
import { Genre } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import { Check, Sparkles } from 'lucide-react';

interface GenreSelectionProps {
  selectedGenres?: string[];
  onGenreToggle: (genreId: string) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function GenreSelection({ selectedGenres = [], onGenreToggle, onNext, isLoading }: GenreSelectionProps) {
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent size={24} /> : <LucideIcons.BookOpen size={24} />;
  };

  const isSelected = (id: string) => selectedGenres.includes(id);
  const selectedNames = selectedGenres
    .map((id) => BOOK_GENRES.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[];
  const isHybrid = selectedNames.length > 1;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Craft your next <span className="text-teal-400">bestseller</span> with the power of AI
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Choose your genre to unlock personalized insights from bestselling books and top authors
        </p>
        <p className="text-sm text-gray-500 mt-3">
          Tip: Select two or more genres to create a <span className="text-teal-400">hybrid genre</span> and blend their styles.
        </p>
      </div>

      {/* Selected / hybrid summary */}
      {selectedNames.length > 0 && (
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-500/10 px-4 py-2 text-sm text-teal-300">
            {isHybrid && <Sparkles size={16} className="text-teal-400" />}
            <span>
              {isHybrid ? 'Hybrid genre: ' : 'Selected: '}
              <span className="font-semibold text-teal-200">{selectedNames.join(' + ')}</span>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {BOOK_GENRES.map((genre) => {
          const selected = isSelected(genre.id);
          return (
            <Card
              key={genre.id}
              className={`relative cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                selected
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onGenreToggle(genre.id)}
              onMouseEnter={() => setHoveredGenre(genre.id)}
              onMouseLeave={() => setHoveredGenre(null)}
            >
              {selected && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Check size={12} />
                </div>
              )}
              <CardContent className="p-4 text-center">
                <div className={`mb-3 flex justify-center ${
                  selected || hoveredGenre === genre.id ? 'text-teal-400' : 'text-gray-400'
                }`}>
                  {getIcon(genre.icon)}
                </div>
                <h3 className="font-semibold text-sm text-gray-100 mb-1">{genre.name}</h3>
                <p className="text-xs text-gray-400">{genre.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          onClick={onNext}
          disabled={selectedGenres.length === 0 || isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading
            ? 'Analyzing Genre...'
            : isHybrid
              ? 'Analyze Hybrid Genre & Continue'
              : 'Analyze Genre & Continue'}
        </Button>
      </div>
    </div>
  );
}
