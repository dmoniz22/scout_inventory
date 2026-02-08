'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
  onClose?: () => void
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false
      )

      scanner.render(
        (decodedText) => {
          onScan(decodedText)
          scanner.clear()
        },
        (errorMessage) => {
          // Ignore frequent scan errors, they're normal when no QR is present
          if (onError && !errorMessage.includes('No QR code found')) {
            onError(errorMessage)
          }
        }
      )

      scannerRef.current = scanner
      setIsScanning(true)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div
        id="qr-reader"
        ref={containerRef}
        className="rounded-lg overflow-hidden"
        style={{ width: '100%', maxWidth: '400px' }}
      />
      {!isScanning && (
        <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
    </div>
  )
}
