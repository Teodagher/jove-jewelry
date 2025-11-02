'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Gift, Users, Link as LinkIcon, Copy, Check, Trash2, Award } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  source: string;
}

interface Giveaway {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  winner_id: string | null;
  winner_selected_at: string | null;
  created_at: string;
  participant_count?: number;
}

export default function GiveawaysManagementPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [viewingGiveaway, setViewingGiveaway] = useState<Giveaway | null>(null);
  const [giveawayParticipants, setGiveawayParticipants] = useState<Lead[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [addParticipantMode, setAddParticipantMode] = useState<'sources' | 'individuals'>('sources');
  const [selectedAddSources, setSelectedAddSources] = useState<string[]>([]);
  const [selectedAddLeadIds, setSelectedAddLeadIds] = useState<string[]>([]);
  const [addingParticipants, setAddingParticipants] = useState(false);

  // Form state
  const [giveawayName, setGiveawayName] = useState('');
  const [giveawayDescription, setGiveawayDescription] = useState('');
  const [selectionMode, setSelectionMode] = useState<'sources' | 'individuals'>('sources');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchGiveaways = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching giveaways:', error);
        return;
      }

      // Fetch participant counts for each giveaway
      const giveawaysWithCounts = await Promise.all(
        (data || []).map(async (giveaway: Giveaway) => {
          const { count } = await supabase
            .from('giveaway_participants')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveaway.id);

          return {
            ...giveaway,
            participant_count: count || 0
          };
        })
      );

      setGiveaways(giveawaysWithCounts);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, source')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGiveaways();
    fetchLeads();
  }, [fetchGiveaways, fetchLeads]);

  const uniqueSources = Array.from(new Set(leads.map(lead => lead.source)));

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreateGiveaway = async () => {
    if (!giveawayName.trim()) {
      alert('Please enter a giveaway name');
      return;
    }

    setCreating(true);

    try {
      const slug = generateSlug(giveawayName);

      // Create the giveaway
      const { data: giveaway, error: giveawayError } = await supabase
        .from('giveaways')
        .insert([{
          name: giveawayName,
          slug,
          description: giveawayDescription || null,
          status: 'active'
        }] as any)
        .select()
        .single();

      if (giveawayError || !giveaway) {
        console.error('Error creating giveaway:', giveawayError);
        alert('Failed to create giveaway. The name might already be in use.');
        return;
      }

      const createdGiveaway = giveaway as Giveaway;

      // Determine which leads to add as participants
      let participantLeadIds: string[] = [];

      if (selectionMode === 'sources') {
        // Get all leads from selected sources
        participantLeadIds = leads
          .filter(lead => selectedSources.includes(lead.source))
          .map(lead => lead.id);
      } else {
        participantLeadIds = selectedLeadIds;
      }

      // Add participants
      if (participantLeadIds.length > 0) {
        const participants = participantLeadIds.map((leadId: string) => ({
          giveaway_id: createdGiveaway.id,
          lead_id: leadId
        }));

        const { error: participantsError } = await supabase
          .from('giveaway_participants')
          .insert(participants as any);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          alert('Giveaway created but failed to add some participants');
        }
      }

      // Reset form and close modal
      setGiveawayName('');
      setGiveawayDescription('');
      setSelectedSources([]);
      setSelectedLeadIds([]);
      setShowCreateModal(false);

      // Refresh giveaways list
      fetchGiveaways();
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGiveaway = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the giveaway "${name}"? This will also remove all participants.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('giveaways')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting giveaway:', error);
        alert('Failed to delete giveaway');
        return;
      }

      fetchGiveaways();
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const copyGiveawayLink = (slug: string) => {
    const url = `${window.location.origin}/giveaway/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const viewGiveawayDetails = async (giveaway: Giveaway) => {
    setViewingGiveaway(giveaway);
    setLoadingParticipants(true);

    try {
      const { data: participantsData, error } = await supabase
        .from('giveaway_participants')
        .select('lead_id, leads(id, first_name, last_name, email, source)')
        .eq('giveaway_id', giveaway.id);

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      const participants = (participantsData as any[])
        .map((p: any) => p.leads)
        .filter((lead: any) => lead !== null) as Lead[];

      setGiveawayParticipants(participants);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const getSourceDisplayName = (source: string) => {
    if (source.includes('launch-event-form')) {
      return 'Launch Event Form';
    }
    return source;
  };

  const handleAddParticipants = async () => {
    if (!viewingGiveaway) return;

    setAddingParticipants(true);

    try {
      // Determine which leads to add as participants
      let newParticipantLeadIds: string[] = [];

      if (addParticipantMode === 'sources') {
        // Get all leads from selected sources
        newParticipantLeadIds = leads
          .filter(lead => selectedAddSources.includes(lead.source))
          .map(lead => lead.id);
      } else {
        newParticipantLeadIds = selectedAddLeadIds;
      }

      // Filter out leads that are already participants
      const currentParticipantIds = giveawayParticipants.map(p => p.id);
      const leadsToAdd = newParticipantLeadIds.filter(id => !currentParticipantIds.includes(id));

      if (leadsToAdd.length === 0) {
        alert('All selected leads are already participants in this giveaway');
        return;
      }

      // Add new participants
      const participants = leadsToAdd.map((leadId: string) => ({
        giveaway_id: viewingGiveaway.id,
        lead_id: leadId
      }));

      const { error } = await supabase
        .from('giveaway_participants')
        .insert(participants as any);

      if (error) {
        console.error('Error adding participants:', error);
        alert('Failed to add participants');
        return;
      }

      // Reset form and close modal
      setSelectedAddSources([]);
      setSelectedAddLeadIds([]);
      setShowAddParticipants(false);

      // Refresh participant list
      await viewGiveawayDetails(viewingGiveaway);

      // Refresh giveaways list to update counts
      fetchGiveaways();
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred');
    } finally {
      setAddingParticipants(false);
    }
  };

  const handleRemoveParticipant = async (leadId: string, leadName: string) => {
    if (!viewingGiveaway) return;

    if (!confirm(`Are you sure you want to remove ${leadName} from this giveaway?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('giveaway_participants')
        .delete()
        .eq('giveaway_id', viewingGiveaway.id)
        .eq('lead_id', leadId);

      if (error) {
        console.error('Error removing participant:', error);
        alert('Failed to remove participant');
        return;
      }

      // Refresh participant list
      await viewGiveawayDetails(viewingGiveaway);

      // Refresh giveaways list to update counts
      fetchGiveaways();
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
              Giveaway Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage giveaways with custom participant lists
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Giveaway
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gift className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Giveaways</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{giveaways.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {giveaways.filter(g => g.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{leads.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Giveaways List */}
      <div className="jove-bg-card shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Giveaways</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="jove-bg-primary divide-y divide-amber-200">
              {giveaways.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No giveaways created yet. Click "Create Giveaway" to get started.
                  </td>
                </tr>
              ) : (
                giveaways.map((giveaway) => (
                  <tr key={giveaway.id} className="jove-bg-accent-hover">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{giveaway.name}</div>
                      {giveaway.description && (
                        <div className="text-sm text-gray-500">{giveaway.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {giveaway.participant_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        giveaway.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : giveaway.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {giveaway.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(giveaway.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewGiveawayDetails(giveaway)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Participants"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/giveaway/${giveaway.slug}`}
                          target="_blank"
                          className="text-amber-600 hover:text-amber-900"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => copyGiveawayLink(giveaway.slug)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Copy link"
                        >
                          {copiedSlug === giveaway.slug ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteGiveaway(giveaway.id, giveaway.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Giveaway Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Giveaway</h3>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giveaway Name
                </label>
                <input
                  type="text"
                  value={giveawayName}
                  onChange={(e) => setGiveawayName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Summer Launch Giveaway"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={giveawayDescription}
                  onChange={(e) => setGiveawayDescription(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Brief description of the giveaway"
                />
              </div>

              {/* Selection Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Participants By
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectionMode('sources')}
                    className={`flex-1 py-2 px-4 rounded-md border ${
                      selectionMode === 'sources'
                        ? 'bg-amber-100 border-amber-600 text-amber-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Source/Channel
                  </button>
                  <button
                    onClick={() => setSelectionMode('individuals')}
                    className={`flex-1 py-2 px-4 rounded-md border ${
                      selectionMode === 'individuals'
                        ? 'bg-amber-100 border-amber-600 text-amber-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Individual People
                  </button>
                </div>
              </div>

              {/* Sources Selection */}
              {selectionMode === 'sources' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Sources ({selectedSources.length} selected, {leads.filter(l => selectedSources.includes(l.source)).length} participants)
                  </label>
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto p-2">
                    {uniqueSources.map(source => (
                      <label key={source} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSources([...selectedSources, source]);
                            } else {
                              setSelectedSources(selectedSources.filter(s => s !== source));
                            }
                          }}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {getSourceDisplayName(source)} ({leads.filter(l => l.source === source).length})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Individuals Selection */}
              {selectionMode === 'individuals' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Individuals ({selectedLeadIds.length} selected)
                  </label>
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto p-2">
                    {leads.map(lead => (
                      <label key={lead.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadIds([...selectedLeadIds, lead.id]);
                            } else {
                              setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                            }
                          }}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {lead.first_name} {lead.last_name} ({lead.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGiveaway}
                  disabled={creating || !giveawayName.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Giveaway'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Participants Modal */}
      {showAddParticipants && viewingGiveaway && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Participants to {viewingGiveaway.name}</h3>

              {/* Selection Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Participants By
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAddParticipantMode('sources')}
                    className={`flex-1 py-2 px-4 rounded-md border ${
                      addParticipantMode === 'sources'
                        ? 'bg-amber-100 border-amber-600 text-amber-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Source/Channel
                  </button>
                  <button
                    onClick={() => setAddParticipantMode('individuals')}
                    className={`flex-1 py-2 px-4 rounded-md border ${
                      addParticipantMode === 'individuals'
                        ? 'bg-amber-100 border-amber-600 text-amber-900'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    Individual People
                  </button>
                </div>
              </div>

              {/* Sources Selection */}
              {addParticipantMode === 'sources' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Sources ({selectedAddSources.length} selected, {leads.filter(l => selectedAddSources.includes(l.source)).length} participants)
                  </label>
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto p-2">
                    {uniqueSources.map(source => (
                      <label key={source} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAddSources.includes(source)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddSources([...selectedAddSources, source]);
                            } else {
                              setSelectedAddSources(selectedAddSources.filter(s => s !== source));
                            }
                          }}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {getSourceDisplayName(source)} ({leads.filter(l => l.source === source).length})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Individuals Selection */}
              {addParticipantMode === 'individuals' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Individuals ({selectedAddLeadIds.length} selected)
                  </label>
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto p-2">
                    {leads.map(lead => (
                      <label key={lead.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAddLeadIds.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddLeadIds([...selectedAddLeadIds, lead.id]);
                            } else {
                              setSelectedAddLeadIds(selectedAddLeadIds.filter(id => id !== lead.id));
                            }
                          }}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {lead.first_name} {lead.last_name} ({lead.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddParticipants(false);
                    setSelectedAddSources([]);
                    setSelectedAddLeadIds([]);
                  }}
                  disabled={addingParticipants}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParticipants}
                  disabled={addingParticipants || (addParticipantMode === 'sources' && selectedAddSources.length === 0) || (addParticipantMode === 'individuals' && selectedAddLeadIds.length === 0)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingParticipants ? 'Adding...' : 'Add Participants'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Participants Modal */}
      {viewingGiveaway && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{viewingGiveaway.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {giveawayParticipants.length} Participant{giveawayParticipants.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingGiveaway(null);
                    setGiveawayParticipants([]);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingParticipants ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {giveawayParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            No participants in this giveaway
                          </td>
                        </tr>
                      ) : (
                        giveawayParticipants.map((participant) => (
                          <tr key={participant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {participant.first_name} {participant.last_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{participant.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                {getSourceDisplayName(participant.source)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleRemoveParticipant(participant.id, `${participant.first_name} ${participant.last_name}`)}
                                className="text-red-600 hover:text-red-900"
                                title="Remove participant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setShowAddParticipants(true)}
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Participants
                </button>
                <button
                  onClick={() => {
                    setViewingGiveaway(null);
                    setGiveawayParticipants([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
