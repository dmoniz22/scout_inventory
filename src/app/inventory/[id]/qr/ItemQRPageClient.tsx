'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Printer } from 'lucide-react'
import Image from 'next/image'

interface Item {
  id: string
  name: string
  qrCode: string
  category: {
    name: string
  }
}

interface ItemQRPageClientProps {
  item: Item
}

export default function ItemQRPageClient({ item }: ItemQRPageClientProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateQR()
  }, [item.qrCode])

  async function generateQR() {
    try {
      const QRCode = (await import('qrcode')).default
      const url = `${window.location.origin}/scan?item=${item.qrCode}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
      })
      setQrCodeUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-only,
          .print-only * {
            visibility: visible;
          }
          
          .print-only {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          
          nav,
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="no-print">
          <Link
            href={`/inventory/${item.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Item
          </Link>

          <Card title="Print QR Code Label" subtitle={`For: ${item.name}`}>
            <div className="text-center py-8">
              {/* Label Preview - Screen View */}
              <div className="inline-block border-2 border-gray-300 rounded-lg p-6 bg-white mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="Scout Group Logo"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category.name}</p>
                    <div className="mt-2">
                      {loading ? (
                        <div className="w-[120px] h-[120px] bg-gray-100 rounded flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                      ) : qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          width={120}
                          height={120}
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="w-[120px] h-[120px] bg-red-50 rounded flex items-center justify-center">
                          <span className="text-red-600 text-xs">Error</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {item.qrCode}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Print this label and attach it to the physical item. The QR code links
                directly to the item for quick check-in/check-out.
              </p>

              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" />
                Print Label
              </Button>
            </div>
          </Card>

          {/* Print Instructions */}
          <Card title="Printing Instructions" className="mt-6">
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>1. Use sticker paper:</strong> For best results, print on
                adhesive label paper that can be attached to the item.
              </p>
              <p>
                <strong>2. Recommended size:</strong> The label is designed to fit on
                a 3x2 inch label or larger.
              </p>
              <p>
                <strong>3. Laminate:</strong> Consider laminating the label for
                outdoor equipment that may be exposed to weather.
              </p>
              <p>
                <strong>4. Placement:</strong> Attach the label in a visible location
                that's easy to scan but won't interfere with item use.
              </p>
            </div>
          </Card>
        </div>

        {/* Print-Only Label */}
        <div className="print-only hidden">
          <div className="border-2 border-black rounded-lg p-6 bg-white inline-block">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
              
              <div className="text-left">
                <h3 className="font-bold text-xl">{item.name}</h3>
                <p className="text-base text-gray-600">{item.category.name}</p>
                <div className="mt-3">
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="QR"
                      width={150}
                      height={150}
                      className="rounded-lg"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  {item.qrCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
