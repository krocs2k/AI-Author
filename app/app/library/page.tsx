'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Folder, FolderOpen, FolderPlus, ChevronRight, ChevronDown, Trash2, Edit2, MoveRight, ArrowLeft, Plus } from 'lucide-react';

interface FolderRow {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { sessions: number; children: number };
}
interface BookRow {
  id: string;
  name: string | null;
  selectedTitle: string | null;
  customTitle: string | null;
  selectedGenre: string | null;
  currentStep: number;
  totalWordCount: number | null;
  folderId: string | null;
  updatedAt: string;
}

function Tree({
  folders,
  parentId,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  depth = 0,
}: {
  folders: FolderRow[];
  parentId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  const children = folders.filter(f => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
  if (children.length === 0) return null;
  return (
    <ul className="space-y-0.5">
      {children.map(f => {
        const isOpen = expanded.has(f.id);
        const hasKids = folders.some(c => c.parentId === f.id);
        const isSelected = selectedId === f.id;
        return (
          <li key={f.id}>
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm group ${
                isSelected ? 'bg-teal-500/20 text-teal-300' : 'text-gray-300 hover:bg-gray-700/50'
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => onSelect(f.id)}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (hasKids) onToggle(f.id); }}
                className={`w-4 ${hasKids ? 'visible' : 'invisible'}`}
              >
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {isOpen ? <FolderOpen className="h-4 w-4 text-teal-400" /> : <Folder className="h-4 w-4 text-teal-400" />}
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-xs text-gray-500">{f._count?.sessions ?? 0}</span>
            </div>
            {isOpen && (
              <Tree folders={folders} parentId={f.id} selectedId={selectedId} onSelect={onSelect} expanded={expanded} onToggle={onToggle} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function LibraryPage() {
  const { data: authSession, status } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();

  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = root
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ kind: 'folder' | 'book'; id: string; value: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ id: string; kind: 'folder' | 'book' } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [fRes, bRes] = await Promise.all([
        fetch('/api/folders'),
        fetch(selectedFolderId ? `/api/sessions?folderId=${selectedFolderId}` : `/api/sessions?folderId=null`),
      ]);
      const fJson = await fRes.json();
      const bJson = await bRes.json();
      setFolders(fJson.folders || []);
      setBooks(bJson.sessions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (status === 'authenticated') loadAll(); /* eslint-disable-next-line */ }, [status, selectedFolderId]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const createFolder = async () => {
    if (!newFolderInput.trim()) return;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFolderInput.trim(), parentId: selectedFolderId }),
    });
    if (res.ok) {
      setNewFolderInput('');
      toast({ title: 'Folder created' });
      if (selectedFolderId) setExpanded(prev => new Set(prev).add(selectedFolderId));
      loadAll();
    } else toast({ title: 'Failed to create', variant: 'destructive' });
  };

  const deleteFolder = async (id: string) => {
    if (!confirm('Delete this folder? Books inside will be moved to root.')) return;
    const res = await fetch(`/api/folders?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast({ title: 'Folder deleted' }); if (selectedFolderId === id) setSelectedFolderId(null); loadAll(); }
    else toast({ title: 'Delete failed', variant: 'destructive' });
  };

  const renameFolder = async (id: string, name: string) => {
    const res = await fetch('/api/folders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    if (res.ok) { toast({ title: 'Renamed' }); loadAll(); } else toast({ title: 'Rename failed', variant: 'destructive' });
  };

  const moveFolder = async (id: string, parentId: string | null) => {
    const res = await fetch('/api/folders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, parentId }),
    });
    if (res.ok) { toast({ title: 'Moved' }); loadAll(); }
    else { const j = await res.json().catch(() => ({})); toast({ title: 'Move failed', description: j.error, variant: 'destructive' }); }
  };

  const renameBook = async (id: string, name: string) => {
    const res = await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    if (res.ok) { toast({ title: 'Renamed' }); loadAll(); } else toast({ title: 'Rename failed', variant: 'destructive' });
  };

  const moveBook = async (id: string, folderId: string | null) => {
    const res = await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, folderId }),
    });
    if (res.ok) { toast({ title: 'Moved' }); loadAll(); } else toast({ title: 'Move failed', variant: 'destructive' });
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Delete this book permanently? This cannot be undone.')) return;
    const res = await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast({ title: 'Deleted' }); loadAll(); } else toast({ title: 'Delete failed', variant: 'destructive' });
  };

  const folderPath = useMemo(() => {
    if (!selectedFolderId) return 'All Books (Root)';
    const map = new Map(folders.map(f => [f.id, f]));
    const parts: string[] = [];
    let cur = map.get(selectedFolderId);
    let safety = 0;
    while (cur && safety++ < 50) { parts.unshift(cur.name); cur = cur.parentId ? map.get(cur.parentId) : undefined; }
    return parts.join(' / ');
  }, [selectedFolderId, folders]);

  if (status === 'loading' || !authSession) {
    return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-teal-400" />
            <h1 className="text-2xl font-bold text-teal-400">AI Author — Library</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4 mr-2" />Back to Wizard</Button></Link>
            <Link href="/dashboard"><Button size="sm" className="bg-teal-500 hover:bg-teal-600"><Plus className="h-4 w-4 mr-2" />New Book</Button></Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Folder tree */}
        <Card className="bg-gray-800/50 border-gray-700 h-fit">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">Folders</h3>
            </div>
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                selectedFolderId === null ? 'bg-teal-500/20 text-teal-300' : 'text-gray-300 hover:bg-gray-700/50'
              }`}
              onClick={() => setSelectedFolderId(null)}
            >
              <FolderOpen className="h-4 w-4 text-teal-400" />
              <span>All Books (Root)</span>
            </div>
            <Tree
              folders={folders}
              parentId={null}
              selectedId={selectedFolderId}
              onSelect={setSelectedFolderId}
              expanded={expanded}
              onToggle={toggle}
            />
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">{selectedFolderId ? `New subfolder in "${folderPath}"` : 'New root folder'}</p>
              <div className="flex gap-1">
                <Input
                  value={newFolderInput}
                  onChange={(e) => setNewFolderInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                  placeholder="Folder name"
                  className="bg-gray-900 border-gray-700 text-white text-sm"
                />
                <Button size="sm" onClick={createFolder} className="bg-teal-500 hover:bg-teal-600"><FolderPlus className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right pane */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{folderPath}</h2>
              <p className="text-sm text-gray-400">{books.length} book{books.length === 1 ? '' : 's'}</p>
            </div>
            {selectedFolderId && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setRenameTarget({ kind: 'folder', id: selectedFolderId, value: folders.find(f => f.id === selectedFolderId)?.name || '' })} className="border-gray-600 text-gray-200 hover:bg-gray-700"><Edit2 className="h-4 w-4 mr-1" />Rename</Button>
                <Button size="sm" variant="outline" onClick={() => setMoveTarget({ id: selectedFolderId, kind: 'folder' })} className="border-gray-600 text-gray-200 hover:bg-gray-700"><MoveRight className="h-4 w-4 mr-1" />Move</Button>
                <Button size="sm" variant="outline" onClick={() => deleteFolder(selectedFolderId)} className="border-red-700 text-red-300 hover:bg-red-900/40"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : books.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12 text-center text-gray-400">
                No saved books in this folder yet.
                <div className="mt-4"><Link href="/dashboard"><Button className="bg-teal-500 hover:bg-teal-600"><Plus className="h-4 w-4 mr-2" />Start a New Book</Button></Link></div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {books.map(b => {
                const title = b.name || b.selectedTitle || b.customTitle || 'Untitled Book';
                return (
                  <Card key={b.id} className="bg-gray-800/50 border-gray-700 hover:border-teal-500/60 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{title}</h3>
                          <p className="text-xs text-gray-400">{b.selectedGenre || 'No genre'} · Step {b.currentStep}/6 · {(b.totalWordCount || 0).toLocaleString()} words</p>
                          <p className="text-xs text-gray-500 mt-1">Updated {new Date(b.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/dashboard?sessionId=${b.id}`}>
                          <Button size="sm" className="bg-teal-500 hover:bg-teal-600">Open & Continue</Button>
                        </Link>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={() => setRenameTarget({ kind: 'book', id: b.id, value: b.name || title })}><Edit2 className="h-3 w-3 mr-1" />Rename</Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={() => setMoveTarget({ id: b.id, kind: 'book' })}><MoveRight className="h-3 w-3 mr-1" />Move</Button>
                        <Button size="sm" variant="outline" className="border-red-700 text-red-300 hover:bg-red-900/40" onClick={() => deleteBook(b.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rename dialog */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setRenameTarget(null)}>
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Rename {renameTarget.kind}</h3>
              <Input value={renameTarget.value} onChange={(e) => setRenameTarget({ ...renameTarget, value: e.target.value })} className="bg-gray-900 border-gray-700 text-white" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRenameTarget(null)} className="border-gray-600 text-gray-200">Cancel</Button>
                <Button className="bg-teal-500 hover:bg-teal-600" onClick={async () => {
                  if (renameTarget.kind === 'folder') await renameFolder(renameTarget.id, renameTarget.value);
                  else await renameBook(renameTarget.id, renameTarget.value);
                  setRenameTarget(null);
                }}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Move dialog */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setMoveTarget(null)}>
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Move {moveTarget.kind} to folder</h3>
              <select id="move-target" className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2" defaultValue="">
                <option value="">— Root —</option>
                {folders.filter(f => moveTarget.kind === 'folder' ? f.id !== moveTarget.id : true).map(f => {
                  const map = new Map(folders.map(x => [x.id, x]));
                  const parts: string[] = []; let cur = map.get(f.id); let s = 0;
                  while (cur && s++ < 50) { parts.unshift(cur.name); cur = cur.parentId ? map.get(cur.parentId) : undefined; }
                  return <option key={f.id} value={f.id}>{parts.join(' / ')}</option>;
                })}
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMoveTarget(null)} className="border-gray-600 text-gray-200">Cancel</Button>
                <Button className="bg-teal-500 hover:bg-teal-600" onClick={async () => {
                  const sel = (document.getElementById('move-target') as HTMLSelectElement | null)?.value || '';
                  const newParent = sel || null;
                  if (moveTarget.kind === 'folder') await moveFolder(moveTarget.id, newParent);
                  else await moveBook(moveTarget.id, newParent);
                  setMoveTarget(null);
                }}>Move</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
