'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import GiveawaySpinner from '../../components/GiveawaySpinner';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  source: string;
}

export default function GiveawayPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchEventLeads = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, source')
        .ilike('source', '%launch-event-form%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load leads on component mount
  useEffect(() => {
    fetchEventLeads();
  }, [fetchEventLeads]);



  const handleWinner = (winnerName: string) => {
    setWinner(winnerName);
  };



  if (loading) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 font-light">Loading participants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-light text-zinc-900 mb-2">Error</h2>
          <p className="text-zinc-600 font-light mb-4">{error}</p>
          <Button onClick={fetchEventLeads} className="bg-zinc-900 hover:bg-zinc-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen jove-bg-primary">
      {/* Minimal Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-zinc-600 hover:text-zinc-900 font-light tracking-wide"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        {/* Simple Title */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-light text-zinc-900 tracking-wider mb-4">
            JOVÉ GIVEAWAY
          </h1>
          <div className="w-32 h-px jove-gradient-accent mx-auto"></div>
        </div>

        {/* Giveaway Spinner */}
        <GiveawaySpinner
          names={leads.map(lead => `${lead.first_name} ${lead.last_name}`)}
          onWinner={handleWinner}
          spinDuration={25000}
          extraTurns={80}
          tailSteps={0}
        />
      </div>
    </div>
  );
}
