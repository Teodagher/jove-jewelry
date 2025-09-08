'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  ShoppingCart,
  Star,
  Crown,
  Calendar,
  UserPlus,
  Gift
} from 'lucide-react';

interface Stats {
  name: string;
  value: string;
  change: string;
  changeType: 'neutral' | 'positive' | 'negative';
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardData {
  totalRevenue: number;
  activeOrders: number;
  totalCustomers: number;
  recentOrders: DashboardOrder[];
}

interface DashboardOrder {
  id: string;
  customer: string;
  item: string;
  value: string;
  status: string;
  date: string;
  total: string;
}

const quickActions = [
  {
    name: 'Manage Pricing',
    description: 'Update product prices and customization options',
    href: '/admin/pricing',
    icon: DollarSign,
    color: 'bg-blue-500',
  },
  {
    name: 'Website Customization',
    description: 'Manage hero images, themes, and website appearance',
    href: '/admin/website-customization',
    icon: Crown,
    color: 'bg-indigo-500',
  },
  {
    name: 'Leads Management',
    description: 'View and manage leads from events and forms',
    href: '/admin/leads',
    icon: UserPlus,
    color: 'bg-pink-500',
  },
  {
    name: 'Launch Giveaway',
    description: 'Run bracelet giveaway for event participants',
    href: '/giveaway',
    icon: Gift,
    color: 'bg-emerald-500',
  },
  {
    name: 'View Orders',
    description: 'Review and manage customer orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    color: 'bg-green-500',
  },
  {
    name: 'Customer Management',
    description: 'Manage customer accounts and preferences',
    href: '/admin/customers',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    name: 'Analytics',
    description: 'View sales reports and performance metrics',
    href: '/admin/analytics',
    icon: TrendingUp,
    color: 'bg-orange-500',
  },
];

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    activeOrders: 0,
    totalCustomers: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch orders data
      const { data: orders, error: ordersError } = await (supabase
        .from('orders') as any)
        .select('*, order_items!inner(*)')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) || 0;
      const activeOrders = orders?.filter((order: any) => 
        ['pending', 'confirmed', 'in_production', 'ready_for_delivery'].includes(order.status)
      ).length || 0;

      // Get unique customers
      const uniqueEmails = new Set(orders?.map((order: any) => order.customer_email) || []);
      const totalCustomers = uniqueEmails.size;

      // Recent orders for table
      const recentOrders: DashboardOrder[] = (orders?.slice(0, 5) || []).map((order: any) => ({
        id: order.order_number || order.id.slice(0, 8).toUpperCase(),
        customer: order.customer_name,
        item: `${order.order_items?.length || 0} item${(order.order_items?.length || 0) !== 1 ? 's' : ''}`,
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total),
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' '),
        date: new Date(order.created_at).toLocaleDateString(),
        total: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)
      }));

      setDashboardData({
        totalRevenue,
        activeOrders,
        totalCustomers,
        recentOrders
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats: Stats[] = [
    {
      name: 'Total Revenue',
      value: loading ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dashboardData.totalRevenue),
      change: '-',
      changeType: 'neutral',
      icon: DollarSign,
    },
    {
      name: 'Active Orders',
      value: loading ? '-' : dashboardData.activeOrders.toString(),
      change: '-',
      changeType: 'neutral',
      icon: Package,
    },
    {
      name: 'Total Customers',
      value: loading ? '-' : dashboardData.totalCustomers.toString(),
      change: '-',
      changeType: 'neutral',
      icon: Users,
    },
    {
      name: 'Recent Orders',
      value: loading ? '-' : dashboardData.recentOrders.length.toString(),
      change: '-',
      changeType: 'neutral',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! Here's what's happening with your jewelry business.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="jove-bg-card overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-400">
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-gray-600">Common administrative tasks</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.name}
                  href={action.href}
                  className="group relative jove-bg-card p-6 rounded-lg jove-bg-card-hover hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className={`inline-flex p-3 rounded-lg ${action.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-700">
                      {action.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">{action.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              View all →
            </a>
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="jove-bg-primary divide-y divide-amber-200">
                {dashboardData.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {loading ? 'Loading orders...' : 'No orders yet. Orders will appear here once you start receiving them.'}
                    </td>
                  </tr>
                ) : (
                  dashboardData.recentOrders.map((order) => (
                    <tr key={order.id} className="jove-bg-accent-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'Completed' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'In Production'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'Design Review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
