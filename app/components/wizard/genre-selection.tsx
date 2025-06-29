
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BOOK_GENRES } from '@/lib/genres';
import { Genre } from '@/lib/types';
import * as LucideIcons from 'lucide-react';

interface GenreSelectionProps {
  selectedGenre?: string;
  onGenreSelect: (genre: string) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function GenreSelection({ selectedGenre, onGenreSelect, onNext, isLoading }: GenreSelectionProps) {
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent size={24} /> : <LucideIcons.BookOpen size={24} />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Craft your next <span className="text-teal-400">bestseller</span> with the power of AI
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Choose your genre to unlock personalized insights from bestselling books and top authors
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {BOOK_GENRES.map((genre) => (
          <Card
            key={genre.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              selectedGenre === genre.id
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => onGenreSelect(genre.id)}
            onMouseEnter={() => setHoveredGenre(genre.id)}
            onMouseLeave={() => setHoveredGenre(null)}
          >
            <CardContent className="p-4 text-center">
              <div className={`mb-3 flex justify-center ${
                selectedGenre === genre.id || hoveredGenre === genre.id ? 'text-teal-400' : 'text-gray-400'
              }`}>
                {getIcon(genre.icon)}
              </div>
              <h3 className="font-semibold text-sm text-gray-100 mb-1">{genre.name}</h3>
              <p className="text-xs text-gray-400">{genre.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          onClick={onNext}
          disabled={!selectedGenre || isLoading}
          size="lg"
          className="px-8"
        >
          {isLoading ? 'Analyzing Genre...' : 'Analyze Genre & Continue'}
        </Button>
      </div>
    </div>
  );
}
