
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookMetrics } from '@/lib/types';
import { Image, FileText, Copy, Download, Sparkles } from 'lucide-react';
import { formatReadTime, formatNumber, downloadAsFile } from '@/lib/utils';

interface MarketingFinalizationProps {
  title?: string;
  metrics?: BookMetrics;
  coverPrompts?: {
    front: string[];
    back: string[];
  };
  salesCopy?: string;
  backCoverCopy?: string;
  onGenerateCoverPrompts: () => void;
  onGenerateSalesCopy: () => void;
  onGenerateBackCover: () => void;
  onDownloadAll: () => void;
  isLoading?: { [key: string]: boolean };
}

export function MarketingFinalization({
  title,
  metrics,
  coverPrompts,
  salesCopy,
  backCoverCopy,
  onGenerateCoverPrompts,
  onGenerateSalesCopy,
  onGenerateBackCover,
  onDownloadAll,
  isLoading
}: MarketingFinalizationProps) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(id);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Marketing Assets & Finalization
        </h2>
        <p className="text-lg text-gray-400">
          Generate professional marketing materials for your book
        </p>
      </div>

      {/* Final Metrics */}
      <Card className="mb-8 border-teal-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-400">
            <Sparkles size={20} />
            Final Book Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-400">
                {metrics?.humanizationScore || 0}%
              </p>
              <p className="text-sm text-gray-400">Humanization Quality</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">
                {formatNumber(metrics?.totalWordCount || 0)}
              </p>
              <p className="text-sm text-gray-400">Total Words</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">
                {formatReadTime(metrics?.estimatedReadTime || 0)}
              </p>
              <p className="text-sm text-gray-400">Read Time</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">
                {metrics?.successProbability || 0}%
              </p>
              <p className="text-sm text-gray-400">Success Probability</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Assets Tabs */}
      <Tabs defaultValue="covers" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="covers">Cover Designs</TabsTrigger>
          <TabsTrigger value="sales">Sales Copy</TabsTrigger>
          <TabsTrigger value="back-cover">Back Cover</TabsTrigger>
        </TabsList>

        <TabsContent value="covers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Image size={20} />
                  Cover Image Prompts
                </span>
                {!coverPrompts && (
                  <Button
                    onClick={onGenerateCoverPrompts}
                    disabled={isLoading?.covers}
                  >
                    {isLoading?.covers ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Cover Prompts'
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            {coverPrompts && (
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-4">Front Cover Prompts</h4>
                    <div className="space-y-3">
                      {coverPrompts.front?.map((prompt, index) => (
                        <Card key={`front-${index}`} className="border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline">Front {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(prompt, `front-${index}`)}
                              >
                                {copiedPrompt === `front-${index}` ? (
                                  <span className="text-green-400">Copied!</span>
                                ) : (
                                  <Copy size={16} />
                                )}
                              </Button>
                            </div>
                            <p className="text-gray-300 text-sm">{prompt}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-200 mb-4">Back Cover Prompts</h4>
                    <div className="space-y-3">
                      {coverPrompts.back?.map((prompt, index) => (
                        <Card key={`back-${index}`} className="border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline">Back {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(prompt, `back-${index}`)}
                              >
                                {copiedPrompt === `back-${index}` ? (
                                  <span className="text-green-400">Copied!</span>
                                ) : (
                                  <Copy size={16} />
                                )}
                              </Button>
                            </div>
                            <p className="text-gray-300 text-sm">{prompt}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText size={20} />
                  SEO-Optimized Sales Copy
                </span>
                {!salesCopy && (
                  <Button
                    onClick={onGenerateSalesCopy}
                    disabled={isLoading?.sales}
                  >
                    {isLoading?.sales ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Sales Copy'
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            {salesCopy && (
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="success">AIDA/PAS Optimized</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsFile(salesCopy, 'sales-copy.txt')}
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-gray-300 whitespace-pre-wrap">{salesCopy}</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="back-cover">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText size={20} />
                  Back Cover Copy
                </span>
                {!backCoverCopy && (
                  <Button
                    onClick={onGenerateBackCover}
                    disabled={isLoading?.backCover}
                  >
                    {isLoading?.backCover ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Back Cover'
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            {backCoverCopy && (
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="success">Commercial Copy</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsFile(backCoverCopy, 'back-cover-copy.txt')}
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-gray-300 whitespace-pre-wrap">{backCoverCopy}</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center">
        <Button
          onClick={onDownloadAll}
          size="lg"
          className="px-8"
          disabled={!coverPrompts && !salesCopy && !backCoverCopy}
        >
          Finish & Download All Assets
        </Button>
      </div>
    </div>
  );
}
