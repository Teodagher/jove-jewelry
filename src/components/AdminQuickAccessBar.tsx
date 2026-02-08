'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
  roles: string[];
}

export default function AdminQuickAccessBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('roles')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          setIsAdmin(false);
        } else {
          const userData = data as unknown as UserData;
          setIsAdmin(userData?.roles?.includes('admin') || false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Don't render anything if not admin or still loading
  if (isLoading || !isAdmin || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 bg-maison-black/95 backdrop-blur-sm px-5 py-3 shadow-2xl border border-maison-graphite/30">
          {/* Admin indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-maison-gold rounded-full animate-pulse" />
            <span className="text-maison-ivory/60 text-xs font-light tracking-wider uppercase">
              Admin
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-maison-graphite/50" />

          {/* Admin link */}
          <Link
            href="/admin"
            className="flex items-center gap-2 text-maison-ivory text-sm font-light tracking-wide hover:text-maison-gold transition-colors duration-300"
          >
            <Settings size={16} strokeWidth={1.5} />
            <span>Dashboard</span>
          </Link>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 p-1 text-maison-ivory/40 hover:text-maison-ivory transition-colors duration-200"
            aria-label="Hide admin bar"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
