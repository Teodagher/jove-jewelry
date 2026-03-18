'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { VariantConfig } from '@/lib/ai-studio/types';
import { getVariantSummary } from '@/lib/ai-studio/prompts';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface QueueItem {
  id: string;
  variantConfig: VariantConfig;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generatedImageBase64?: string;
  error?: string;
}

interface GenerationQueueProps {
  batchId: string | null;
  onComplete?: (results: QueueItem[]) => void;
  onItemComplete?: (item: QueueItem) => void;
}

export default function GenerationQueue({ batchId, onComplete, onItemComplete }: GenerationQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [failed, setFailed] = useState(0);

  const pollBatchStatus = useCallback(async () => {
    if (!batchId) return;
    
    try {
      const response = await fetch(`/api/ai-studio/batch?batchId=${batchId}`);
      const data = await response.json();
      
      if (data.success) {
        setTotal(data.total);
        setCompleted(data.completed);
        setFailed(data.failed);
        setProgress(data.progress);
        setIsComplete(data.isComplete);
        
        // Map results to queue items
        const items: QueueItem[] = data.results.map((r: {
          variantConfig: VariantConfig;
          status: 'pending' | 'completed' | 'failed';
          generatedImageBase64?: string;
          error?: string;
        }, i: number) => ({
          id: `${batchId}-${i}`,
          variantConfig: r.variantConfig,
          status: r.status === 'pending' ? 'pending' : r.status,
          generatedImageBase64: r.generatedImageBase64,
          error: r.error,
        }));
        
        setQueue(items);
        
        // Notify about completed items
        items.forEach((item, i) => {
          if (item.status === 'completed' && onItemComplete) {
            const prevItem = queue[i];
            if (!prevItem || prevItem.status !== 'completed') {
              onItemComplete(item);
            }
          }
        });
        
        if (data.isComplete && onComplete) {
          onComplete(items);
        }
      }
    } catch (error) {
      console.error('Error polling batch status:', error);
    }
  }, [batchId, onComplete, onItemComplete, queue]);

  useEffect(() => {
    if (!batchId) return;
    
    // Initial poll
    pollBatchStatus();
    
    // Poll every 2 seconds until complete
    const interval = setInterval(() => {
      if (!isComplete) {
        pollBatchStatus();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [batchId, isComplete, pollBatchStatus]);

  if (!batchId || queue.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header with progress */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Generation Queue
          </h3>
          <span className="text-xs text-zinc-500">
            {completed + failed} / {total} {isComplete ? 'Complete' : 'Processing...'}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mt-3 text-xs">
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completed} completed
          </span>
          {failed > 0 && (
            <span className="text-red-600 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {failed} failed
            </span>
          )}
          {!isComplete && (
            <span className="text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {total - completed - failed} pending
            </span>
          )}
        </div>
      </div>

      {/* Queue items */}
      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100">
        {queue.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors"
          >
            {/* Status icon */}
            <div className="flex-shrink-0">
              {item.status === 'pending' && (
                <Clock className="w-5 h-5 text-zinc-400" />
              )}
              {item.status === 'generating' && (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              )}
              {item.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {item.status === 'failed' && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            {/* Variant info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {getVariantSummary(item.variantConfig)}
              </p>
              {item.error && (
                <p className="text-xs text-red-600 truncate">{item.error}</p>
              )}
            </div>
            
            {/* Preview thumbnail */}
            {item.generatedImageBase64 && (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-zinc-100">
                <img
                  src={`data:image/png;base64,${item.generatedImageBase64}`}
                  alt="Generated"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
