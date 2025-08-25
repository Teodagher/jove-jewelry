'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '@/contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-white',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
  },
  luxury: {
    icon: CheckCircle,
    bgColor: 'bg-white',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-white',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-white',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
  },
  info: {
    icon: Info,
    bgColor: 'bg-white',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
  },
};

export function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={[
        'pointer-events-auto w-full overflow-hidden rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform',
        config.bgColor,
        config.borderColor,
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
      ].join(' ')}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-5 ${config.titleColor}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-sm leading-5 ${config.messageColor}`}>
                {toast.message}
              </p>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              className={`rounded-md p-1 ${config.iconColor} hover:opacity-75 transition-opacity`}
              onClick={handleRemove}
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Toast;
