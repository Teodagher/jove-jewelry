'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, DollarSign, Package, Sparkles } from 'lucide-react';

const jewelryTypes = [
  {
    name: 'Necklaces',
    href: '/admin/pricing/necklaces',
    icon: Crown,
    description: 'Manage pricing for custom necklaces',
    color: 'bg-blue-500',
    items: ''
  },
  {
    name: 'Rings',
    href: '/admin/pricing/rings',
    icon: Sparkles,
    description: 'Manage pricing for rings and wedding bands',
    color: 'bg-purple-500',
    items: ''
  },
  {
    name: 'Bracelets',
    href: '/admin/pricing/bracelets',
    icon: Package,
    description: 'Manage pricing for custom bracelets',
    color: 'bg-green-500',
    items: ''
  },
  {
    name: 'Earrings',
    href: '/admin/pricing/earrings',
    icon: DollarSign,
    description: 'Manage pricing for custom earrings',
    color: 'bg-orange-500',
    items: ''
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Pricing Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage base prices and customization options for all jewelry categories
        </p>
      </div>

      {/* Jewelry Type Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {jewelryTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Link
              key={type.name}
              href={type.href}
              className="group relative bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`inline-flex p-3 rounded-lg ${type.color} text-white`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-medium text-gray-900 group-hover:text-gray-700 font-serif">
                    {type.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{type.description}</p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">-</div>
            <div className="text-sm text-gray-600">Average Order Value</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">-</div>
            <div className="text-sm text-gray-600">Total Product Variants</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">-</div>
            <div className="text-sm text-gray-600">Customization Options</div>
          </div>
        </div>
      </div>
    </div>
  );
}