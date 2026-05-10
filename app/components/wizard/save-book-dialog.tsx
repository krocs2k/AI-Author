'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface FolderRow {
  id: string;
  name: string;
  parentId: string | null;
}

function buildPath(folders: FolderRow[], id: string): string {
  const map = new Map(folders.map(f => [f.id, f]));
  const parts: string[] = [];
  let cur: FolderRow | undefined = map.get(id);
  let safety = 0;
  while (cur && safety++ < 50) {
    parts.unshift(cur.name);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return parts.join(' / ');
}

export function SaveBookDialog({
  open,
  onOpenChange,
  sessionId,
  currentName,
  currentFolderId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sessionId: string;
  currentName: string;
  currentFolderId: string | null;
  onSaved?: (name: string, folderId: string | null) => void;
}) {
  const [name, setName] = useState(currentName);
  const [folderId, setFolderId] = useState<string | null>(currentFolderId);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(currentName);
      setFolderId(currentFolderId);
      fetch('/api/folders').then(r => r.json()).then(j => setFolders(j.folders || [])).catch(() => {});
    }
  }, [open, currentName, currentFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: folderId || null }),
      });
      if (!res.ok) throw new Error('Create failed');
      const j = await res.json();
      setFolders(prev => [...prev, j.folder]);
      setFolderId(j.folder.id);
      setNewFolderName('');
      toast({ title: 'Folder created' });
    } catch (e: any) {
      toast({ title: 'Failed to create folder', variant: 'destructive' });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, name: name.trim() || null, folderId: folderId || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Save failed');
      }
      toast({ title: 'Book saved', description: 'Your progress is stored. You can continue from any device.' });
      onSaved?.(name.trim(), folderId);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-white">Save Book</DialogTitle>
          <DialogDescription className="text-gray-400">
            Give this book a name and pick a folder so you can find and continue it later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Book Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Aurora — Working Draft"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Folder</Label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2"
            >
              <option value="">— No folder (root) —</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{buildPath(folders, f.id)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 border-t border-gray-700 pt-3">
            <Label className="text-gray-300 text-xs">Or create a new folder {folderId ? `(inside "${buildPath(folders, folderId)}")` : '(at root)'}</Label>
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name"
                className="bg-gray-900 border-gray-700 text-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className="border-gray-600 text-gray-200 hover:bg-gray-700"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600 text-gray-200 hover:bg-gray-700">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-500 hover:bg-teal-600">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
