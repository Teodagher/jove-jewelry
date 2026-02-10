'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/lib/adminUtils';
import { ROLES, Role, getHighestRole, hasAdminAccess } from '@/lib/roles';
import {
  Search,
  Filter,
  Users,
  Crown,
  Palette,
  MoreVertical,
  Check
} from 'lucide-react';

interface UserWithStats extends User {
  orderCount: number;
  totalSpent: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const { data: usersData, error: usersError } = await (supabase as any)
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch order counts grouped by customer_email
      const { data: orderStats, error: ordersError } = await supabase
        .from('orders')
        .select('customer_email, total');

      if (ordersError) throw ordersError;

      // Build email -> stats map
      const emailStats: Record<string, { count: number; spent: number }> = {};
      (orderStats || []).forEach((order: any) => {
        const email = order.customer_email?.toLowerCase();
        if (!email) return;
        if (!emailStats[email]) emailStats[email] = { count: 0, spent: 0 };
        emailStats[email].count++;
        emailStats[email].spent += order.total || 0;
      });

      const enriched: UserWithStats[] = (usersData || []).map((u: User) => {
        const stats = emailStats[u.email?.toLowerCase()] || { count: 0, spent: 0 };
        return { ...u, orderCount: stats.count, totalSpent: stats.spent };
      });

      setUsers(enriched);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, role: Role, action: 'add_role' | 'remove_role') => {
    const roleInfo = ROLES[role];
    
    if (action === 'remove_role') {
      const confirmed = window.confirm(`Are you sure you want to remove ${roleInfo.displayName} access from this user?`);
      if (!confirmed) return;
    }

    try {
      setUpdatingRole(userId);
      const res = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, roles: data.roles } : u
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && user.roles?.includes('admin')) ||
      (roleFilter === 'admin_designer' && user.roles?.includes('admin_designer')) ||
      (roleFilter === 'customer' && !hasAdminAccess(user.roles || []));

    return matchesSearch && matchesRole;
  });

  // Stats
  const adminCount = users.filter(u => u.roles?.includes('admin')).length;
  const designerCount = users.filter(u => u.roles?.includes('admin_designer') && !u.roles?.includes('admin')).length;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Render role badge(s) for a user
  const renderRoleBadges = (userRoles: string[] | null) => {
    const roles = userRoles || [];
    const isAdmin = roles.includes('admin');
    const isDesigner = roles.includes('admin_designer');
    
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
          <Crown className="h-3 w-3" />
          Admin
        </span>
      );
    }
    
    if (isDesigner) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          <Palette className="h-3 w-3" />
          Designer
        </span>
      );
    }
    
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
        Customer
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">User Accounts</h1>
          <p className="mt-2 text-sm text-gray-600">Loading users...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">User Accounts</h1>
        <p className="mt-2 text-sm text-gray-600">Manage registered user accounts and roles</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <Crown className="h-4 w-4" />
            {adminCount} Admin{adminCount !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 text-purple-700">
            <Palette className="h-4 w-4" />
            {designerCount} Designer{designerCount !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-500">
            {users.length} total users
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="jove-bg-card rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="admin_designer">Designer</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No users found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userRoles = user.roles || [];
                  const isAdmin = userRoles.includes('admin');
                  const isDesigner = userRoles.includes('admin_designer');
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${user.id}`} className="block">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-medium text-zinc-600 flex-shrink-0">
                              {(user.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.full_name || 'No name'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {user.phone || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {renderRoleBadges(user.roles)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen(menuOpen === user.id ? null : user.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                            >
                              {updatingRole === user.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-600"></div>
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </button>

                            {menuOpen === user.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-zinc-200 z-20 py-1">
                                  <Link
                                    href={`/admin/users/${user.id}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setMenuOpen(null)}
                                  >
                                    View Profile
                                  </Link>
                                  <div className="border-t border-gray-100 my-1" />
                                  <p className="px-4 py-1 text-xs text-gray-400 uppercase tracking-wider">Assign Roles</p>
                                  
                                  {/* Admin Role */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setMenuOpen(null);
                                      handleRoleChange(user.id, 'admin', isAdmin ? 'remove_role' : 'add_role');
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Crown className="h-4 w-4 text-amber-600" />
                                      Admin
                                    </span>
                                    {isAdmin && <Check className="h-4 w-4 text-green-600" />}
                                  </button>
                                  
                                  {/* Designer Role */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setMenuOpen(null);
                                      handleRoleChange(user.id, 'admin_designer', isDesigner ? 'remove_role' : 'add_role');
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Palette className="h-4 w-4 text-purple-600" />
                                      Designer
                                    </span>
                                    {isDesigner && <Check className="h-4 w-4 text-green-600" />}
                                  </button>
                                  
                                  <div className="border-t border-gray-100 my-1" />
                                  <p className="px-4 py-2 text-xs text-gray-400">
                                    Click to toggle role on/off
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
