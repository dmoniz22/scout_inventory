'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, AlertCircle, RefreshCw } from 'lucide-react'

interface QRScannerProps {
  onScan: (decodedText: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize cameras
    const getCameras = async () => {
      try {
        if (typeof window === 'undefined') return
        
        const Html5Qrcode = (await import('html5-qrcode')).Html5Qrcode
        const devices = await Html5Qrcode.getCameras()
        
        if (devices && devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
          setError('')
        } else {
          setError('No cameras found. Please ensure your device has a camera.')
        }
      } catch (err: any) {
        console.error('Camera error:', err)
        setError(err?.message || 'Unable to access camera. Please check permissions.')
      }
    }

    getCameras()

    // Cleanup
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [])

  const startScanning = async () => {
    if (!selectedCamera || !containerRef.current) {
      setError('Please select a camera first')
      return
    }

    try {
      setError('')
      
      const { Html5Qrcode } = await import('html5-qrcode')
      
      // Clear any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }

      // Create new scanner with element ID
      const containerId = 'qr-scanner-container'
      containerRef.current.id = containerId
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // On successful scan
          console.log('QR Code scanned:', decodedText)
          try {
            scanner.stop()
          } catch (e) {
            // Ignore stop errors
          }
          setIsScanning(false)
          onScan(decodedText)
        },
        (errorMessage: string) => {
          // On scan error (this runs frequently while no QR is in view)
          // Only log real errors, not "no code found"
          if (!errorMessage?.includes('No QR code found')) {
            console.log('Scan attempt:', errorMessage)
          }
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error('Start scanning error:', err)
      setError(err?.message || 'Failed to start camera. Please try again.')
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const retryCameraAccess = () => {
    setError('')
    window.location.reload()
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <button
                onClick={retryCameraAccess}
                className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!isScanning && cameras.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {cameras.map((camera, index) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ width: '100%', minHeight: '300px' }}
      >
        {!isScanning && (
          <div className="text-center p-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            {!error && cameras.length > 0 && (
              <>
                <p className="text-gray-600 mb-4">Ready to scan</p>
                <button
                  onClick={startScanning}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Start Camera
                </button>
              </>
            )}
            {!error && cameras.length === 0 && (
              <p className="text-gray-500">Loading cameras...</p>
            )}
          </div>
        )}
      </div>

      {isScanning && (
        <div className="mt-4 text-center">
          <button
            onClick={stopScanning}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Stop Camera
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Point camera at QR code
          </p>
        </div>
      )}
    </div>
  )
}
