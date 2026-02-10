'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AboutContent {
  subtitle: string;
  heading: string;
  mobile_paragraph_1: string;
  mobile_paragraph_2: string;
  desktop_paragraph_1: string;
  desktop_paragraph_2: string;
  desktop_paragraph_3: string;
  founder_name: string;
  founder_title: string;
  quote: string;
  legacy_years: string;
  legacy_label: string;
}

const defaultContent: AboutContent = {
  subtitle: 'Our Story',
  heading: 'About the Founder',
  mobile_paragraph_1: 'My name is Joey Germani, and jewellery has been in my life from a young age.',
  mobile_paragraph_2: 'Growing up in a family of jewellers with 35+ years of expertise, I became a certified Diamond Grader in New York. That vision became Maison Jové — where true luxury meets accessibility.',
  desktop_paragraph_1: 'My name is Joey Germani, and jewellery has been in my life from a young age.',
  desktop_paragraph_2: 'Growing up in a family of jewellers, I learned the art of craftsmanship at my father\'s factory, where he shared over 35 years of expertise in retail and manufacturing. By 18, I was working full-time in the family business, gaining hands-on knowledge of both jewellery and fashion.',
  desktop_paragraph_3: 'At 21, I moved to New York and became a certified Diamond Grader, determined to bring my vision to life. That vision became Maison Jové — a brand where true luxury meets accessibility, offering designs I\'ve been perfecting for years.',
  founder_name: 'Joey Germani',
  founder_title: 'Founder & Diamond Expert',
  quote: 'True luxury meets accessibility — designs perfected over generations.',
  legacy_years: '35+',
  legacy_label: 'Years Family Legacy',
};

export default function AboutCustomizationPage() {
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('website_content')
        .select('content')
        .eq('section', 'about')
        .single();

      if (!error && data?.content) {
        setContent({ ...defaultContent, ...(data.content as AboutContent) });
      }
    } catch {
      // Table might not exist yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Try upsert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('website_content')
        .upsert(
          {
            section: 'about',
            content: content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'section' }
        );

      if (error) throw error;
      setMessage({ type: 'success', text: 'About page content saved successfully.' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save. Make sure the website_content table exists.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof AboutContent, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    setContent(defaultContent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/website-customization"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
              About Us Page
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Edit the text content displayed on the About page.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Header */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-medium text-gray-900">Section Header</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
              <input
                type="text"
                value={content.subtitle}
                onChange={e => updateField('subtitle', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heading</label>
              <input
                type="text"
                value={content.heading}
                onChange={e => updateField('heading', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mobile Text */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-medium text-gray-900">Mobile Text</h2>
          <p className="text-xs text-gray-500">Shown on small screens. Keep it concise.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paragraph 1</label>
            <textarea
              value={content.mobile_paragraph_1}
              onChange={e => updateField('mobile_paragraph_1', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paragraph 2</label>
            <textarea
              value={content.mobile_paragraph_2}
              onChange={e => updateField('mobile_paragraph_2', e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>

        {/* Desktop Text */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-medium text-gray-900">Desktop Text</h2>
          <p className="text-xs text-gray-500">Shown on larger screens. Full story version.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paragraph 1 (Intro)</label>
            <textarea
              value={content.desktop_paragraph_1}
              onChange={e => updateField('desktop_paragraph_1', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paragraph 2</label>
            <textarea
              value={content.desktop_paragraph_2}
              onChange={e => updateField('desktop_paragraph_2', e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paragraph 3</label>
            <textarea
              value={content.desktop_paragraph_3}
              onChange={e => updateField('desktop_paragraph_3', e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>

        {/* Founder Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-medium text-gray-900">Founder Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                value={content.founder_name}
                onChange={e => updateField('founder_name', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={content.founder_title}
                onChange={e => updateField('founder_title', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quote & Legacy */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-medium text-gray-900">Quote & Legacy Badge</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quote (on image)</label>
            <textarea
              value={content.quote}
              onChange={e => updateField('quote', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Legacy Years</label>
              <input
                type="text"
                value={content.legacy_years}
                onChange={e => updateField('legacy_years', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Legacy Label</label>
              <input
                type="text"
                value={content.legacy_label}
                onChange={e => updateField('legacy_label', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-amber-900 mb-2">Database Setup</h3>
        <p className="text-xs text-amber-800 mb-3">
          If saving fails, create the <code className="bg-amber-100 px-1.5 py-0.5 rounded">website_content</code> table in Supabase:
        </p>
        <pre className="text-xs bg-amber-100 p-3 rounded overflow-x-auto text-amber-900">{`CREATE TABLE website_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Public read" ON website_content FOR SELECT USING (true);

-- Allow authenticated users to upsert
CREATE POLICY "Auth write" ON website_content FOR ALL USING (auth.role() = 'authenticated');`}</pre>
      </div>
    </div>
  );
}
