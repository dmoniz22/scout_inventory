'use client'
import { useState, useEffect, useRef } from 'react'
import { Camera, AlertCircle } from 'lucide-react'
interface QRScannerProps {
  onScan: (decodedText: string) => void
}
export function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState<string>('')
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle')
  
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const devices = await Html5Qrcode.getCameras()
        
        if (devices && devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
        } else {
          setError('No cameras found')
        }
      } catch (err: any) {
        setError('Camera access failed')
      }
    }
    init()
  }, [])
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch (e) {}
      }
    }
  }, [])
  const startScan = async () => {
    if (!selectedCamera || !containerRef.current) {
      setError('Camera not ready')
      return
    }
    setStatus('scanning')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      
      const elementId = 'qr-reader-' + Date.now()
      containerRef.current.id = elementId
      
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner
      await scanner.start(
        selectedCamera,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          setStatus('success')
          onScan(decodedText)
        },
        () => {}
      )
    } catch (err: any) {
      setError('Failed to start camera')
      setStatus('idle')
    }
  }
  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (e) {}
    }
    setStatus('idle')
  }
  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
      {status === 'idle' && cameras.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {cameras.map((camera, idx) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
        {status === 'idle' ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <Camera className="h-16 w-16 text-gray-400 mb-4" />
            <button
              onClick={startScan}
              disabled={!selectedCamera}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              Start Camera
            </button>
          </div>
        ) : status === 'scanning' ? (
          <div className="relative">
            <div ref={containerRef} className="w-full h-[300px]" />
            <button
              onClick={stopScan}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              Stop Scanning
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <p className="text-green-600 font-medium mb-4">QR Code Scanned!</p>
            <button
              onClick={() => {
                stopScan()
                setStatus('idle')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
