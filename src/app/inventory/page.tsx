'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Package, Plus, Search, Filter, QrCode, Edit, Trash2, Eye } from 'lucide-react'

interface Item {
  id: string
  name: string
  description?: string
  serialNumber?: string
  category: {
    id: string
    name: string
    color: string
  }
  condition: string
  isAvailable: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  color: string
}

export default function InventoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [conditionFilter, setConditionFilter] = useState(searchParams.get('condition') || '')
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('available') || '')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [search, categoryFilter, conditionFilter, availabilityFilter])

  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function fetchItems() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (conditionFilter) params.set('condition', conditionFilter)
      if (availabilityFilter) params.set('available', availabilityFilter)

      const response = await fetch(`/api/items?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item: Item) {
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  async function confirmDelete() {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/items/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems(items.filter((i) => i.id !== itemToDelete.id))
        setDeleteModalOpen(false)
        setItemToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  function getConditionBadge(condition: string) {
    const variants: Record<string, any> = {
      EXCELLENT: 'success',
      GOOD: 'default',
      FAIR: 'warning',
      POOR: 'error',
      DAMAGED: 'error',
    }
    return <Badge variant={variants[condition] || 'default'}>{condition}</Badge>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">
            Manage your scout group equipment
          </p>
        </div>
        <Link href="/inventory/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            options={[
              { value: '', label: 'All Conditions' },
              { value: 'EXCELLENT', label: 'Excellent' },
              { value: 'GOOD', label: 'Good' },
              { value: 'FAIR', label: 'Fair' },
              { value: 'POOR', label: 'Poor' },
              { value: 'DAMAGED', label: 'Damaged' },
            ]}
          />

          <Select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Items' },
              { value: 'true', label: 'Available' },
              { value: 'false', label: 'Checked Out' },
            ]}
          />
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No items found</h3>
          <p className="text-gray-600 mt-1">
            {search || categoryFilter || conditionFilter || availabilityFilter
              ? 'Try adjusting your filters'
              : 'Add your first item to get started'}
          </p>
          {!search && !categoryFilter && !conditionFilter && !availabilityFilter && (
            <Link href="/inventory/new" className="mt-4 inline-block">
              <Button>Add First Item</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          {item.serialNumber && (
                            <div className="text-sm text-gray-500">
                              SN: {item.serialNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${item.category.color}20`,
                          color: item.category.color,
                        }}
                      >
                        {item.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getConditionBadge(item.condition)}
                    </td>
                    <td className="px-6 py-4">
                      {item.isAvailable ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="warning">Checked Out</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="text-purple-600 hover:text-purple-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/inventory/${item.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/inventory/${item.id}/qr`}
                          className="text-green-600 hover:text-green-900"
                          title="Print QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Item"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              className="mr-3"
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
