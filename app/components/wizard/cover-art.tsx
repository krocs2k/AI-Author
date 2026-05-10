'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Sparkles, Check, RefreshCw, Wand2, ArrowRight, Palette } from 'lucide-react';
import Image from 'next/image';

interface CoverImage {
  imageUrl: string;
  prompt: string;
  model: string;
}

interface CoverArtProps {
  sessionId: string;
  title?: string;
  coverImageUrl?: string;
  coverImagePrompt?: string;
  coverImageModel?: string;
  onCoverSaved: (imageUrl: string, prompt: string, model: string) => void;
  onNext: () => void;
  isLoading?: { [key: string]: boolean };
}

export function CoverArt({
  sessionId,
  title,
  coverImageUrl,
  coverImagePrompt,
  coverImageModel,
  onCoverSaved,
  onNext,
  isLoading,
}: CoverArtProps) {
  const [generatedCovers, setGeneratedCovers] = useState<CoverImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!coverImageUrl);

  const handleGenerate = async (useCustom = false) => {
    setGenerating(true);
    setError(null);
    setSelectedIndex(null);
    setSaved(false);

    try {
      const res = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'generate',
          customPrompt: useCustom && customPrompt.trim() ? customPrompt.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      setGeneratedCovers(data.images || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover art');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (selectedIndex === null || !generatedCovers[selectedIndex]) return;
    setSaving(true);
    setError(null);

    const cover = generatedCovers[selectedIndex];
    try {
      const res = await fetch('/api/generate-cover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imageUrl: cover.imageUrl,
          prompt: cover.prompt,
          model: cover.model,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }

      setSaved(true);
      onCoverSaved(cover.imageUrl, cover.prompt, cover.model);
    } catch (err: any) {
      setError(err.message || 'Failed to save cover');
    } finally {
      setSaving(false);
    }
  };

  const displayCover = saved && coverImageUrl ? coverImageUrl : null;
  const hasCovers = generatedCovers.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Palette className="h-8 w-8 text-pink-400" />
          <h2 className="text-3xl font-bold text-white">Cover Art</h2>
        </div>
        <p className="text-gray-400 text-lg">
          Generate AI-powered cover art for{' '}
          <span className="text-teal-400 font-medium">
            {title ? `"${title}"` : 'your book'}
          </span>
        </p>
      </div>

      {/* Previously saved cover */}
      {displayCover && (
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Check className="h-5 w-5 text-green-400" />
              Selected Cover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-48 aspect-[2/3] rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <Image
                  src={displayCover}
                  alt={`Book cover for ${title || 'your book'}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 space-y-2 text-sm">
                {coverImageModel && (
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Model:</span> {coverImageModel}
                  </p>
                )}
                {coverImagePrompt && (
                  <p className="text-gray-400">
                    <span className="text-gray-300 font-medium">Prompt:</span>{' '}
                    {coverImagePrompt.slice(0, 200)}{coverImagePrompt.length > 200 ? '…' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Section */}
      <Card className="bg-gray-800/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            Generate Cover Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Custom Prompt (optional)</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe your ideal cover… or leave blank for AI to decide based on your book content"
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-none h-24"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleGenerate(false)}
              disabled={generating}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate from Book Content
                </>
              )}
            </Button>

            {customPrompt.trim() && (
              <Button
                onClick={() => handleGenerate(true)}
                disabled={generating}
                variant="outline"
                className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate from Custom Prompt
                  </>
                )}
              </Button>
            )}

            {hasCovers && !generating && (
              <Button
                onClick={() => handleGenerate(!!customPrompt.trim())}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Generated Covers Grid */}
      {hasCovers && (
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-teal-400" />
              Choose Your Cover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {generatedCovers.map((cover, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedIndex(i); setSaved(false); }}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedIndex === i
                      ? 'border-teal-400 ring-2 ring-teal-400/30 scale-[1.02]'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="relative aspect-[2/3] bg-gray-700">
                    <Image
                      src={cover.imageUrl}
                      alt={`Cover option ${i + 1} for ${title || 'your book'}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {selectedIndex === i && (
                    <div className="absolute top-3 right-3 bg-teal-500 rounded-full p-1.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-xs text-gray-300">
                      Option {i + 1} · {cover.model}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {selectedIndex !== null && !saved && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-8"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Select This Cover
                    </>
                  )}
                </Button>
              </div>
            )}

            {saved && (
              <div className="mt-4 text-center">
                <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  Cover saved successfully!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skip / Continue */}
      <div className="flex justify-end gap-3 mt-6">
        {!saved && !hasCovers && (
          <Button
            onClick={onNext}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Skip Cover Art
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {(saved || hasCovers) && (
          <Button
            onClick={onNext}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            Continue to Marketing
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
