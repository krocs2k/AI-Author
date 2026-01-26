
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookTitle, GenreAnalysis } from '@/lib/types';
import { BookOpen, Settings, Lightbulb } from 'lucide-react';

interface TitlePlanningProps {
  titles?: BookTitle[];
  selectedTitleId?: string;
  selectedTitle?: string;
  customTitle?: string;
  plannedChapters?: number;
  wordsPerChapter?: number;
  genreAnalysis?: GenreAnalysis;
  onTitleSelect: (titleId: string) => void;
  onCustomTitleChange: (title: string) => void;
  onChaptersChange: (chapters: number) => void;
  onWordsPerChapterChange: (words: number) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function TitlePlanning({
  titles,
  selectedTitleId,
  selectedTitle,
  customTitle,
  plannedChapters,
  wordsPerChapter,
  genreAnalysis,
  onTitleSelect,
  onCustomTitleChange,
  onChaptersChange,
  onWordsPerChapterChange,
  onNext,
  isLoading
}: TitlePlanningProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Title Selection & Chapter Planning
        </h2>
        <p className="text-lg text-gray-400">
          Choose your book title and customize the structure
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Title Selection */}
        <div>
          <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <BookOpen size={20} />
            Generated Titles
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-400">Generating titles...</span>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {titles?.map((title) => (
                <Card
                  key={title.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    selectedTitleId === title.id
                      ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => onTitleSelect(title.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-100 mb-2">{title.title}</h4>
                      {selectedTitleId === title.id && (
                        <span className="text-teal-400 text-sm font-medium">✓ Selected</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{title.reasoning}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-dashed border-gray-600">
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Or enter your own title:
              </label>
              <Input
                placeholder="Enter your custom title..."
                value={customTitle || ''}
                onChange={(e) => onCustomTitleChange(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Chapter Planning */}
        <div>
          <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <Settings size={20} />
            Chapter Planning
          </h3>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Lightbulb size={16} />
                Genre Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Avg. Chapters</p>
                  <p className="text-lg font-semibold text-gray-200">
                    {genreAnalysis?.avgChapters || 20}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Words per Chapter</p>
                  <p className="text-lg font-semibold text-gray-200">
                    {genreAnalysis?.avgWordsPerChapter?.toLocaleString() || '3,500'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Chapters
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={plannedChapters || ''}
                onChange={(e) => onChaptersChange(parseInt(e.target.value) || 0)}
                placeholder={genreAnalysis?.avgChapters?.toString() || '20'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Words per Chapter
              </label>
              <Input
                type="number"
                min="1000"
                max="10000"
                step="500"
                value={wordsPerChapter || ''}
                onChange={(e) => onWordsPerChapterChange(parseInt(e.target.value) || 0)}
                placeholder={genreAnalysis?.avgWordsPerChapter?.toString() || '3500'}
              />
            </div>

            <Card className="bg-gray-800/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-200 mb-2">Estimated Book Length</h4>
                <p className="text-2xl font-bold text-teal-400">
                  {((plannedChapters || 20) * (wordsPerChapter || 3500)).toLocaleString()} words
                </p>
                <p className="text-sm text-gray-400">
                  ~{Math.ceil(((plannedChapters || 20) * (wordsPerChapter || 3500)) / 250)} minutes read time
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button
          onClick={onNext}
          disabled={(!selectedTitle && !customTitle) || !plannedChapters || !wordsPerChapter}
          size="lg"
          className="px-8"
        >
          Create Book Outline & Start Writing
        </Button>
      </div>
    </div>
  );
}
