'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Settings, Trash2, Edit, Save, ArrowLeft, LogOut, Shield, CheckCircle, XCircle, Brain, RefreshCw, Key, Sparkles, PenTool, Eye, EyeOff, Zap, CheckCircle2, BarChart3, DollarSign, TrendingDown, Lightbulb, Database } from 'lucide-react';
import { ReportingTab } from '@/components/admin/reporting-tab';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

interface GoogleSSOConfig {
  id?: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}

interface LLMModel {
  id: string;
  name: string;
  description?: string;
  category?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

interface LLMConfigState {
  hasAbacusKey: boolean;
  hasGeminiKey: boolean;
  abacusApiKey: string | null;
  geminiApiKey: string | null;
  activeProvider: string;
  ideaModel: string | null;
  writingModel: string | null;
  imageModel: string | null;
  abacusModels: LLMModel[] | null;
  geminiModels: LLMModel[] | null;
  abacusModelsRefreshedAt: string | null;
  geminiModelsRefreshedAt: string | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [googleConfig, setGoogleConfig] = useState<GoogleSSOConfig>({
    clientId: '',
    clientSecret: '',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' });

  // LLM Config state
  const [llmConfig, setLlmConfig] = useState<LLMConfigState>({
    hasAbacusKey: false,
    hasGeminiKey: false,
    abacusApiKey: null,
    geminiApiKey: null,
    activeProvider: 'abacus',
    ideaModel: null,
    writingModel: null,
    imageModel: null,
    abacusModels: null,
    geminiModels: null,
    abacusModelsRefreshedAt: null,
    geminiModelsRefreshedAt: null,
  });
  const [newAbacusKey, setNewAbacusKey] = useState('');
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [showAbacusKey, setShowAbacusKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [llmMessage, setLlmMessage] = useState('');
  const [llmSaving, setLlmSaving] = useState(false);
  const [refreshingAbacus, setRefreshingAbacus] = useState(false);
  const [refreshingGemini, setRefreshingGemini] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'ADMIN') {
        router.replace('/dashboard');
      } else {
        fetchUsers();
        fetchGoogleConfig();
        fetchLLMConfig();
      }
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleConfig = async () => {
    try {
      const res = await fetch('/api/admin/google-sso');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setGoogleConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching Google config:', error);
    }
  };

  const handleSaveGoogleConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/google-sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleConfig)
      });
      if (res.ok) {
        setMessage('Google SSO configuration saved successfully!');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      setMessage('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditForm({ name: user.name || '', role: user.role });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, ...data.user } : u));
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleToggleApproval = async (userId: string, currentApproval: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentApproval })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, isApproved: data.user.isApproved } : u));
      }
    } catch (error) {
      console.error('Error toggling approval:', error);
    }
  };

  // ----- LLM Config Handlers -----
  const fetchLLMConfig = async () => {
    try {
      const res = await fetch('/api/admin/llm-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setLlmConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching LLM config:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    setLlmSaving(true);
    setLlmMessage('');
    try {
      const body: any = { action: 'saveKeys' };
      if (newAbacusKey) body.abacusApiKey = newAbacusKey;
      if (newGeminiKey) body.geminiApiKey = newGeminiKey;

      const res = await fetch('/api/admin/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setLlmMessage('API keys saved successfully!');
        setNewAbacusKey('');
        setNewGeminiKey('');
        setShowAbacusKey(false);
        setShowGeminiKey(false);
        await fetchLLMConfig();
      } else {
        setLlmMessage(data.error || 'Failed to save keys');
      }
    } catch (error) {
      setLlmMessage('Error saving API keys');
    } finally {
      setLlmSaving(false);
    }
  };

  const handleSaveSelection = async (updates: { activeProvider?: string; ideaModel?: string; writingModel?: string; imageModel?: string }) => {
    setLlmSaving(true);
    setLlmMessage('');
    try {
      const res = await fetch('/api/admin/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSelection', ...updates }),
      });
      const data = await res.json();
      if (res.ok) {
        setLlmMessage('Selection saved!');
        await fetchLLMConfig();
      } else {
        setLlmMessage(data.error || 'Failed to save selection');
      }
    } catch (error) {
      setLlmMessage('Error saving selection');
    } finally {
      setLlmSaving(false);
    }
  };

  const handleRefreshModels = async (provider: 'abacus' | 'gemini') => {
    const setRefreshing = provider === 'abacus' ? setRefreshingAbacus : setRefreshingGemini;
    setRefreshing(true);
    setLlmMessage('');
    try {
      const res = await fetch('/api/admin/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refreshModels', provider }),
      });
      const data = await res.json();
      if (res.ok) {
        setLlmMessage(`${provider === 'abacus' ? 'Abacus.AI' : 'Gemini'} models refreshed! Found ${data.models?.length || 0} models.`);
        await fetchLLMConfig();
      } else {
        setLlmMessage(data.error || 'Failed to refresh models');
      }
    } catch (error) {
      setLlmMessage('Error refreshing models');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearKey = async (provider: 'abacus' | 'gemini') => {
    if (!confirm(`Are you sure you want to clear the ${provider === 'abacus' ? 'Abacus.AI' : 'Gemini'} API key?`)) return;
    try {
      await fetch('/api/admin/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearKey', provider }),
      });
      setLlmMessage(`${provider === 'abacus' ? 'Abacus.AI' : 'Gemini'} key cleared`);
      await fetchLLMConfig();
    } catch (error) {
      setLlmMessage('Error clearing key');
    }
  };

  const getActiveModels = (): LLMModel[] => {
    if (llmConfig.activeProvider === 'abacus') {
      return (llmConfig.abacusModels as LLMModel[] | null) || [];
    }
    return (llmConfig.geminiModels as LLMModel[] | null) || [];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;
  if (!session || userRole !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Shield className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-gray-400">Manage users and settings</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-400 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-teal-500">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="llm-config" className="data-[state=active]:bg-teal-500">
              <Brain className="h-4 w-4 mr-2" />
              LLM Config
            </TabsTrigger>
            <TabsTrigger value="google-sso" className="data-[state=active]:bg-teal-500">
              <Settings className="h-4 w-4 mr-2" />
              Google SSO
            </TabsTrigger>
            <TabsTrigger value="reporting" className="data-[state=active]:bg-teal-500">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reporting
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-400">
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700/50">
                          <td className="py-3 px-4 text-white">
                            {editingUser === user.id ? (
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="bg-gray-700 border-gray-600 text-white h-8"
                              />
                            ) : (
                              user.name || '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-300">{user.email}</td>
                          <td className="py-3 px-4">
                            {editingUser === user.id ? (
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1"
                              >
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-600/50 text-gray-300'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleApproval(user.id, user.isApproved)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                user.isApproved 
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              }`}
                              title={user.isApproved ? 'Click to disable account' : 'Click to approve account'}
                            >
                              {user.isApproved ? (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5" />
                                  Pending
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingUser === user.id ? (
                              <Button
                                size="sm"
                                onClick={() => handleSaveUser(user.id)}
                                className="bg-teal-500 hover:bg-teal-600"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUser(user)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <p className="text-center py-8 text-gray-400">No users found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Config Tab */}
          <TabsContent value="llm-config">
            <div className="space-y-6">
              {/* Status message */}
              {llmMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  llmMessage.includes('success') || llmMessage.includes('saved') || llmMessage.includes('refreshed')
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border border-red-500/50 text-red-400'
                }`}>
                  {llmMessage}
                </div>
              )}

              {/* Section 1: API Keys */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-teal-400" />
                    API Keys
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure your Abacus.AI and Google Gemini API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Abacus.AI Key */}
                  <div className="p-4 bg-gray-700/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-400" />
                        <h4 className="text-white font-medium">Abacus.AI API Key</h4>
                        {llmConfig.hasAbacusKey && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">Connected</Badge>
                        )}
                      </div>
                      {llmConfig.hasAbacusKey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearKey('abacus')}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    {llmConfig.hasAbacusKey && (
                      <p className="text-xs text-gray-400">Current key: {llmConfig.abacusApiKey}</p>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showAbacusKey ? 'text' : 'password'}
                          placeholder={llmConfig.hasAbacusKey ? 'Enter new key to replace...' : 'Enter Abacus.AI API key...'}
                          value={newAbacusKey}
                          onChange={(e) => setNewAbacusKey(e.target.value)}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAbacusKey(!showAbacusKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showAbacusKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Get your API key from{' '}
                      <a href="https://apps.abacus.ai/chatllm/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                        apps.abacus.ai
                      </a>{' '}
                      → Settings → API Keys
                    </p>
                  </div>

                  {/* Gemini Key */}
                  <div className="p-4 bg-gray-700/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <h4 className="text-white font-medium">Google Gemini API Key</h4>
                        {llmConfig.hasGeminiKey && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">Connected</Badge>
                        )}
                      </div>
                      {llmConfig.hasGeminiKey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearKey('gemini')}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    {llmConfig.hasGeminiKey && (
                      <p className="text-xs text-gray-400">Current key: {llmConfig.geminiApiKey}</p>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showGeminiKey ? 'text' : 'password'}
                          placeholder={llmConfig.hasGeminiKey ? 'Enter new key to replace...' : 'Enter Gemini API key...'}
                          value={newGeminiKey}
                          onChange={(e) => setNewGeminiKey(e.target.value)}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Get your API key from{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                        aistudio.google.com
                      </a>{' '}
                      → Get API Key
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveApiKeys}
                    disabled={llmSaving || (!newAbacusKey && !newGeminiKey)}
                    className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50"
                  >
                    {llmSaving ? <LoadingSpinner /> : <><Save className="h-4 w-4 mr-2" /> Save API Keys</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Section 2: Active Provider Selection */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-teal-400" />
                    Active API Provider
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Select which API to use for generating content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Abacus.AI Option */}
                    <button
                      onClick={() => handleSaveSelection({ activeProvider: 'abacus' })}
                      disabled={!llmConfig.hasAbacusKey}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        llmConfig.activeProvider === 'abacus'
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      } ${!llmConfig.hasAbacusKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-400" />
                          <span className="text-white font-medium">Abacus.AI</span>
                        </div>
                        {llmConfig.activeProvider === 'abacus' && (
                          <CheckCircle2 className="h-5 w-5 text-teal-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Access 30+ models including GPT, Claude, Gemini, DeepSeek, Llama & more via unified API
                      </p>
                      {!llmConfig.hasAbacusKey && (
                        <p className="text-xs text-amber-400 mt-2">Add API key above to enable</p>
                      )}
                    </button>

                    {/* Gemini Option */}
                    <button
                      onClick={() => handleSaveSelection({ activeProvider: 'gemini' })}
                      disabled={!llmConfig.hasGeminiKey}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        llmConfig.activeProvider === 'gemini'
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      } ${!llmConfig.hasGeminiKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-400" />
                          <span className="text-white font-medium">Google Gemini</span>
                        </div>
                        {llmConfig.activeProvider === 'gemini' && (
                          <CheckCircle2 className="h-5 w-5 text-teal-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Direct access to Google Gemini models (Pro, Flash, Flash Lite)
                      </p>
                      {!llmConfig.hasGeminiKey && (
                        <p className="text-xs text-amber-400 mt-2">Add API key above to enable</p>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Available Models */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Abacus.AI Models */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-400" />
                        Abacus.AI Models
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefreshModels('abacus')}
                        disabled={refreshingAbacus || !llmConfig.hasAbacusKey}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${refreshingAbacus ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    {llmConfig.abacusModelsRefreshedAt && (
                      <p className="text-xs text-gray-500">
                        Last refreshed: {new Date(llmConfig.abacusModelsRefreshedAt).toLocaleString()}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!llmConfig.hasAbacusKey ? (
                      <p className="text-sm text-gray-500 text-center py-4">Add Abacus.AI API key to view models</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                        {((llmConfig.abacusModels as LLMModel[] | null) || []).length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Click Refresh to load available models
                          </p>
                        ) : (
                          ((llmConfig.abacusModels as LLMModel[] | null) || []).map((model: LLMModel) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-700/50 text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-200 truncate block">{model.name || model.id}</span>
                              </div>
                              {model.category && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-600 text-gray-400 ml-2 shrink-0">
                                  {model.category}
                                </Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gemini Models */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        Gemini Models
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefreshModels('gemini')}
                        disabled={refreshingGemini || !llmConfig.hasGeminiKey}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${refreshingGemini ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    {llmConfig.geminiModelsRefreshedAt && (
                      <p className="text-xs text-gray-500">
                        Last refreshed: {new Date(llmConfig.geminiModelsRefreshedAt).toLocaleString()}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!llmConfig.hasGeminiKey ? (
                      <p className="text-sm text-gray-500 text-center py-4">Add Gemini API key to view models</p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                        {((llmConfig.geminiModels as LLMModel[] | null) || []).length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Click Refresh to load available models
                          </p>
                        ) : (
                          ((llmConfig.geminiModels as LLMModel[] | null) || []).map((model: LLMModel) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-700/50 text-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-200 truncate block">{model.name || model.id}</span>
                              </div>
                              {model.category && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-600 text-gray-400 ml-2 shrink-0">
                                  {model.category}
                                </Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Section 4: Model Assignment */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-teal-400" />
                    Model Assignment
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose which model handles idea generation vs. story writing for the active provider ({llmConfig.activeProvider === 'abacus' ? 'Abacus.AI' : 'Google Gemini'})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {getActiveModels().length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-400 mb-2">No models loaded for {llmConfig.activeProvider === 'abacus' ? 'Abacus.AI' : 'Google Gemini'}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshModels(llmConfig.activeProvider as 'abacus' | 'gemini')}
                        className="border-gray-600 text-gray-300 hover:text-white"
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Load Models
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Idea Generation Model */}
                      <div className="p-4 bg-gray-700/30 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-400" />
                          <h4 className="text-white font-medium">Idea Generation Model</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          Used for genre analysis, synopsis generation, title generation, and chapter planning
                        </p>
                        <select
                          value={llmConfig.ideaModel || ''}
                          onChange={(e) => handleSaveSelection({ ideaModel: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        >
                          <option value="">Use default (auto-routing)</option>
                          {getActiveModels().map((model: LLMModel) => (
                            <option key={model.id} value={model.id}>
                              {model.name || model.id}{model.category ? ` [${model.category}]` : ''}
                            </option>
                          ))}
                        </select>
                        {llmConfig.ideaModel && (
                          <p className="text-xs text-teal-400">
                            Currently using: {llmConfig.ideaModel}
                          </p>
                        )}
                      </div>

                      {/* Writing Model */}
                      <div className="p-4 bg-gray-700/30 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <PenTool className="h-4 w-4 text-emerald-400" />
                          <h4 className="text-white font-medium">Story Writing Model</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          Used for writing chapters, forward/intro content, character development, and marketing copy
                        </p>
                        <select
                          value={llmConfig.writingModel || ''}
                          onChange={(e) => handleSaveSelection({ writingModel: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        >
                          <option value="">Use default (auto-routing)</option>
                          {getActiveModels().map((model: LLMModel) => (
                            <option key={model.id} value={model.id}>
                              {model.name || model.id}{model.category ? ` [${model.category}]` : ''}
                            </option>
                          ))}
                        </select>
                        {llmConfig.writingModel && (
                          <p className="text-xs text-teal-400">
                            Currently using: {llmConfig.writingModel}
                          </p>
                        )}
                      </div>

                      {/* Image Generation Model */}
                      <div className="space-y-2 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-pink-400" />
                          <h4 className="text-white font-medium">Image Generation Model</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          Used for book cover art generation via Abacus.AI image API
                        </p>
                        <select
                          value={llmConfig.imageModel || ''}
                          onChange={(e) => handleSaveSelection({ imageModel: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        >
                          <option value="">Use default (gpt-5.1)</option>
                          <optgroup label="Dedicated Image Models">
                            <option value="flux-2-pro">Flux 2 Pro</option>
                            <option value="flux-kontext">Flux Kontext</option>
                            <option value="seedream">Seedream</option>
                            <option value="ideogram">Ideogram</option>
                            <option value="recraft">Recraft</option>
                            <option value="imagen">Imagen (Google)</option>
                            <option value="nano-banana-pro">Nano Banana Pro</option>
                            <option value="dall-e">DALL-E</option>
                          </optgroup>
                          <optgroup label="Gemini (Image-capable)">
                            <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
                            <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                          </optgroup>
                          <optgroup label="OpenAI (Image-capable)">
                            <option value="gpt-5.4">GPT-5.4</option>
                            <option value="gpt-5.1">GPT-5.1</option>
                          </optgroup>
                        </select>
                        {llmConfig.imageModel && (
                          <p className="text-xs text-pink-400">
                            Currently using: {llmConfig.imageModel}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Model Pricing Reference */}
                  <div className="p-4 bg-gray-700/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <h4 className="text-white font-medium">Model Pricing Reference</h4>
                    </div>
                    <p className="text-xs text-gray-400">
                      Approximate public pricing per 1M tokens. Used to estimate costs in the Reporting tab.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-600">
                            <th className="text-left py-1.5 pr-2">Model</th>
                            <th className="text-right py-1.5 pr-2">Input $/1M</th>
                            <th className="text-right py-1.5">Output $/1M</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { group: 'OpenAI / Abacus RouteLLM', models: [
                              { id: 'gpt-5', input: 1.25, output: 10 },
                              { id: 'gpt-5-mini', input: 0.25, output: 2 },
                              { id: 'gpt-5-nano', input: 0.05, output: 0.4 },
                              { id: 'gpt-4o', input: 2.5, output: 10 },
                              { id: 'gpt-4o-mini', input: 0.15, output: 0.6 },
                              { id: 'gpt-4.1', input: 2, output: 8 },
                              { id: 'gpt-4.1-mini', input: 0.4, output: 1.6 },
                              { id: 'o3', input: 2, output: 8 },
                              { id: 'o3-mini', input: 1.1, output: 4.4 },
                              { id: 'o4-mini', input: 1.1, output: 4.4 },
                            ]},
                            { group: 'Anthropic', models: [
                              { id: 'claude-opus-4', input: 15, output: 75 },
                              { id: 'claude-sonnet-4', input: 3, output: 15 },
                              { id: 'claude-3.5-sonnet', input: 3, output: 15 },
                              { id: 'claude-3.5-haiku', input: 0.8, output: 4 },
                            ]},
                            { group: 'Google', models: [
                              { id: 'gemini-2.5-pro', input: 1.25, output: 10 },
                              { id: 'gemini-2.5-flash', input: 0.3, output: 2.5 },
                              { id: 'gemini-2.5-flash-lite', input: 0.1, output: 0.4 },
                              { id: 'gemini-2.0-flash', input: 0.1, output: 0.4 },
                            ]},
                            { group: 'Auto-Routing', models: [
                              { id: 'route-llm (default)', input: 2, output: 8 },
                            ]},
                          ].map(({ group, models }) => (
                            <React.Fragment key={group}>
                              <tr>
                                <td colSpan={3} className="pt-3 pb-1 text-gray-400 font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>{group}</td>
                              </tr>
                              {models.map(m => {
                                const isActive = m.id === llmConfig.ideaModel || m.id === llmConfig.writingModel;
                                return (
                                  <tr key={m.id} className={`border-b border-gray-700/30 ${isActive ? 'text-teal-300' : 'text-gray-300'}`}>
                                    <td className="py-1 pr-2 font-mono">
                                      {m.id}
                                      {isActive && <span className="ml-1 text-teal-400 text-[9px]">●</span>}
                                    </td>
                                    <td className="text-right py-1 pr-2">${m.input.toFixed(2)}</td>
                                    <td className="text-right py-1">${m.output.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      * Prices are estimates based on public pricing. Actual costs may vary by provider plan and usage tier.
                    </p>
                  </div>

                  {/* API Communication Info */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h4 className="text-blue-400 font-medium mb-2">How API Communication Works</h4>
                    {llmConfig.activeProvider === 'abacus' ? (
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><strong>Endpoint:</strong> <code className="bg-gray-700 px-1 rounded text-xs">POST https://routellm.abacus.ai/v1/chat/completions</code></p>
                        <p><strong>Auth:</strong> <code className="bg-gray-700 px-1 rounded text-xs">Authorization: Bearer YOUR_API_KEY</code></p>
                        <p><strong>Format:</strong> OpenAI-compatible chat completions API</p>
                        <p><strong>Model param:</strong> <code className="bg-gray-700 px-1 rounded text-xs">model: &quot;{llmConfig.ideaModel || 'route-llm'}&quot;</code></p>
                        <p className="text-xs text-gray-400 mt-2">Supports streaming, JSON mode, tool calling, and multimodal inputs.</p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><strong>Endpoint:</strong> <code className="bg-gray-700 px-1 rounded text-xs">POST https://generativelanguage.googleapis.com/v1beta/models/MODEL:generateContent</code></p>
                        <p><strong>Auth:</strong> <code className="bg-gray-700 px-1 rounded text-xs">?key=YOUR_API_KEY</code></p>
                        <p><strong>Format:</strong> Google Gemini native API (contents/parts format)</p>
                        <p><strong>Model param:</strong> Specified in URL path: <code className="bg-gray-700 px-1 rounded text-xs">/models/{llmConfig.ideaModel || 'gemini-2.5-flash'}</code></p>
                        <p className="text-xs text-gray-400 mt-2">Supports streaming, JSON mode, multimodal inputs, and structured output.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Google SSO Tab */}
          <TabsContent value="google-sso">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Google SSO Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure Google OAuth credentials for single sign-on
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('success') 
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                      : 'bg-red-500/20 border border-red-500/50 text-red-400'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Enable Google SSO</h3>
                    <p className="text-sm text-gray-400">Allow users to sign in with Google</p>
                  </div>
                  <Switch
                    checked={googleConfig.enabled}
                    onCheckedChange={(checked) => setGoogleConfig({ ...googleConfig, enabled: checked })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Client ID</label>
                    <Input
                      type="text"
                      placeholder="Enter Google Client ID"
                      value={googleConfig.clientId}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, clientId: e.target.value })}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Client Secret</label>
                    <Input
                      type="password"
                      placeholder="Enter Google Client Secret"
                      value={googleConfig.clientSecret}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, clientSecret: e.target.value })}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                    <li>Go to Google Cloud Console</li>
                    <li>Create a new project or select existing one</li>
                    <li>Enable Google+ API</li>
                    <li>Create OAuth 2.0 credentials</li>
                    <li>Add authorized redirect URI: <code className="bg-gray-700 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback/google</code></li>
                    <li>Copy Client ID and Client Secret here</li>
                  </ol>
                </div>

                <Button
                  onClick={handleSaveGoogleConfig}
                  disabled={saving}
                  className="w-full bg-teal-500 hover:bg-teal-600"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporting Tab */}
          <TabsContent value="reporting">
            <ReportingTab />
          </TabsContent>
        </Tabs>

        <p className="text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} AI Author. All rights reserved.
        </p>
      </div>
    </div>
  );
}
