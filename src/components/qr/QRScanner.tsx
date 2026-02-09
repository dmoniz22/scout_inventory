'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, AlertCircle, RefreshCw } from 'lucide-react'

interface QRScannerProps {
  onScan: (decodedText: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [scannerId] = useState(() => 'qr-scanner-' + Math.random().toString(36).substr(2, 9))

  // Load cameras on mount
  useEffect(() => {
    let mounted = true

    const loadCameras = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const devices = await Html5Qrcode.getCameras()
        
        if (!mounted) return

        if (devices && devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
        } else {
          setError('No cameras found')
        }
      } catch (err: any) {
        if (!mounted) return
        console.error('Camera error:', err)
        setError('Failed to access cameras')
      }
    }

    loadCameras()

    return () => {
      mounted = false
    }
  }, [])

  const startScanning = useCallback(async () => {
    if (!selectedCamera) {
      setError('No camera selected')
      return
    }

    setError('')

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      
      const scanner = new Html5Qrcode(scannerId)
      
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          scanner.stop().catch(() => {})
          setIsScanning(false)
          onScan(decodedText)
        },
        () => {
          // Ignore scan errors (no QR in view)
        }
      )

      setIsScanning(true)
    } catch (err: any) {
      console.error('Scan error:', err)
      setError('Failed to start: ' + (err?.message || 'Unknown error'))
    }
  }, [selectedCamera, scannerId, onScan])

  const stopScanning = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      // Get existing scanner instance and stop it
      const scanner = new Html5Qrcode(scannerId)
      await scanner.stop()
    } catch (e) {
      // Ignore stop errors
    }
    setIsScanning(false)
  }, [scannerId])

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
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
        id={scannerId}
        className="rounded-lg overflow-hidden bg-gray-100"
        style={{ 
          width: '100%', 
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!isScanning && (
          <div className="text-center p-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            {!error && cameras.length > 0 && (
              <>
                <p className="text-gray-600 mb-4">Ready to scan</p>
                <button
                  onClick={startScanning}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Stop Camera
          </button>
        </div>
      )}
    </div>
  )
}
