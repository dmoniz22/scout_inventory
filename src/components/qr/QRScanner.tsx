'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
  onClose?: () => void
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [html5QrCode, setHtml5QrCode] = useState<any>(null)
  const containerId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`).current

  // Get available cameras on mount
  useEffect(() => {
    const initCameras = async () => {
      try {
        // Dynamically import the library
        const { Html5Qrcode } = await import('html5-qrcode')
        
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
        } else {
          setError('No cameras found on this device')
        }
      } catch (err) {
        console.error('Error getting cameras:', err)
        setError('Could not access cameras. Please ensure you have granted camera permissions.')
      }
    }

    initCameras()
  }, [])

  const stopScanning = useCallback(async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop()
      } catch (e) {
        console.log('Scanner already stopped or error stopping:', e)
      }
      setHtml5QrCode(null)
    }
    setIsScanning(false)
  }, [html5QrCode])

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Please select a camera')
      return
    }

    try {
      setError('')
      
      // Dynamically import the library
      const { Html5Qrcode } = await import('html5-qrcode')
      
      // Create new scanner instance
      const scanner = new Html5Qrcode(containerId)
      
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          // Success callback
          console.log('QR Code scanned:', decodedText)
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage: string) => {
          // Error callback - ignore "No QR code found" errors
          if (!errorMessage.includes('No QR code found') && onError) {
            onError(errorMessage)
          }
        }
      )

      setHtml5QrCode(scanner)
      setIsScanning(true)
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      setError(err?.message || 'Failed to start camera. Please check permissions.')
      setIsScanning(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(console.error)
      }
    }
  }, [html5QrCode])

  return (
    <div className="bg-white rounded-lg p-4">
      {onClose && (
        <button
          onClick={() => {
            stopScanning()
            onClose()
          }}
          className="absolute top-2 right-2 z-20 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {!isScanning && cameras.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        id={containerId}
        className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ width: '100%', height: '300px' }}
      >
        {!isScanning && (
          <div className="text-center p-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Camera ready</p>
            <button
              onClick={startScanning}
              disabled={!selectedCamera}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start Scanning
            </button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="mt-4 text-center">
          <button
            onClick={stopScanning}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Scanning
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500 text-center">
        Point your camera at a QR code to scan
      </p>
    </div>
  )
}
