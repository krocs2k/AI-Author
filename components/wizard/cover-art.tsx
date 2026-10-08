'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image as ImageIcon, Sparkles, Check, RefreshCw, Wand2, ArrowRight, Palette, User, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface CoverImage {
  imageUrl: string;
  prompt: string;
  model: string;
}

type CoverType = 'front' | 'back';

interface CoverArtProps {
  sessionId: string;
  title?: string;
  authorName?: string;
  publishingInfo?: string;
  coverImageUrl?: string;
  coverImagePrompt?: string;
  coverImageModel?: string;
  backCoverImageUrl?: string;
  backCoverImagePrompt?: string;
  backCoverImageModel?: string;
  onCoverSaved: (imageUrl: string, prompt: string, model: string) => void;
  onBackCoverSaved: (imageUrl: string, prompt: string, model: string) => void;
  onDetailsChange: (authorName: string, publishingInfo: string) => void;
  onNext: () => void;
  isLoading?: { [key: string]: boolean };
}

export function CoverArt({
  sessionId,
  title,
  authorName: authorNameProp,
  publishingInfo: publishingInfoProp,
  coverImageUrl,
  coverImagePrompt,
  coverImageModel,
  backCoverImageUrl,
  backCoverImagePrompt,
  backCoverImageModel,
  onCoverSaved,
  onBackCoverSaved,
  onDetailsChange,
  onNext,
}: CoverArtProps) {
  const [authorName, setAuthorName] = useState(authorNameProp || '');
  const [publishingInfo, setPublishingInfo] = useState(publishingInfoProp || '');

  // Front cover state
  const [frontCovers, setFrontCovers] = useState<CoverImage[]>([]);
  const [frontIndex, setFrontIndex] = useState<number | null>(null);
  const [frontCustom, setFrontCustom] = useState('');
  const [frontGenerating, setFrontGenerating] = useState(false);
  const [frontSaving, setFrontSaving] = useState(false);
  const [frontSaved, setFrontSaved] = useState(!!coverImageUrl);
  const [frontError, setFrontError] = useState<string | null>(null);

  // Back cover state
  const [backCovers, setBackCovers] = useState<CoverImage[]>([]);
  const [backIndex, setBackIndex] = useState<number | null>(null);
  const [backCustom, setBackCustom] = useState('');
  const [backGenerating, setBackGenerating] = useState(false);
  const [backSaving, setBackSaving] = useState(false);
  const [backSaved, setBackSaved] = useState(!!backCoverImageUrl);
  const [backError, setBackError] = useState<string | null>(null);

  const persistDetails = () => onDetailsChange(authorName.trim(), publishingInfo.trim());

  const handleGenerate = async (coverType: CoverType, useCustom: boolean) => {
    const isBack = coverType === 'back';
    const setGenerating = isBack ? setBackGenerating : setFrontGenerating;
    const setError = isBack ? setBackError : setFrontError;
    const setCovers = isBack ? setBackCovers : setFrontCovers;
    const setIndex = isBack ? setBackIndex : setFrontIndex;
    const setSaved = isBack ? setBackSaved : setFrontSaved;
    const custom = isBack ? backCustom : frontCustom;

    setGenerating(true);
    setError(null);
    setIndex(null);
    setSaved(false);
    // Make sure the author/publishing text is saved before it is drawn on the cover.
    persistDetails();

    try {
      const res = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'generate',
          coverType,
          authorName: authorName.trim(),
          publishingInfo: publishingInfo.trim(),
          customPrompt: useCustom && custom.trim() ? custom.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      setCovers(data.images || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover art');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (coverType: CoverType) => {
    const isBack = coverType === 'back';
    const covers = isBack ? backCovers : frontCovers;
    const index = isBack ? backIndex : frontIndex;
    if (index === null || !covers[index]) return;

    const setSaving = isBack ? setBackSaving : setFrontSaving;
    const setError = isBack ? setBackError : setFrontError;
    const setSaved = isBack ? setBackSaved : setFrontSaved;

    setSaving(true);
    setError(null);

    const cover = covers[index];
    try {
      const res = await fetch('/api/generate-cover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          coverType,
          imageUrl: cover.imageUrl,
          prompt: cover.prompt,
          model: cover.model,
          authorName: authorName.trim(),
          publishingInfo: publishingInfo.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }

      setSaved(true);
      if (isBack) onBackCoverSaved(cover.imageUrl, cover.prompt, cover.model);
      else onCoverSaved(cover.imageUrl, cover.prompt, cover.model);
    } catch (err: any) {
      setError(err.message || 'Failed to save cover');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (coverType: CoverType) => {
    const isBack = coverType === 'back';
    const label = isBack ? 'Back Cover' : 'Front Cover';
    const covers = isBack ? backCovers : frontCovers;
    const index = isBack ? backIndex : frontIndex;
    const custom = isBack ? backCustom : frontCustom;
    const setCustom = isBack ? setBackCustom : setFrontCustom;
    const generating = isBack ? backGenerating : frontGenerating;
    const saving = isBack ? backSaving : frontSaving;
    const saved = isBack ? backSaved : frontSaved;
    const error = isBack ? backError : frontError;
    const setIndex = isBack ? setBackIndex : setFrontIndex;
    const setSaved = isBack ? setBackSaved : setFrontSaved;
    const savedUrl = isBack ? backCoverImageUrl : coverImageUrl;
    const savedPrompt = isBack ? backCoverImagePrompt : coverImagePrompt;
    const savedModel = isBack ? backCoverImageModel : coverImageModel;
    const displayCover = saved && savedUrl ? savedUrl : null;
    const hasCovers = covers.length > 0;
    const genLabel = isBack ? 'Generate Back Cover' : 'Generate from Book Content';

    return (
      <Card className="bg-gray-800/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            {isBack ? <BookOpen className="h-5 w-5 text-pink-400" /> : <Sparkles className="h-5 w-5 text-pink-400" />}
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Previously saved cover */}
          {displayCover && (
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-gray-900/40 border border-gray-700">
              <div className="relative w-40 aspect-[2/3] rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <Image src={displayCover} alt={`${label} for ${title || 'your book'}`} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <p className="text-green-400 flex items-center gap-2 font-medium"><Check className="h-4 w-4" /> Saved {label}</p>
                {savedModel && <p className="text-gray-400"><span className="text-gray-300 font-medium">Model:</span> {savedModel}</p>}
                {savedPrompt && (
                  <p className="text-gray-400"><span className="text-gray-300 font-medium">Prompt:</span> {savedPrompt.slice(0, 160)}{savedPrompt.length > 160 ? '…' : ''}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-2">Custom Prompt (optional)</label>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={isBack
                ? 'Describe your ideal back cover… or leave blank to build it from your blurb and book content'
                : 'Describe your ideal cover… or leave blank for AI to decide based on your book content'}
              className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-none h-20"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleGenerate(coverType, false)} disabled={generating} className="bg-teal-500 hover:bg-teal-600 text-white">
              {generating ? (<><LoadingSpinner size="sm" className="mr-2" />Generating…</>) : (<><Wand2 className="h-4 w-4 mr-2" />{genLabel}</>)}
            </Button>
            {custom.trim() && (
              <Button onClick={() => handleGenerate(coverType, true)} disabled={generating} variant="outline" className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10">
                {generating ? (<><LoadingSpinner size="sm" className="mr-2" />Generating…</>) : (<><Sparkles className="h-4 w-4 mr-2" />Generate from Custom Prompt</>)}
              </Button>
            )}
            {hasCovers && !generating && (
              <Button onClick={() => handleGenerate(coverType, !!custom.trim())} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <RefreshCw className="h-4 w-4 mr-2" />Regenerate
              </Button>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {hasCovers && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {covers.map((cover, i) => (
                <button
                  key={i}
                  onClick={() => { setIndex(i); setSaved(false); }}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    index === i ? 'border-teal-400 ring-2 ring-teal-400/30 scale-[1.02]' : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="relative aspect-[2/3] bg-gray-700">
                    <Image src={cover.imageUrl} alt={`${label} option ${i + 1} for ${title || 'your book'}`} fill className="object-cover" unoptimized />
                  </div>
                  {index === i && (<div className="absolute top-3 right-3 bg-teal-500 rounded-full p-1.5"><Check className="h-4 w-4 text-white" /></div>)}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-xs text-gray-300">Option {i + 1} · {cover.model}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {index !== null && !saved && (
            <div className="flex justify-center pt-2">
              <Button onClick={() => handleSave(coverType)} disabled={saving} className="bg-teal-500 hover:bg-teal-600 text-white px-8">
                {saving ? (<><LoadingSpinner size="sm" className="mr-2" />Saving…</>) : (<><Check className="h-4 w-4 mr-2" />Select This {label}</>)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Palette className="h-8 w-8 text-pink-400" />
          <h2 className="text-3xl font-bold text-white">Cover Art</h2>
        </div>
        <p className="text-gray-400 text-lg">
          Generate AI-powered front &amp; back covers for{' '}
          <span className="text-teal-400 font-medium">{title ? `"${title}"` : 'your book'}</span>
        </p>
      </div>

      {/* Author & Publishing details */}
      <Card className="bg-gray-800/50 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <User className="h-5 w-5 text-teal-400" />
            Author &amp; Publishing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">These are printed on your covers. Fill them in before generating.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onBlur={persistDetails}
                placeholder="e.g. Jane Doe"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Publishing Information</label>
              <input
                type="text"
                value={publishingInfo}
                onChange={(e) => setPublishingInfo(e.target.value)}
                onBlur={persistDetails}
                placeholder="e.g. Acme Publishing House, 2026"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {renderSection('front')}
      {renderSection('back')}

      {/* Continue */}
      <div className="flex justify-end gap-3 mt-6">
        {!frontSaved && frontCovers.length === 0 && backCovers.length === 0 && !backSaved ? (
          <Button onClick={onNext} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Skip Cover Art
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onNext} className="bg-teal-500 hover:bg-teal-600 text-white">
            Continue to Marketing
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
