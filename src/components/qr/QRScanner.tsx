'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'

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
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader-' + Math.random().toString(36).substr(2, 9)

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        console.log('Scanner already stopped')
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
        } else {
          setError('No cameras found on this device')
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err)
        setError('Could not access cameras. Please ensure you have granted camera permissions.')
      })

    return () => {
      stopScanning()
    }
  }, [stopScanning])

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Please select a camera')
      return
    }

    try {
      setError('')
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Error callback - ignore "No QR code found" errors
          if (!errorMessage.includes('No QR code found') && onError) {
            onError(errorMessage)
          }
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Failed to start camera. Please check permissions and try again.')
      setIsScanning(false)
    }
  }

  return (
    <div className="relative bg-white rounded-lg p-4">
      {onClose && (
        <button
          onClick={() => {
            stopScanning()
            onClose()
          }}
          className="absolute -top-2 -right-2 z-20 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
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
        className="rounded-lg overflow-hidden bg-gray-100 min-h-[300px] flex items-center justify-center"
        style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
      >
        {!isScanning && (
          <div className="text-center p-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Camera ready</p>
            <button
              onClick={startScanning}
              disabled={!selectedCamera}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
