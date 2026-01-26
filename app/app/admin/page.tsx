'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BookOpen, Users, Settings, Trash2, Edit, Save, ArrowLeft, LogOut, Shield, CheckCircle, XCircle } from 'lucide-react';

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
            <TabsTrigger value="google-sso" className="data-[state=active]:bg-teal-500">
              <Settings className="h-4 w-4 mr-2" />
              Google SSO
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
        </Tabs>

        <p className="text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} AI Author. All rights reserved.
        </p>
      </div>
    </div>
  );
}
