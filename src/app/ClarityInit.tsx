'use client';
import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

export default function ClarityInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any)._clarityInitialized) {
      const projectId = process.env.NEXT_PUBLIC_CLARITY_ID;
      
      if (projectId) {
        Clarity.init(projectId);
        (window as any)._clarityInitialized = true; // prevent double-init in dev
      } else {
        console.warn('Clarity project ID not found. Please set NEXT_PUBLIC_CLARITY_ID environment variable.');
      }
    }
  }, []);

  return null;
}
