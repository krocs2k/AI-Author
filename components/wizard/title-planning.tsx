
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookTitle, GenreAnalysis, ChapterRecommendations } from '@/lib/types';
import { BookOpen, Settings, Lightbulb, BookMarked, TrendingUp, ChevronDown, ChevronUp, Target, Clock, Layers, RefreshCw } from 'lucide-react';

interface TitlePlanningProps {
  titles?: BookTitle[];
  selectedTitleId?: string;
  selectedTitle?: string;
  customTitle?: string;
  plannedChapters?: number;
  wordsPerChapter?: number;
  genreAnalysis?: GenreAnalysis;
  chapterRecommendations?: ChapterRecommendations;
  onTitleSelect: (titleId: string) => void;
  onCustomTitleChange: (title: string) => void;
  onChaptersChange: (chapters: number) => void;
  onWordsPerChapterChange: (words: number) => void;
  onFetchRecommendations?: () => void;
  onRegenerateTitles?: () => void;
  onNext: () => void;
  isLoading?: boolean;
  isLoadingRecommendations?: boolean;
}

export function TitlePlanning({
  titles,
  selectedTitleId,
  selectedTitle,
  customTitle,
  plannedChapters,
  wordsPerChapter,
  genreAnalysis,
  chapterRecommendations,
  onTitleSelect,
  onCustomTitleChange,
  onChaptersChange,
  onWordsPerChapterChange,
  onFetchRecommendations,
  onRegenerateTitles,
  onNext,
  isLoading,
  isLoadingRecommendations
}: TitlePlanningProps) {
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showPaceGuide, setShowPaceGuide] = useState(false);

  const recommendations = chapterRecommendations;
  const effectiveChapters = plannedChapters || recommendations?.recommendedChapters || genreAnalysis?.avgChapters || 20;
  const effectiveWords = wordsPerChapter || recommendations?.recommendedWordsPerChapter || genreAnalysis?.avgWordsPerChapter || 3500;
  const totalWords = effectiveChapters * effectiveWords;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Title Selection & Chapter Planning
        </h2>
        <p className="text-lg text-gray-400">
          Choose your book title and configure structure based on bestseller analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Title Selection - Left Column */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
              <BookOpen size={20} />
              Generated Titles
            </h3>
            {onRegenerateTitles && titles && titles.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateTitles}
                disabled={isLoading}
                className="text-teal-400 border-teal-500/50 hover:bg-teal-500/10"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <RefreshCw size={14} className="mr-2" />
                )}
                Regenerate
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-400">Generating titles...</span>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
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
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-100 text-sm">{title.title}</h4>
                      {selectedTitleId === title.id && (
                        <span className="text-teal-400 text-xs font-medium">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{title.reasoning}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="border-dashed border-gray-600">
            <CardContent className="p-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Or enter your own:
              </label>
              <Input
                placeholder="Enter custom title..."
                value={customTitle || ''}
                onChange={(e) => onCustomTitleChange(e.target.value)}
                className="text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Bestseller Analysis - Middle Column */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <TrendingUp size={20} />
            Bestseller Analysis
          </h3>

          {isLoadingRecommendations ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-400">Analyzing bestsellers...</span>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              {/* Genre-Based Recommendations */}
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-blue-400 text-base">
                    <Lightbulb size={16} />
                    {recommendations.genre} Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-gray-300 mb-3">{recommendations.reasoning}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Chapters</p>
                      <p className="text-xl font-bold text-blue-400">{recommendations.recommendedChapters}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Words/Chapter</p>
                      <p className="text-xl font-bold text-blue-400">{recommendations.recommendedWordsPerChapter.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Target Total Words</p>
                    <p className="text-xl font-bold text-teal-400">{recommendations.totalWordTarget.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Structure Breakdown */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-purple-400 text-base">
                    <Layers size={16} />
                    Chapter Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {Object.entries(recommendations.chapterStructure).map(([phase, count]) => {
                      const colors: Record<string, string> = {
                        opening: 'bg-green-500/20 text-green-400 border-green-500/30',
                        rising: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                        climax: 'bg-red-500/20 text-red-400 border-red-500/30',
                        falling: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                        resolution: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      };
                      const labels: Record<string, string> = {
                        opening: 'Opening / Setup',
                        rising: 'Rising Action',
                        climax: 'Climax',
                        falling: 'Falling Action',
                        resolution: 'Resolution'
                      };
                      return (
                        <div key={phase} className="flex items-center justify-between">
                          <Badge variant="outline" className={`${colors[phase]} text-xs`}>
                            {labels[phase]}
                          </Badge>
                          <span className="text-sm font-medium text-gray-300">{count} chapters</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Bestseller Reference (Collapsible) */}
              <Card>
                <CardHeader 
                  className="py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setShowBestsellers(!showBestsellers)}
                >
                  <CardTitle className="flex items-center justify-between text-amber-400 text-base">
                    <span className="flex items-center gap-2">
                      <BookMarked size={16} />
                      Top Bestseller References
                    </span>
                    {showBestsellers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </CardTitle>
                </CardHeader>
                {showBestsellers && (
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {recommendations.topBooksReference.map((book, idx) => (
                        <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                          <p className="font-medium text-gray-200 text-sm">{book.title}</p>
                          <p className="text-xs text-gray-400">by {book.author}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs bg-gray-700/50">
                              {book.chapterCount} chapters
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-gray-700/50">
                              ~{book.avgWordsPerChapter.toLocaleString()} words/ch
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-gray-700/50">
                              {book.totalWords.toLocaleString()} total
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 italic">{book.structure}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          ) : (
            <Card className="border-dashed border-gray-600">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400 mb-4">Load bestseller analysis for your genre</p>
                <Button 
                  onClick={onFetchRecommendations}
                  disabled={isLoadingRecommendations}
                  variant="outline"
                >
                  Analyze Bestsellers
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chapter Configuration - Right Column */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <Settings size={20} />
            Your Configuration
          </h3>

          <div className="space-y-4">
            {/* Chapter Count */}
            <Card>
              <CardContent className="p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Chapters
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChaptersChange(Math.max(5, effectiveChapters - 1))}
                    className="px-3"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={effectiveChapters}
                    onChange={(e) => onChaptersChange(parseInt(e.target.value) || recommendations?.recommendedChapters || 20)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChaptersChange(Math.min(100, effectiveChapters + 1))}
                    className="px-3"
                  >
                    +
                  </Button>
                </div>
                {recommendations && effectiveChapters !== recommendations.recommendedChapters && (
                  <p className="text-xs text-amber-400 mt-1">
                    Recommended: {recommendations.recommendedChapters} chapters
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Words Per Chapter */}
            <Card>
              <CardContent className="p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Words per Chapter
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onWordsPerChapterChange(Math.max(500, effectiveWords - 500))}
                    className="px-3"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="500"
                    max="10000"
                    step="500"
                    value={effectiveWords}
                    onChange={(e) => onWordsPerChapterChange(parseInt(e.target.value) || recommendations?.recommendedWordsPerChapter || 3500)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onWordsPerChapterChange(Math.min(10000, effectiveWords + 500))}
                    className="px-3"
                  >
                    +
                  </Button>
                </div>
                {recommendations && effectiveWords !== recommendations.recommendedWordsPerChapter && (
                  <p className="text-xs text-amber-400 mt-1">
                    Recommended: {recommendations.recommendedWordsPerChapter.toLocaleString()} words
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Book Projection */}
            <Card className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border-teal-500/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  <Target size={16} className="text-teal-400" />
                  Your Book Projection
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Words</span>
                    <span className="text-2xl font-bold text-teal-400">{totalWords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock size={14} />
                      Read Time
                    </span>
                    <span className="text-lg font-semibold text-gray-200">~{Math.ceil(totalWords / 250)} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Pages (est.)</span>
                    <span className="text-lg font-semibold text-gray-200">~{Math.ceil(totalWords / 250)} pages</span>
                  </div>
                  {recommendations && (
                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">vs. Target</span>
                        <Badge 
                          variant="outline"
                          className={`${
                            totalWords >= recommendations.totalWordTarget * 0.9 && totalWords <= recommendations.totalWordTarget * 1.1
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {Math.round((totalWords / recommendations.totalWordTarget) * 100)}% of target
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pace Guidelines (Collapsible) */}
            {recommendations && (
              <Card>
                <CardHeader 
                  className="py-3 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setShowPaceGuide(!showPaceGuide)}
                >
                  <CardTitle className="flex items-center justify-between text-green-400 text-base">
                    <span className="flex items-center gap-2">
                      <TrendingUp size={16} />
                      Pacing Guide
                    </span>
                    {showPaceGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </CardTitle>
                </CardHeader>
                {showPaceGuide && (
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-2">
                      {recommendations.paceGuidelines.map((guide, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex gap-2">
                          <span className="text-teal-400 font-mono text-xs mt-1">{idx + 1}.</span>
                          <span>{guide}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Structure Tips */}
            {recommendations && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-purple-400 text-base">
                    Structure Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-2">
                    {recommendations.structureTips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button
          onClick={onNext}
          disabled={(!selectedTitle && !customTitle) || !effectiveChapters || !effectiveWords}
          size="lg"
          className="px-8"
        >
          Continue to Character Development
        </Button>
      </div>
    </div>
  );
}
