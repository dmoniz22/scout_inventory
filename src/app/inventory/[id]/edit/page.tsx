'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
}

interface Item {
  id: string
  name: string
  description?: string
  serialNumber?: string
  categoryId: string
  condition: string
  notes?: string
  isActive: boolean
}

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [itemId, setItemId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serialNumber: '',
    categoryId: '',
    condition: 'GOOD',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    params.then(({ id }) => {
      setItemId(id)
      fetchCategories()
      fetchItem(id)
    })
  }, [params])

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

  async function fetchItem(id: string) {
    try {
      setLoading(true)
      const response = await fetch(`/api/items/${id}`)
      if (response.ok) {
        const item = await response.json()
        setFormData({
          name: item.name || '',
          description: item.description || '',
          serialNumber: item.serialNumber || '',
          categoryId: item.categoryId || '',
          condition: item.condition || 'GOOD',
          notes: item.notes || '',
        })
      }
    } catch (error) {
      console.error('Error fetching item:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push(`/inventory/${itemId}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to update item' })
      }
    } catch (error) {
      console.error('Error updating item:', error)
      setErrors({ submit: 'Failed to update item' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/inventory/${itemId}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Item
      </Link>

      <Card title="Edit Item">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Item Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="e.g., 4-Person Tent"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief description of the item..."
            />
          </div>

          <Input
            label="Serial Number"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            placeholder="Optional tracking number"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
          </div>

          <Select
            label="Condition"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            options={[
              { value: 'EXCELLENT', label: 'Excellent' },
              { value: 'GOOD', label: 'Good' },
              { value: 'FAIR', label: 'Fair' },
              { value: 'POOR', label: 'Poor' },
              { value: 'DAMAGED', label: 'Damaged' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Any additional notes about the item..."
            />
          </div>

          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <Link href={`/inventory/${itemId}`}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
