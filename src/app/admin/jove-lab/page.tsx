'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Palette,
  DollarSign,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  getTemplates,
  getOptionCategories,
  getOptions,
  getLeads,
  getLeadStats,
} from '@/lib/jove-lab-storage';
import type { JoveLabStats } from '@/types/jove-lab';

export default function JoveLabAdminPage() {
  const [stats, setStats] = useState<JoveLabStats | null>(null);
  const [templateCount, setTemplateCount] = useState(0);
  const [optionCount, setOptionCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<Array<{ id: string; client_name: string; created_at: string; status: string }>>([]);

  useEffect(() => {
    // Load stats
    const leadStats = getLeadStats();
    setStats(leadStats);
    
    // Load counts
    const templates = getTemplates();
    setTemplateCount(templates.filter(t => t.is_active).length);
    
    const categories = getOptionCategories();
    setCategoryCount(categories.filter(c => c.is_active).length);
    
    const options = getOptions();
    setOptionCount(options.filter(o => o.is_active).length);
    
    // Get recent leads
    const leads = getLeads().slice(0, 5);
    setRecentLeads(leads);
  }, []);

  const sections = [
    {
      title: 'Templates',
      description: 'Manage design architectures and templates',
      href: '/admin/jove-lab/templates',
      icon: Layers,
      stat: `${templateCount} active`,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Option Library',
      description: 'Shapes, sizes, metals, and more',
      href: '/admin/jove-lab/options',
      icon: Palette,
      stat: `${categoryCount} categories, ${optionCount} options`,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Pricing',
      description: 'Configure base prices and add-ons',
      href: '/admin/jove-lab/pricing',
      icon: DollarSign,
      stat: 'Separate from store',
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Leads Dashboard',
      description: 'View and manage design inquiries',
      href: '/admin/jove-lab/leads',
      icon: Users,
      stat: `${stats?.total_leads || 0} total leads`,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-yellow-100 text-yellow-700',
      quoted: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg">
            <Sparkles className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
              JOVÉ LAB
            </h1>
            <p className="text-sm text-gray-500 tracking-wide">
              Bespoke Design Experience Admin
            </p>
          </div>
        </div>
        <p className="mt-3 text-gray-600 max-w-2xl">
          Manage the JOVÉ LAB custom jewelry design experience. This admin section is 
          completely isolated from the main store and uses its own data storage.
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_leads}</p>
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.leads_this_week}</p>
                <p className="text-sm text-gray-500">This Week</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.by_status.new}</p>
                <p className="text-sm text-gray-500">New Leads</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.average_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500">Avg. Price</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${section.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {section.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {section.description}
              </p>
              <p className="mt-3 text-sm font-medium text-gray-700">
                {section.stat}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent Leads */}
      {recentLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
            <Link
              href="/admin/jove-lab/leads"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{lead.client_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(lead.status)}`}>
                  {lead.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
