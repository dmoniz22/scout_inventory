'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, AlertCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (decodedText: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)

  // Check camera permission and load cameras on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Try to get camera access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setHasCameraPermission(true)
        
        // Now load cameras
        const { Html5Qrcode } = await import('html5-qrcode')
        const devices = await Html5Qrcode.getCameras()
        
        if (devices && devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
        } else {
          setError('No cameras found on this device')
        }
      } catch (err: any) {
        console.error('Camera permission error:', err)
        setHasCameraPermission(false)
        setError('Camera permission denied. Please allow camera access and reload the page.')
      }
    }

    checkPermission()
  }, [])

  const startScanning = useCallback(async () => {
    if (!selectedCamera) {
      setError('No camera selected')
      return
    }

    setError('')
    setIsScanning(true)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      
      // Use a unique ID for the scanner element
      const elementId = 'qr-scanner-element'
      
      // Create scanner
      const scanner = new Html5Qrcode(elementId)
      
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Success callback
          console.log('QR scanned:', decodedText)
          scanner.stop().catch(() => {})
          setIsScanning(false)
          onScan(decodedText)
        },
        (errorMessage: string) => {
          // Error callback - ignore "no QR found" errors
          if (errorMessage && !errorMessage.includes('No QR code found')) {
            console.log('Scan error:', errorMessage)
          }
        }
      )

      // Store scanner instance to stop later
      ;(window as any).currentQrScanner = scanner
      
    } catch (err: any) {
      console.error('Start scanning error:', err)
      setError('Failed to start camera: ' + (err?.message || 'Unknown error'))
      setIsScanning(false)
    }
  }, [selectedCamera, onScan])

  const stopScanning = useCallback(async () => {
    const scanner = (window as any).currentQrScanner
    if (scanner) {
      try {
        await scanner.stop()
      } catch (e) {
        // Ignore stop errors
      }
      ;(window as any).currentQrScanner = null
    }
    setIsScanning(false)
  }, [])

  // Show loading state while checking permission
  if (hasCameraPermission === null) {
    return (
      <div className="w-full p-8 bg-gray-100 rounded-lg text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking camera access...</p>
      </div>
    )
  }

  // Show error if no permission
  if (hasCameraPermission === false) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-medium text-red-700 mb-2">Camera Access Required</h3>
        <p className="text-red-600 text-sm mb-4">
          Please allow camera access in your browser settings to scan QR codes.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Camera selector */}
      {!isScanning && cameras.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
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

      {/* Scanner container - always rendered with a fixed ID */}
      <div className="bg-gray-100 rounded-lg overflow-hidden relative" style={{ minHeight: '300px' }}>
        <div 
          id="qr-scanner-element" 
          className="w-full h-[300px]"
          style={{ 
            display: isScanning ? 'block' : 'none',
            backgroundColor: '#000'
          }}
        />
        
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Camera className="h-16 w-16 text-gray-400 mb-4" />
            {cameras.length === 0 ? (
              <p className="text-gray-500">Loading cameras...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">Ready to scan QR codes</p>
                <button
                  onClick={startScanning}
                  disabled={!selectedCamera}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Start Camera
                </button>
              </>
            )}
          </div>
        )}
        
        {isScanning && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={stopScanning}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm shadow-lg"
            >
              Stop Scanning
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Point your camera at a QR code to scan
      </p>
    </div>
  )
}
