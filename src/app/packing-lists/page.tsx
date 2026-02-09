'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Package, Plus, Calendar, Trash2, Printer, Eye } from 'lucide-react'

interface PackingList {
  id: string
  name: string
  description?: string
  campDate?: string
  status: string
  _count: {
    items: number
  }
  createdAt: string
}

export default function PackingListsPage() {
  const [packingLists, setPackingLists] = useState<PackingList[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [listToDelete, setListToDelete] = useState<PackingList | null>(null)

  useEffect(() => {
    fetchPackingLists()
  }, [])

  async function fetchPackingLists() {
    try {
      const response = await fetch('/api/packing-lists')
      if (response.ok) {
        const data = await response.json()
        setPackingLists(data)
      }
    } catch (error) {
      console.error('Error fetching packing lists:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(list: PackingList) {
    setListToDelete(list)
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    if (!listToDelete) return

    try {
      const response = await fetch(`/api/packing-lists/${listToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPackingLists(packingLists.filter((l) => l.id !== listToDelete.id))
        setShowDeleteModal(false)
        setListToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting packing list:', error)
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      DRAFT: 'default',
      READY: 'info',
      PACKED: 'success',
      AT_CAMP: 'warning',
      RETURNED: 'default',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packing Lists</h1>
          <p className="text-gray-600 mt-1">
            Create and manage camp packing lists
          </p>
        </div>
        <Link href="/packing-lists/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Packing List</span>
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packing lists...</p>
        </div>
      ) : packingLists.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No packing lists</h3>
          <p className="text-gray-600 mt-1">
            Create your first packing list for an upcoming camp
          </p>
          <Link href="/packing-lists/new" className="mt-4 inline-block">
            <Button>Create Packing List</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packingLists.map((list) => (
            <Card key={list.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{list.name}</h3>
                    {list.campDate && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(list.campDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(list.status)}
                </div>

                {list.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {list.description}
                  </p>
                )}

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Package className="h-4 w-4 mr-1" />
                  {list._count.items} items
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Link
                    href={`/packing-lists/${list.id}`}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    View
                  </Link>
                  <div className="flex space-x-2">
                    <Link
                      href={`/packing-lists/${list.id}/print`}
                      className="text-gray-600 hover:text-gray-800"
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(list)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Packing List"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>{listToDelete?.name}</strong>?
          This will remove all items from the list.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
