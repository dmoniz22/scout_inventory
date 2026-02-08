import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import { QRGenerator } from '@/components/qr/QRGenerator'
import Image from 'next/image'

interface Props {
  params: Promise<{ id: string }>
}

async function getItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
    },
  })

  return item
}

export default async function ItemQRPage({ params }: Props) {
  const { id } = await params;
  const item = await getItem(id)

  if (!item) {
    notFound()
  }

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan?item=${item.qrCode}`

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/inventory/${item.id}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Item
      </Link>

      <Card title="Print QR Code Label" subtitle={`For: ${item.name}`}>
        <div className="text-center py-8">
          {/* Label Preview */}
          <div className="inline-block border-2 border-gray-300 rounded-lg p-6 bg-white mb-6">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Scout Group Logo"
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              </div>
              
              {/* Item Info & QR */}
              <div className="text-left">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category.name}</p>
                <div className="mt-2">
                  <QRGenerator value={qrUrl} size={120} />
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

          <div className="flex justify-center space-x-3 no-print">
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />
              Print Label
            </Button>
          </div>
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
  )
}
