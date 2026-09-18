'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, BookCopy, Library, Users, Globe, GitBranch, Clock,
  Heart, Palette, BookOpen, Lightbulb, AlertTriangle, RefreshCw,
  Sparkles, ChevronDown, ChevronRight, Save, PenLine,
} from 'lucide-react';

interface BibleData {
  id: string;
  seriesOverview: any;
  characters: any;
  worldBuilding: any;
  plotArcs: any;
  timeline: any;
  relationships: any;
  themes: any;
  voiceAndStyle: any;
  visualGuide: any;
  coverImages: any;
  storylines: any;
  continuityNotes: any;
  nextBookSuggestions: any;
  updatedAt: string;
}

const SECTIONS = [
  { key: 'seriesOverview', label: 'Series Overview', icon: BookCopy, color: 'text-teal-400' },
  { key: 'characters', label: 'Characters', icon: Users, color: 'text-blue-400' },
  { key: 'worldBuilding', label: 'World Building', icon: Globe, color: 'text-green-400' },
  { key: 'plotArcs', label: 'Plot Arcs', icon: GitBranch, color: 'text-purple-400' },
  { key: 'timeline', label: 'Timeline', icon: Clock, color: 'text-yellow-400' },
  { key: 'relationships', label: 'Relationships', icon: Heart, color: 'text-pink-400' },
  { key: 'themes', label: 'Themes & Motifs', icon: Lightbulb, color: 'text-orange-400' },
  { key: 'voiceAndStyle', label: 'Voice & Style', icon: PenLine, color: 'text-cyan-400' },
  { key: 'visualGuide', label: 'Visual Guide', icon: Palette, color: 'text-rose-400' },
  { key: 'storylines', label: 'Storylines', icon: GitBranch, color: 'text-indigo-400' },
  { key: 'continuityNotes', label: 'Continuity Notes', icon: AlertTriangle, color: 'text-amber-400' },
  { key: 'nextBookSuggestions', label: 'Next Book Ideas', icon: Sparkles, color: 'text-teal-300' },
];

function RenderJSON({ data, depth = 0 }: { data: any; depth?: number }) {
  if (data === null || data === undefined) return <span className="text-gray-500 italic">Empty</span>;
  if (typeof data === 'string') return <span className="text-gray-300">{data}</span>;
  if (typeof data === 'number' || typeof data === 'boolean') return <span className="text-teal-300">{String(data)}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-500 italic">None</span>;
    // Array of strings → bullet list
    if (data.every(d => typeof d === 'string')) {
      return (
        <ul className="space-y-1 ml-2">
          {data.map((item, i) => (
            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
              <span className="text-teal-400 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    // Array of objects → cards
    return (
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            {item.name && <p className="font-medium text-white mb-1">{item.name}</p>}
            {item.title && !item.name && <p className="font-medium text-white mb-1">{item.title}</p>}
            <RenderJSON data={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([k]) => k !== 'name' && k !== 'title' && depth > 0 ? true : true);
    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-0' : ''}`}>
        {entries.map(([key, val]) => {
          // Skip redundant name/title in nested objects
          if (depth > 0 && (key === 'name' || key === 'title') && typeof val === 'string') return null;
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
          return (
            <div key={key}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
              <RenderJSON data={val} depth={depth + 1} />
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-gray-300">{String(data)}</span>;
}

export default function StoryBiblePage() {
  const { data: authSession, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const seriesId = params?.id as string;

  const [seriesName, setSeriesName] = useState('');
  const [bible, setBible] = useState<BibleData | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['seriesOverview', 'characters']));
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const loadBible = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/bible`);
      if (!res.ok) { router.replace('/library'); return; }
      const data = await res.json();
      setSeriesName(data.series?.name || 'Untitled Series');
      setBible(data.bible);
      setBooks(data.books || []);
    } catch {
      toast({ title: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (status === 'authenticated' && seriesId) loadBible(); /* eslint-disable-next-line */ }, [status, seriesId]);

  const handleGenerate = async (bookId?: string) => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/series/${seriesId}/bible`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookId ? { bookId } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }
      toast({ title: 'Story Bible generated!' });
      loadBible();
    } catch (err: any) {
      toast({ title: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSection = async (key: string) => {
    try {
      const parsed = JSON.parse(editValue);
      const res = await fetch(`/api/series/${seriesId}/bible`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: parsed }),
      });
      if (res.ok) {
        toast({ title: 'Section saved' });
        setEditingSection(null);
        loadBible();
      } else toast({ title: 'Save failed', variant: 'destructive' });
    } catch {
      toast({ title: 'Invalid JSON', variant: 'destructive' });
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const startEdit = (key: string) => {
    const val = bible ? (bible as any)[key] : null;
    setEditValue(JSON.stringify(val, null, 2) || 'null');
    setEditingSection(key);
  };

  if (status === 'loading' || !authSession || loading) {
    return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>);
  }

  const hasContent = bible && SECTIONS.some(s => (bible as any)[s.key] !== null);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/library" onClick={() => {}}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />Library
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <Library className="h-6 w-6 text-pink-400" />
            <div>
              <h1 className="text-lg font-bold text-white">{seriesName}</h1>
              <p className="text-xs text-gray-400">Story Bible · {books.length} book{books.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="bg-pink-500 hover:bg-pink-600 text-white"
              size="sm"
            >
              {generating ? (
                <><LoadingSpinner size="sm" className="mr-2" />Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />{hasContent ? 'Refresh Bible' : 'Generate Bible'}</>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Books in series */}
        {books.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-400" />
                Books in Series
              </h3>
              <div className="flex flex-wrap gap-2">
                {books.map((b: any, i: number) => (
                  <span key={b.id} className="text-xs bg-gray-900/50 border border-gray-700 rounded-md px-2.5 py-1 text-gray-300">
                    #{b.seriesOrder || i + 1} {b.name || b.selectedTitle || b.customTitle || 'Untitled'}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!hasContent ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12 text-center text-gray-400">
              <Library className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg mb-2">Story Bible is empty</p>
              <p className="text-sm mb-4">Add books to the series and generate the Story Bible to track characters, world-building, plot arcs, and more.</p>
              <Button
                onClick={() => handleGenerate()}
                disabled={generating || books.length === 0}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {generating ? 'Generating…' : 'Generate Story Bible'}
              </Button>
              {books.length === 0 && (
                <p className="text-xs text-gray-500 mt-3">You need at least one book in the series to generate a Story Bible.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {SECTIONS.map(({ key, label, icon: Icon, color }) => {
              const val = (bible as any)?.[key];
              if (val === null || val === undefined) return null;
              const isExpanded = expandedSections.has(key);
              const isEditing = editingSection === key;

              return (
                <Card key={key} className="bg-gray-800/50 border-gray-700">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-700/30 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                    <Icon className={`h-5 w-5 ${color}`} />
                    <span className="font-medium text-white flex-1">{label}</span>
                    <span className="text-xs text-gray-500">
                      {Array.isArray(val) ? `${val.length} items` : 'View'}
                    </span>
                  </button>
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="border-t border-gray-700/50 pt-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono resize-y min-h-[200px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveSection(key)} className="bg-teal-500 hover:bg-teal-600">
                                <Save className="h-3.5 w-3.5 mr-1" />Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="border-gray-600 text-gray-300">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <RenderJSON data={val} />
                            <Button size="sm" variant="outline" onClick={() => startEdit(key)} className="mt-3 border-gray-600 text-gray-400 hover:text-white">
                              <PenLine className="h-3.5 w-3.5 mr-1" />Edit JSON
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {bible?.updatedAt && (
          <p className="text-xs text-gray-500 text-center mt-6">
            Last updated: {new Date(bible.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
