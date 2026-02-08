import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Edit, Printer, Package, Clock, User } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

async function getItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      checkouts: {
        include: {
          member: true,
        },
        orderBy: { checkedOutAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!item) return null

  const activeCheckout = item.checkouts.find((c) => !c.checkedInAt)

  return {
    ...item,
    isAvailable: !activeCheckout,
    activeCheckout,
  }
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getItem(id)

  if (!item) {
    notFound()
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/inventory"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                <div className="flex items-center mt-2 space-x-3">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${item.category.color}20`,
                      color: item.category.color,
                    }}
                  >
                    {item.category.name}
                  </span>
                  {item.isAvailable ? (
                    <Badge variant="success">Available</Badge>
                  ) : (
                    <Badge variant="warning">Checked Out</Badge>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href={`/inventory/${item.id}/qr`}>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-1" />
                    Print QR
                  </Button>
                </Link>
                <Link href={`/inventory/${item.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Description
                </h3>
                <p className="text-gray-900">
                  {item.description || 'No description provided'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Serial Number
                </h3>
                <p className="text-gray-900">
                  {item.serialNumber || 'Not provided'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Condition
                </h3>
                <p>{getConditionBadge(item.condition)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  QR Code
                </h3>
                <p className="font-mono text-sm text-gray-900">{item.qrCode}</p>
              </div>
            </div>

            {item.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                <p className="text-gray-900">{item.notes}</p>
              </div>
            )}
          </Card>

          {/* Checkout History */}
          <Card title="Checkout History" className="mt-6">
            {item.checkouts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No checkout history</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Checked Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {item.checkouts.map((checkout) => {
                      const isOverdue =
                        !checkout.checkedInAt &&
                        new Date(checkout.expectedReturn) < new Date()
                      return (
                        <tr key={checkout.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {checkout.member.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(checkout.checkedOutAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(checkout.expectedReturn).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {checkout.checkedInAt ? (
                              <Badge variant="success">Returned</Badge>
                            ) : isOverdue ? (
                              <Badge variant="error">Overdue</Badge>
                            ) : (
                              <Badge variant="warning">Active</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {/* QR Code Preview */}
          <Card title="QR Code" className="mb-6">
            <div className="text-center">
              <QRCodePreview qrCode={item.qrCode} />
              <p className="text-sm text-gray-500 mt-2">
                Scan to quickly access this item
              </p>
              <Link href={`/inventory/${item.id}/qr`}>
                <Button variant="outline" size="sm" className="mt-3">
                  <Printer className="h-4 w-4 mr-1" />
                  Print Label
                </Button>
              </Link>
            </div>
          </Card>

          {/* Current Status */}
          <Card title="Current Status">
            {item.activeCheckout ? (
              <div className="space-y-3">
                <div className="flex items-center text-red-600">
                  <Package className="h-5 w-5 mr-2" />
                  <span className="font-medium">Checked Out</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Borrowed by</p>
                  <p className="font-medium">{item.activeCheckout.member.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due date</p>
                  <p className="font-medium">
                    {new Date(item.activeCheckout.expectedReturn).toLocaleDateString()}
                  </p>
                </div>
                {new Date(item.activeCheckout.expectedReturn) < new Date() && (
                  <Badge variant="error">Overdue</Badge>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                <p className="text-green-600 font-medium">Available</p>
                <p className="text-sm text-gray-500 mt-1">
                  This item is ready to be checked out
                </p>
                <Link href={`/scan?item=${item.qrCode}`}>
                  <Button size="sm" className="mt-3">
                    Check Out
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function QRCodePreview({ qrCode }: { qrCode: string }) {
  return (
    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500">QR Code</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 font-mono">{qrCode}</p>
      </div>
    </div>
  )
}

import { CheckCircle } from 'lucide-react'
