'use client'

import { useState, useEffect } from 'react'
import { generateQRCode } from '@/lib/qr'

interface QRGeneratorProps {
  value: string
  size?: number
  className?: string
}

export function QRGenerator({ value, size = 200, className = '' }: QRGeneratorProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    generateQRCodeImage()
  }, [value])

  async function generateQRCodeImage() {
    try {
      setLoading(true)
      setError('')
      const dataUrl = await generateQRCode(value)
      setQrCode(dataUrl)
    } catch (err) {
      setError('Failed to generate QR code')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-red-600 text-sm">Error</span>
      </div>
    )
  }

  return (
    <img
      src={qrCode}
      alt="QR Code"
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
