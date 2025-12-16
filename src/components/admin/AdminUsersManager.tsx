'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Trash2, Users, Clock, Mail, Shield } from 'lucide-react';

interface AdminUser {
  email: string;
  name?: string;
  role: string;
  createdAt?: number;
  lastLogin?: number;
}

interface AdminUsersManagerProps {
  currentUserEmail: string;
}

export function AdminUsersManager({ currentUserEmail }: AdminUsersManagerProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      setUsers([data.user, ...users]);
      setNewUser({ email: '', name: '', role: 'admin' });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(email: string) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.email !== email));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function formatDate(timestamp?: number) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8 text-amber-400" />
                Admin Users
              </h1>
              <p className="text-gray-400 mt-1">
                Manage who can access the AWE2M8 Command Center
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Add User Form */}
        {showAddForm && (
          <div className="mb-6 p-6 bg-gray-900/80 border border-gray-800 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">Add New Admin User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewUser({ email: '', name: '', role: 'admin' });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-green-500 rounded-full mx-auto mb-4"></div>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No admin users found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">User</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Role</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Last Login</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {user.name || 'Unknown'}
                            {user.email === currentUserEmail && (
                              <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">You</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(user.lastLogin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.email === currentUserEmail ? (
                        <span className="text-gray-600 text-sm">-</span>
                      ) : deleteConfirm === user.email ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm text-gray-400">Confirm?</span>
                          <button
                            onClick={() => handleDeleteUser(user.email)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.email)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Users added here can sign in with Google using their email address.</p>
        </div>
      </div>
    </div>
  );
}
