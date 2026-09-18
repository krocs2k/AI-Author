'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Sparkles, TrendingUp, Search, CheckCircle, RefreshCw, ArrowRight, Flame, Star } from 'lucide-react';

export interface Trope {
  id: string;
  name: string;
  description: string;
  popularity: number;
}

interface TropeSelectionProps {
  genre?: string;
  tropes?: Trope[];
  selectedTrope?: Trope | null;
  onTropeSelect: (trope: Trope) => void;
  onRegenerateTropes: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

function getPopularityColor(popularity: number): string {
  if (popularity >= 95) return 'text-yellow-400';
  if (popularity >= 90) return 'text-orange-400';
  if (popularity >= 85) return 'text-teal-400';
  return 'text-gray-400';
}

function getPopularityBadge(popularity: number): { label: string; className: string } {
  if (popularity >= 95) return { label: 'Hot', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' };
  if (popularity >= 90) return { label: 'Trending', className: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
  if (popularity >= 85) return { label: 'Popular', className: 'bg-teal-500/20 text-teal-400 border-teal-500/40' };
  return { label: 'Solid', className: 'bg-gray-500/20 text-gray-400 border-gray-500/40' };
}

export function TropeSelection({
  genre,
  tropes,
  selectedTrope,
  onTropeSelect,
  onRegenerateTropes,
  onNext,
  isLoading,
}: TropeSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTropes = useMemo(() => {
    if (!tropes) return [];
    if (!searchTerm.trim()) return tropes;
    const lower = searchTerm.toLowerCase();
    return tropes.filter(
      t => t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower)
    );
  }, [tropes, searchTerm]);

  const sortedTropes = useMemo(() => {
    return [...filteredTropes].sort((a, b) => b.popularity - a.popularity);
  }, [filteredTropes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">
          Choose Your Story Trope
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Select a popular trope to shape your {genre} story. These are the most beloved and commercially
          successful storytelling patterns that readers actively seek out.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && !tropes?.length && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <LoadingSpinner className="h-8 w-8 text-teal-400" />
          <p className="text-gray-400 text-sm">Discovering the most popular tropes for {genre}...</p>
        </div>
      )}

      {/* Tropes Grid */}
      {tropes && tropes.length > 0 && (
        <>
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tropes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                {tropes.length} tropes
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateTropes}
                disabled={isLoading}
                className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
              >
                {isLoading ? (
                  <LoadingSpinner className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Regenerate
              </Button>
            </div>
          </div>

          {/* Selected Trope Banner */}
          {selectedTrope && (
            <Card className="bg-teal-500/10 border-teal-500/30">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-teal-400 flex-shrink-0" />
                    <div>
                      <span className="text-teal-300 font-medium">Selected: </span>
                      <span className="text-white font-semibold">{selectedTrope.name}</span>
                    </div>
                  </div>
                  <Button
                    onClick={onNext}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Continue to Synopsis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trope Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTropes.map((trope) => {
              const isSelected = selectedTrope?.id === trope.id;
              const popBadge = getPopularityBadge(trope.popularity);

              return (
                <button
                  key={trope.id}
                  onClick={() => onTropeSelect(trope)}
                  className={`text-left rounded-lg border p-4 transition-all duration-200 hover:scale-[1.02] ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500/50 ring-1 ring-teal-500/30'
                      : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`font-semibold text-sm ${
                      isSelected ? 'text-teal-300' : 'text-white'
                    }`}>
                      {isSelected && <CheckCircle className="h-3.5 w-3.5 inline mr-1.5 text-teal-400" />}
                      {trope.name}
                    </h3>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${popBadge.className}`}>
                      {trope.popularity >= 95 && <Flame className="h-2.5 w-2.5 mr-0.5" />}
                      {trope.popularity >= 90 && trope.popularity < 95 && <TrendingUp className="h-2.5 w-2.5 mr-0.5" />}
                      {trope.popularity >= 85 && trope.popularity < 90 && <Star className="h-2.5 w-2.5 mr-0.5" />}
                      {popBadge.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {trope.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          trope.popularity >= 95 ? 'bg-yellow-500' :
                          trope.popularity >= 90 ? 'bg-orange-500' :
                          trope.popularity >= 85 ? 'bg-teal-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${trope.popularity}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono ${getPopularityColor(trope.popularity)}`}>
                      {trope.popularity}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredTropes.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tropes match &ldquo;{searchTerm}&rdquo;</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-teal-400 text-sm mt-1 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Bottom Continue */}
          {selectedTrope && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={onNext}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Continue to Synopsis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
