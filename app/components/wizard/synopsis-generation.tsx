
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Synopsis, GenreAnalysis, AuthorAnalysis } from '@/lib/types';
import { RefreshCw, TrendingUp, Users, BookOpen } from 'lucide-react';

interface SynopsisGenerationProps {
  genreAnalysis?: GenreAnalysis;
  authorAnalysis?: AuthorAnalysis;
  synopses?: Synopsis[];
  selectedSynopsis?: string;
  customTopic?: string;
  onTopicChange: (topic: string) => void;
  onSynopsisSelect: (synopsisId: string) => void;
  onRegenerateSynopses: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function SynopsisGeneration({
  genreAnalysis,
  authorAnalysis,
  synopses,
  selectedSynopsis,
  customTopic,
  onTopicChange,
  onSynopsisSelect,
  onRegenerateSynopses,
  onNext,
  isLoading
}: SynopsisGenerationProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Research Analysis Complete
        </h2>
        <p className="text-lg text-gray-400">
          Based on our analysis, here are your custom book concepts
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Analysis Results */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-teal-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-400">
                <TrendingUp size={20} />
                MojoSauce Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Success Factors</h4>
                <div className="flex flex-wrap gap-1">
                  {genreAnalysis?.successFactors?.slice(0, 3).map((factor, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Average Structure</h4>
                <p className="text-sm text-gray-400">
                  {genreAnalysis?.avgChapters || 20} chapters, {genreAnalysis?.avgWordsPerChapter?.toLocaleString() || '3,500'} words each
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Users size={20} />
                SecretSauce Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Humanization Techniques</h4>
                <div className="flex flex-wrap gap-1">
                  {authorAnalysis?.humanizationTechniques?.slice(0, 3).map((technique, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {technique}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-1">Voice Elements</h4>
                <p className="text-sm text-gray-400">
                  {authorAnalysis?.commonVoiceElements?.slice(0, 2).join(', ') || 'Authentic voice, Personal touch'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Synopsis Generation */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Optional: Add specific topic or theme
            </label>
            <Input
              placeholder="e.g., time travel, corporate intrigue, family secrets..."
              value={customTopic || ''}
              onChange={(e) => onTopicChange(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
              <BookOpen size={20} />
              Generated Synopses
            </h3>
            <Button
              variant="outline"
              onClick={onRegenerateSynopses}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Regenerate
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-400">Generating synopses...</span>
            </div>
          ) : (
            <div className="grid gap-4 mb-6">
              {synopses?.map((synopsis) => (
                <Card
                  key={synopsis.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    selectedSynopsis === synopsis.id
                      ? 'border-teal-500 bg-teal-500/5'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => onSynopsisSelect(synopsis.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="success" className="text-xs">
                        {synopsis.successProbability}% Success Probability
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {synopsis.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button
              onClick={onNext}
              disabled={!selectedSynopsis || isLoading}
              size="lg"
              className="px-8"
            >
              Select Synopsis & Generate Titles
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
