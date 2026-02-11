'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Send,
  FileText,
  X,
  Filter,
  Eye,
} from 'lucide-react';
import {
  getLeads,
  updateLeadStatus,
  updateLead,
  deleteLead,
  getLeadStats,
  exportLeadsToCSV,
} from '@/lib/jove-lab-storage';
import type { JoveLabLead, JoveLabLeadStatus, JoveLabStats } from '@/types/jove-lab';

const STATUS_CONFIG: Record<JoveLabLeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  quoted: { label: 'Quoted', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
};

const STATUS_OPTIONS: JoveLabLeadStatus[] = [
  'new',
  'contacted',
  'quoted',
  'in_progress',
  'completed',
  'cancelled',
];

export default function LeadsDashboardPage() {
  const [leads, setLeads] = useState<JoveLabLead[]>([]);
  const [stats, setStats] = useState<JoveLabStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JoveLabLeadStatus | 'all'>('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState<JoveLabLead | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLeads(getLeads());
    setStats(getLeadStats());
    setLoading(false);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.design_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (leadId: string, newStatus: JoveLabLeadStatus) => {
    updateLeadStatus(leadId, newStatus);
    loadData();
  };

  const handleSaveNotes = (leadId: string) => {
    updateLead(leadId, { internal_notes: notesValue });
    setEditingNotes(null);
    loadData();
  };

  const handleDeleteLead = (leadId: string, clientName: string) => {
    if (!confirm(`Delete lead from ${clientName}? This cannot be undone.`)) return;
    deleteLead(leadId);
    loadData();
  };

  const handleExport = () => {
    const csv = exportLeadsToCSV(filteredLeads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jove-lab-leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleResendSummary = async (lead: JoveLabLead) => {
    // In a real implementation, this would call an API endpoint
    alert(`Summary resent to ${lead.client_email}`);
  };

  const formatPrice = (price: number | null, currency: string = 'USD') => {
    if (price === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatSelections = (selections: JoveLabLead['selections']) => {
    const items = [
      selections.jewelry_type && `Type: ${selections.jewelry_type}`,
      selections.architecture && `Architecture: ${selections.architecture}`,
      selections.metal && `Metal: ${selections.metal}`,
      selections.setting_style && `Setting: ${selections.setting_style}`,
    ].filter(Boolean);
    return items;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/jove-lab"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-wide">
              Leads Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track and manage JOVÉ LAB design inquiries
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total_leads}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.leads_this_week}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">New</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.by_status.new}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Avg. Price</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {formatPrice(stats.average_price)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or design ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JoveLabLeadStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchTerm || statusFilter !== 'all' ? (
              <p>No leads match your filters</p>
            ) : (
              <>
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No leads yet</p>
                <p>Design inquiries from JOVÉ LAB will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLeads.map((lead) => {
              const isExpanded = expandedLead === lead.id;
              const selections = formatSelections(lead.selections);

              return (
                <div key={lead.id} className="hover:bg-gray-50 transition-colors">
                  {/* Main Row */}
                  <div className="flex items-center gap-4 p-4">
                    <button
                      onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{lead.client_name}</h3>
                        <span className="text-xs text-gray-400 font-mono">{lead.design_id}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(lead.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {lead.client_email}
                        </span>
                        {lead.client_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.client_phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lead.shown_price !== null && (
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          {formatPrice(lead.shown_price, lead.currency).replace('$', '')}
                        </span>
                      )}
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as JoveLabLeadStatus)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-amber-500 ${STATUS_CONFIG[lead.status].color}`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_CONFIG[status].label}
                        </option>
                      ))}
                    </select>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowDetailsModal(lead)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResendSummary(lead)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Resend summary"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id, lead.client_name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 ml-9 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Selections */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Design Selections</h4>
                          <div className="space-y-1">
                            {selections.length > 0 ? (
                              selections.map((item, i) => (
                                <p key={i} className="text-sm text-gray-600">{item}</p>
                              ))
                            ) : (
                              <p className="text-sm text-gray-400">No selections recorded</p>
                            )}
                            {lead.selections.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {lead.selections.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Internal Notes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">Internal Notes</h4>
                            {editingNotes !== lead.id && (
                              <button
                                onClick={() => {
                                  setEditingNotes(lead.id);
                                  setNotesValue(lead.internal_notes || '');
                                }}
                                className="text-xs text-amber-600 hover:text-amber-700"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          {editingNotes === lead.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="Add internal notes..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNotes(lead.id)}
                                  className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNotes(null)}
                                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">
                              {lead.internal_notes || <span className="text-gray-400">No notes</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex gap-6 text-xs text-gray-400 pt-2 border-t border-gray-100">
                        <span>Created: {new Date(lead.created_at).toLocaleString()}</span>
                        {lead.contacted_at && (
                          <span>Contacted: {new Date(lead.contacted_at).toLocaleString()}</span>
                        )}
                        {lead.completed_at && (
                          <span>Completed: {new Date(lead.completed_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Lead Details</h2>
                <p className="text-sm text-gray-500 font-mono">{showDetailsModal.design_id}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Client Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900 font-medium">{showDetailsModal.client_name}</p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${showDetailsModal.client_email}`} className="hover:text-amber-600">
                      {showDetailsModal.client_email}
                    </a>
                  </p>
                  {showDetailsModal.client_phone && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${showDetailsModal.client_phone}`} className="hover:text-amber-600">
                        {showDetailsModal.client_phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Design Selections */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Design Selections</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Jewelry Type</dt>
                      <dd className="text-gray-900 capitalize">{showDetailsModal.selections.jewelry_type || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Architecture</dt>
                      <dd className="text-gray-900 capitalize">{showDetailsModal.selections.architecture?.replace('-', ' ') || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Stone Personality</dt>
                      <dd className="text-gray-900 capitalize">{showDetailsModal.selections.stone_personality?.replace('-', ' ') || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Proportions</dt>
                      <dd className="text-gray-900 capitalize">{showDetailsModal.selections.proportions || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Setting Style</dt>
                      <dd className="text-gray-900 capitalize">{showDetailsModal.selections.setting_style?.replace('-', ' ') || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Metal</dt>
                      <dd className="text-gray-900 capitalize">{showDetailsModal.selections.metal?.replace('-', ' ') || '—'}</dd>
                    </div>
                  </dl>
                  {showDetailsModal.selections.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <dt className="text-xs text-gray-500 uppercase mb-1">Customer Notes</dt>
                      <dd className="text-gray-700">{showDetailsModal.selections.notes}</dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Pricing</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shown Price</span>
                    <span className="text-xl font-semibold text-gray-900">
                      {formatPrice(showDetailsModal.shown_price, showDetailsModal.currency)}
                    </span>
                  </div>
                  {showDetailsModal.pricing_mode && (
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      Mode: {showDetailsModal.pricing_mode.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Status & Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Status & Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Status</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_CONFIG[showDetailsModal.status].color}`}>
                      {STATUS_CONFIG[showDetailsModal.status].label}
                    </span>
                  </div>
                  {showDetailsModal.internal_notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase mb-1">Internal Notes</p>
                      <p className="text-gray-700">{showDetailsModal.internal_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => handleResendSummary(showDetailsModal)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
              >
                <Send className="h-4 w-4 mr-2" />
                Resend Summary
              </button>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
