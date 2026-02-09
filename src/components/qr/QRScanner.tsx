'use client'

import { useState, useEffect, useRef, Component, ReactNode } from 'react'
import { Camera, AlertCircle, RefreshCw } from 'lucide-react'

// Error Boundary Component
class ScannerErrorBoundary extends Component<{ children: ReactNode; onError: (error: Error) => void }> {
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.props.children
  }
}

interface QRScannerProps {
  onScan: (decodedText: string) => void
}

function QRScannerInner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const initCameras = async () => {
      try {
        if (typeof window === 'undefined') return
        
        console.log('QR Scanner: Initializing...')
        
        // Check for camera permission first
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          if (isMounted) setHasPermission(true)
        } catch (permErr) {
          console.error('Camera permission error:', permErr)
          if (isMounted) {
            setHasPermission(false)
            setError('Camera permission denied. Please allow camera access in your browser settings.')
          }
          return
        }
        
        // Dynamically import html5-qrcode
        let Html5Qrcode
        try {
          const module = await import('html5-qrcode')
          Html5Qrcode = module.Html5Qrcode
        } catch (importErr) {
          console.error('Failed to import html5-qrcode:', importErr)
          if (isMounted) setError('Failed to load QR scanner library')
          return
        }
        
        // Get cameras
        let devices
        try {
          devices = await Html5Qrcode.getCameras()
        } catch (camErr: any) {
          console.error('Error getting cameras:', camErr)
          if (isMounted) setError('Failed to access cameras: ' + (camErr?.message || 'Unknown error'))
          return
        }
        
        console.log('QR Scanner: Found', devices?.length || 0, 'cameras')
        
        if (isMounted) {
          if (devices && devices.length > 0) {
            setCameras(devices)
            setSelectedCamera(devices[0].id)
            setError('')
          } else {
            setError('No cameras found on this device')
          }
        }
      } catch (err: any) {
        console.error('QR Scanner initialization error:', err)
        if (isMounted) {
          setError('Scanner error: ' + (err?.message || 'Unknown error'))
        }
      }
    }

    initCameras()

    return () => {
      isMounted = false
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [])

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Please select a camera first')
      return
    }

    if (!containerRef.current) {
      setError('Scanner container not ready')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      
      // Stop any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null
      }

      // Create scanner
      const scannerId = 'qr-scanner-' + Date.now()
      containerRef.current.id = scannerId
      
      const scanner = new Html5Qrcode(scannerId)
      scannerRef.current = scanner

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Success
          try {
            scanner.stop()
          } catch (e) {}
          setIsScanning(false)
          setIsLoading(false)
          onScan(decodedText)
        },
        (errorMessage: string) => {
          // Scanning errors - ignore "no QR found"
          if (errorMessage && !errorMessage.includes('No QR code found')) {
            console.log('Scan error:', errorMessage)
          }
        }
      )

      setIsScanning(true)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Start scanning error:', err)
      setError('Failed to start camera: ' + (err?.message || 'Unknown error'))
      setIsScanning(false)
      setIsLoading(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch (e) {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  // Show loading state while checking permission
  if (hasPermission === null) {
    return (
      <div className="w-full p-8 bg-gray-100 rounded-lg text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking camera access...</p>
      </div>
    )
  }

  // Show error if no permission
  if (hasPermission === false) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <h3 className="font-medium text-red-700">Camera Access Required</h3>
        </div>
        <p className="text-red-600 text-sm mb-4">
          Please allow camera access in your browser settings to scan QR codes.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          <RefreshCw className="h-4 w-4 inline mr-1" />
          Retry
        </button>
      </div>
    )
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
                onClick={() => window.location.reload()}
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
                  disabled={isLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? 'Starting...' : 'Start Camera'}
                </button>
              </>
            )}
            {!error && cameras.length === 0 && !isLoading && (
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

// Wrapper with error boundary
export function QRScanner({ onScan }: QRScannerProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (hasError) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <h3 className="font-medium text-red-700">Scanner Error</h3>
        </div>
        <p className="text-red-600 text-sm mb-4">
          {errorMessage || 'An error occurred loading the QR scanner.'}
        </p>
        <button
          onClick={() => {
            setHasError(false)
            setErrorMessage('')
            window.location.reload()
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          <RefreshCw className="h-4 w-4 inline mr-1" />
          Reload Scanner
        </button>
      </div>
    )
  }

  return (
    <ScannerErrorBoundary onError={(err) => {
      console.error('QR Scanner crashed:', err)
      setHasError(true)
      setErrorMessage(err.message)
    }}>
      <QRScannerInner onScan={onScan} />
    </ScannerErrorBoundary>
  )
}
