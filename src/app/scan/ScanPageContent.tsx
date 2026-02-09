'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { QRScanner } from '@/components/qr/QRScanner'
import { CheckCircle, RotateCcw } from 'lucide-react'

interface ScannedItem {
  id: string
  name: string
  description?: string
  category: {
    name: string
    color: string
  }
  condition: string
  qrCode: string
  isAvailable: boolean
  activeCheckout?: {
    id: string
    member: {
      id: string
      name: string
    }
    expectedReturn: string
  }
}

interface Member {
  id: string
  name: string
  email?: string
}

export default function ScanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [showScanner, setShowScanner] = useState(true)
  const [loading, setLoading] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    memberId: '',
    expectedReturn: '',
    notes: '',
  })
  const [checkinForm, setCheckinForm] = useState({
    condition: 'GOOD',
    notes: '',
  })

  useEffect(() => {
    const itemQrCode = searchParams.get('item')
    if (itemQrCode) {
      fetchItemByQR(itemQrCode)
    }
    fetchMembers()
  }, [searchParams])

  async function fetchMembers() {
    try {
      const response = await fetch('/api/members?active=true')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  async function fetchItemByQR(qrCode: string) {
    try {
      setLoading(true)
      const response = await fetch(`/api/items/qr/${qrCode}`)
      if (response.ok) {
        const item = await response.json()
        setScannedItem(item)
        setShowScanner(false)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        setCheckoutForm(prev => ({
          ...prev,
          expectedReturn: sevenDaysFromNow.toISOString().split('T')[0]
        }))
      }
    } catch (error) {
      console.error('Error fetching item:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleScan(decodedText: string) {
    const urlMatch = decodedText.match(/[?&]item=([^&]+)/)
    const qrCode = urlMatch ? urlMatch[1] : decodedText
    fetchItemByQR(qrCode)
  }

  async function handleCheckout() {
    if (!scannedItem || !checkoutForm.memberId || !checkoutForm.expectedReturn) return
    try {
      setLoading(true)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: scannedItem.id,
          memberId: checkoutForm.memberId,
          expectedReturn: checkoutForm.expectedReturn,
          notes: checkoutForm.notes,
          conditionOut: scannedItem.condition,
          checkedOutBy: 'System',
        }),
      })
      if (response.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking out item:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckin() {
    if (!scannedItem?.activeCheckout) return
    try {
      setLoading(true)
      const response = await fetch(`/api/checkout/${scannedItem.activeCheckout.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditionIn: checkinForm.condition,
          notes: checkinForm.notes,
          checkedInBy: 'System',
        }),
      })
      if (response.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking in item:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetScan() {
    setScannedItem(null)
    setShowScanner(true)
    setCheckoutForm({ memberId: '', expectedReturn: '', notes: '' })
    setCheckinForm({ condition: 'GOOD', notes: '' })
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('item')
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-gray-600 mt-1">Scan an item's QR code to check it in or out</p>
      </div>

      {showScanner ? (
        <Card title="Scan QR Code">
          <div className="flex justify-center py-4">
            <QRScanner onScan={handleScan} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Point your camera at the item's QR code
          </p>
        </Card>
      ) : scannedItem ? (
        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{scannedItem.name}</h2>
                <div className="flex items-center mt-2 space-x-3">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${scannedItem.category.color}20`,
                      color: scannedItem.category.color,
                    }}
                  >
                    {scannedItem.category.name}
                  </span>
                  {scannedItem.isAvailable ? (
                    <Badge variant="success">Available</Badge>
                  ) : (
                    <Badge variant="warning">Checked Out</Badge>
                  )}
                </div>
                {scannedItem.description && (
                  <p className="text-gray-600 mt-2">{scannedItem.description}</p>
                )}
              </div>
            </div>
          </Card>

          {scannedItem.isAvailable ? (
            <Card title="Check Out Item">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
                  <select
                    value={checkoutForm.memberId}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, memberId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select a member</option>
                    {members.map((member: Member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date *</label>
                  <input
                    type="date"
                    value={checkoutForm.expectedReturn}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, expectedReturn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any notes about this checkout..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button variant="ghost" onClick={resetScan}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    isLoading={loading}
                    disabled={!checkoutForm.memberId || !checkoutForm.expectedReturn}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Check Out
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Check In Item">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Currently borrowed by:</strong> {scannedItem.activeCheckout?.member.name}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Due date:</strong> {new Date(scannedItem.activeCheckout?.expectedReturn || '').toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition on Return *</label>
                  <select
                    value={checkinForm.condition}
                    onChange={(e) => setCheckinForm({ ...checkinForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={checkinForm.notes}
                    onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any notes about the condition or return..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button variant="ghost" onClick={resetScan}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button onClick={handleCheckin} isLoading={loading}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Check In
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}
