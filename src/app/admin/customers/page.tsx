'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Search, Mail, Phone, ShoppingBag, DollarSign, Calendar, User, Filter, ArrowUpDown } from 'lucide-react'

interface Customer {
  id: string
  email: string
  name: string
  phone?: string | null
  total_orders: number
  total_spent: string
  first_order_date: string
  last_order_date: string
  created_at: string
}

type SortField = 'name' | 'email' | 'total_orders' | 'total_spent' | 'last_order_date'
type SortDirection = 'asc' | 'desc'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('last_order_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterMinOrders, setFilterMinOrders] = useState('')
  const [filterMinSpent, setFilterMinSpent] = useState('')

  // Load customers data
  const loadCustomers = async () => {
    try {
      setLoading(true)

      // Single query with aggregated order stats using PostgreSQL
      const { data: customersWithStats, error } = await supabase.rpc('get_customers_with_order_stats')

      if (error) {
        // Fallback to manual calculation if RPC doesn't exist
        console.warn('RPC function not found, using manual calculation')
        
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, email, name, phone, created_at')

        if (customersError) throw customersError

        const { data: orderStats, error: orderStatsError } = await supabase
          .from('orders')
          .select('customer_email, total, created_at')

        if (orderStatsError) throw orderStatsError

        const calculated = (customersData as Array<{id: string, email: string, name: string, phone: string | null, created_at: string}> || []).map(customer => {
          const customerOrders = (orderStats as Array<{customer_email: string, total: string, created_at: string}> || [])
            .filter(order => order.customer_email === customer.email)
          const total_orders = customerOrders.length
          const total_spent = customerOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0)
          const orderDates = customerOrders.map(order => new Date(order.created_at)).sort((a, b) => a.getTime() - b.getTime())
          
          return {
            ...customer,
            total_orders,
            total_spent: total_spent.toFixed(2),
            first_order_date: orderDates.length > 0 ? orderDates[0].toISOString() : customer.created_at,
            last_order_date: orderDates.length > 0 ? orderDates[orderDates.length - 1].toISOString() : customer.created_at
          }
        }) || []
        
        setCustomers(calculated)
        setFilteredCustomers(calculated)
        return
      }

      setCustomers(customersWithStats)
      setFilteredCustomers(customersWithStats)
    } catch (err) {
      console.error('Error loading customers:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // Filter and search customers
  useEffect(() => {
    let filtered = [...customers]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
    }

    // Minimum orders filter
    if (filterMinOrders) {
      const minOrders = parseInt(filterMinOrders)
      if (!isNaN(minOrders)) {
        filtered = filtered.filter(customer => customer.total_orders >= minOrders)
      }
    }

    // Minimum spent filter
    if (filterMinSpent) {
      const minSpent = parseFloat(filterMinSpent)
      if (!isNaN(minSpent)) {
        filtered = filtered.filter(customer => parseFloat(customer.total_spent) >= minSpent)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortField]
      let bValue: string | number | Date = b[sortField]

      if (sortField === 'total_spent') {
        aValue = parseFloat(aValue as string)
        bValue = parseFloat(bValue as string)
      } else if (sortField === 'total_orders') {
        aValue = parseInt(aValue.toString())
        bValue = parseInt(bValue.toString())
      } else if (sortField.includes('date')) {
        aValue = new Date(aValue as string)
        bValue = new Date(bValue as string)
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, sortField, sortDirection, filterMinOrders, filterMinSpent])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateStats = () => {
    const totalCustomers = filteredCustomers.length
    const totalOrders = filteredCustomers.reduce((sum, customer) => sum + customer.total_orders, 0)
    const totalRevenue = filteredCustomers.reduce((sum, customer) => sum + parseFloat(customer.total_spent), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return { totalCustomers, totalOrders, totalRevenue, avgOrderValue }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading customers: {error}</p>
          <button
            onClick={loadCustomers}
            className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-zinc-900">Customers</h1>
          <p className="text-zinc-600 mt-1">Manage your customer database</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Total Customers</p>
              <p className="text-2xl font-semibold text-zinc-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Total Orders</p>
              <p className="text-2xl font-semibold text-zinc-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(stats.totalRevenue.toFixed(2))}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Avg Order Value</p>
              <p className="text-2xl font-semibold text-zinc-900">{formatCurrency(stats.avgOrderValue.toFixed(2))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <input
              type="number"
              placeholder="Min orders"
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              value={filterMinOrders}
              onChange={(e) => setFilterMinOrders(e.target.value)}
            />
          </div>

          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <input
              type="number"
              placeholder="Min spent"
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              value={filterMinSpent}
              onChange={(e) => setFilterMinSpent(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm('')
              setFilterMinOrders('')
              setFilterMinSpent('')
            }}
            className="px-4 py-2 text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded-lg hover:bg-zinc-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <span>Customer</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center space-x-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <span>Email</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-sm font-medium text-zinc-600">Phone</span>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('total_orders')}
                    className="flex items-center space-x-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <span>Orders</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('total_spent')}
                    className="flex items-center space-x-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <span>Total Spent</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('last_order_date')}
                    className="flex items-center space-x-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    <span>Last Order</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-zinc-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-zinc-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-zinc-900">{customer.name}</p>
                        <p className="text-sm text-zinc-500">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-zinc-400 mr-2" />
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {customer.email}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.phone ? (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-zinc-400 mr-2" />
                        <a
                          href={`tel:${customer.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 text-zinc-400 mr-2" />
                      <span className="text-sm font-medium text-zinc-900">{customer.total_orders}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-zinc-400 mr-2" />
                      <span className="text-sm font-medium text-green-600">{formatCurrency(customer.total_spent)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-zinc-400 mr-2" />
                      <span className="text-sm text-zinc-900">{formatDate(customer.last_order_date)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-zinc-400" />
              <h3 className="mt-2 text-sm font-medium text-zinc-900">No customers found</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {searchTerm || filterMinOrders || filterMinSpent
                  ? 'Try adjusting your search or filters.'
                  : 'Customers will appear here when orders are placed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}