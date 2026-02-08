'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface QRLabel {
  name: string
  category: string
  qrCode: string
}

export default function QRPrintPage() {
  const searchParams = useSearchParams()
  const [labels, setLabels] = useState<QRLabel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const itemParam = searchParams.get('items')
    if (itemParam) {
      try {
        const items = JSON.parse(decodeURIComponent(itemParam))
        setLabels(items)
      } catch (e) {
        console.error('Error parsing items:', e)
      }
    }
    setLoading(false)
  }, [searchParams])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print p-4 border-b bg-gray-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/inventory">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="ml-4 text-xl font-bold">Print QR Labels</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print Labels
          </Button>
        </div>
      </div>

      {/* Print Preview */}
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {labels.map((label, index) => (
            <QRLabelCard key={index} label={label} />
          ))}
        </div>

        {labels.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No items selected for printing</p>
            <Link href="/inventory">
              <Button variant="outline" className="mt-4">
                Go to Inventory
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function QRLabelCard({ label }: { label: QRLabel }) {
  const [qrImage, setQrImage] = useState<string>('')

  useEffect(() => {
    generateQR(label.qrCode)
  }, [label.qrCode])

  async function generateQR(qrCode: string) {
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(
        `${window.location.origin}/scan?item=${qrCode}`,
        {
          width: 200,
          margin: 1,
        }
      )
      setQrImage(dataUrl)
    } catch (error) {
      console.error('Error generating QR:', error)
    }
  }

  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white print:break-inside-avoid">
      <div className="text-center">
        <h3 className="font-bold text-sm mb-1 truncate">{label.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{label.category}</p>
        {qrImage ? (
          <img
            src={qrImage}
            alt="QR Code"
            className="w-24 h-24 mx-auto"
          />
        ) : (
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1 font-mono">{label.qrCode}</p>
      </div>
    </div>
  )
}
