'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, Plus, Printer, CheckSquare, Square, Package } from 'lucide-react'

interface PackingList {
  id: string
  name: string
  description?: string
  campDate?: string
  status: string
  items: PackingListItem[]
}

interface PackingListItem {
  id: string
  quantity: number
  checked: boolean
  notes?: string
  item: {
    id: string
    name: string
    category: {
      name: string
      color: string
    }
  }
}

export default function PackingListDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [packingList, setPackingList] = useState<PackingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchPackingList()
  }, [id])

  async function fetchPackingList() {
    try {
      const response = await fetch(`/api/packing-lists/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPackingList(data)
      }
    } catch (error) {
      console.error('Error fetching packing list:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleItem(itemId: string, checked: boolean) {
    try {
      await fetch(`/api/packing-lists/${id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked }),
      })
      fetchPackingList()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    )
  }

  if (!packingList) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p>Packing list not found</p>
        <Link href="/packing-lists">
          <Button className="mt-4">Back to Lists</Button>
        </Link>
      </div>
    )
  }

  const checkedCount = packingList.items.filter((i) => i.checked).length
  const totalCount = packingList.items.length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/packing-lists"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Packing Lists
      </Link>

      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{packingList.name}</h1>
            {packingList.description && (
              <p className="text-gray-600 mt-2">{packingList.description}</p>
            )}
            {packingList.campDate && (
              <p className="text-sm text-gray-500 mt-1">
                Camp Date: {new Date(packingList.campDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link href={`/packing-lists/${id}/print`}>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Items
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <Badge variant="default">{packingList.status}</Badge>
          <span className="text-sm text-gray-600">
            {checkedCount} of {totalCount} items packed
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {packingList.items.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-600">No items in this packing list yet</p>
          <Button className="mt-4" onClick={() => setShowAddModal(true)}>
            Add Items
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {packingList.items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleItem(item.id, !item.checked)}
                  className="flex-shrink-0"
                >
                  {item.checked ? (
                    <CheckSquare className="h-6 w-6 text-green-600" />
                  ) : (
                    <Square className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${item.checked ? 'line-through text-gray-400' : ''}`}>
                      {item.item.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${item.item.category.color}20`,
                        color: item.item.category.color,
                      }}
                    >
                      {item.item.category.name}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
