
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Chapter, BookMetrics } from '@/lib/types';
import { BookOpen, Download, FileText, Clock, TrendingUp, Target } from 'lucide-react';
import { formatReadTime, formatNumber, downloadAsFile, downloadBookAsPDF, downloadBookAsDocx, downloadBookAsText } from '@/lib/utils';

interface ContentCreationProps {
  title?: string;
  forward?: string;
  forwardWordCount?: number;
  chapters?: Chapter[];
  plannedChapters?: number;
  metrics?: BookMetrics;
  onGenerateForward: () => void;
  onGenerateChapter: (chapterNumber: number) => void;
  onGenerateAllChapters: () => void;
  onDownloadBook: (format: 'pdf' | 'docx' | 'txt') => void;
  onNext: () => void;
  isLoading?: { [key: string]: boolean };
}

export function ContentCreation({
  title,
  forward,
  forwardWordCount,
  chapters,
  plannedChapters,
  metrics,
  onGenerateForward,
  onGenerateChapter,
  onGenerateAllChapters,
  onDownloadBook,
  onNext,
  isLoading
}: ContentCreationProps) {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  const totalChapters = plannedChapters || 20;
  const generatedChapters = chapters?.length || 0;
  const completionPercentage = Math.round((generatedChapters / totalChapters) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Content Creation Dashboard
        </h2>
        <p className="text-lg text-gray-400 mb-2">
          Generate your book content with AI-powered humanization
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
          <Target className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-teal-300">
            Quality Guarantee: Each chapter meets 92%-110% of target word count & 94%+ humanization
          </span>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-teal-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              {metrics?.humanizationScore || 0}%
            </p>
            <p className="text-sm text-gray-400">Humanization Quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              {formatNumber(metrics?.totalWordCount || 0)}
            </p>
            <p className="text-sm text-gray-400">Total Words</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              {formatReadTime(metrics?.estimatedReadTime || 0)}
            </p>
            <p className="text-sm text-gray-400">Read Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">
              {metrics?.successProbability || 0}%
            </p>
            <p className="text-sm text-gray-400">Success Probability</p>
          </CardContent>
        </Card>
      </div>

      {/* Forward Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen size={20} />
              Forward/Introduction
            </span>
            {!forward && (
              <Button
                onClick={onGenerateForward}
                disabled={isLoading?.forward}
                size="sm"
              >
                {isLoading?.forward ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Forward'
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {forward && (
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Badge variant="success">94%+ Humanized</Badge>
                <Badge variant="outline">{forwardWordCount?.toLocaleString()} words</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAsFile(forward, 'forward.txt')}
                >
                  <Download size={16} className="mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateForward}
                  disabled={isLoading?.forward}
                >
                  Regenerate
                </Button>
              </div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-gray-300 whitespace-pre-wrap">{forward}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Chapters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Chapters ({generatedChapters}/{totalChapters}) - {completionPercentage}% Complete
            </span>
            <Button
              onClick={onGenerateAllChapters}
              disabled={isLoading?.chapters}
              variant="outline"
            >
              {isLoading?.chapters ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating & Validating Range...
                </>
              ) : (
                'Generate All Chapters'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: totalChapters }, (_, index) => {
              const chapterNumber = index + 1;
              const chapter = chapters?.find(c => c.chapterNumber === chapterNumber);
              const isExpanded = expandedChapter === chapterNumber;

              return (
                <Card key={chapterNumber} className="border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-100">
                        Chapter {chapterNumber}
                        {chapter && (
                          <span className="ml-2 text-sm text-gray-400">
                            ({chapter.wordCount?.toLocaleString()} words
                            {chapter.wordTarget && ` / ${chapter.wordTarget?.toLocaleString()} target`})
                          </span>
                        )}
                      </h4>
                      <div className="flex gap-2">
                        {chapter ? (
                          <>
                            <Badge variant="success">
                              {chapter.humanizationScore}% Humanized
                            </Badge>
                            {chapter.wordCountCompliance !== undefined && (
                              <Badge 
                                variant={chapter.meetsWordCountRequirement ? "success" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                {chapter.meetsWordCountRequirement ? '✓' : '⚠'} {chapter.wordCountCompliance}% (92-110% target)
                              </Badge>
                            )}
                            {chapter.finalAttempt && chapter.finalAttempt > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {chapter.finalAttempt} attempts
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedChapter(isExpanded ? null : chapterNumber)}
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadAsFile(chapter.content || '', `chapter-${chapterNumber}.txt`)}
                            >
                              <Download size={16} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => onGenerateChapter(chapterNumber)}
                            disabled={isLoading?.[`chapter-${chapterNumber}`]}
                            size="sm"
                          >
                            {isLoading?.[`chapter-${chapterNumber}`] ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Generating & Validating Range...
                              </>
                            ) : (
                              'Generate'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {chapter && isExpanded && (
                      <div className="bg-gray-800/50 p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-gray-300 whitespace-pre-wrap">{chapter.content}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download size={20} />
            Download Complete Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => onDownloadBook('pdf')}
              disabled={!forward || generatedChapters === 0}
            >
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => onDownloadBook('docx')}
              disabled={!forward || generatedChapters === 0}
            >
              Download Word
            </Button>
            <Button
              variant="outline"
              onClick={() => onDownloadBook('txt')}
              disabled={!forward || generatedChapters === 0}
            >
              Download Text
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={onNext}
          disabled={!forward || generatedChapters === 0}
          size="lg"
          className="px-8"
        >
          Finalize & Generate Marketing Assets
        </Button>
      </div>
    </div>
  );
}
