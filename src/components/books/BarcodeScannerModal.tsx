"use client"

import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { X, Camera, Loader2 } from 'lucide-react'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (isbn: string) => void
}

export default function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    if (!isOpen) {
      stopScanning()
      return
    }

    // Initialize the code reader
    codeReaderRef.current = new BrowserMultiFormatReader()
    
    return () => {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    if (!videoRef.current || !codeReaderRef.current) return

    try {
      setIsScanning(true)
      setError(null)

      // Request camera permission and start scanning
      await codeReaderRef.current.decodeFromVideoDevice(
        null, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result) {
            const isbn = result.getText()
            // Validate that it looks like an ISBN (10 or 13 digits)
            if (/^\d{10}(\d{3})?$/.test(isbn.replace(/-/g, ''))) {
              onScan(isbn)
              stopScanning()
              onClose()
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error)
          }
        }
      )

      setCameraPermission('granted')
    } catch (err) {
      console.error('Camera error:', err)
      setCameraPermission('denied')
      
      if (err instanceof Error) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          setError('Kamera-Berechtigung wurde verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.')
        } else if (err.message.includes('NotFoundError')) {
          setError('Keine Kamera gefunden. Bitte schließen Sie eine Kamera an.')
        } else {
          setError('Fehler beim Starten der Kamera: ' + err.message)
        }
      } else {
        setError('Unbekannter Fehler beim Starten der Kamera.')
      }
      
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ISBN-Barcode scannen</h2>
            <p className="text-sm text-gray-500">Richten Sie die Kamera auf den ISBN-Barcode</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Modal schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video/Scanner Area */}
        <div className="px-6 py-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-3/4 border-2 border-blue-500 shadow-lg">
                  <div className="animate-scan-line absolute left-0 right-0 top-0 h-0.5 bg-blue-500" />
                </div>
              </div>
            )}

            {/* Start button overlay */}
            {!isScanning && cameraPermission === 'pending' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <button
                  onClick={startScanning}
                  className="flex flex-col items-center gap-3 rounded-lg bg-blue-600 px-8 py-6 text-white transition-colors hover:bg-blue-700"
                >
                  <Camera className="h-12 w-12" />
                  <span className="text-lg font-semibold">Kamera starten</span>
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <strong>Anleitung:</strong> Positionieren Sie den ISBN-Barcode (meist auf der Rückseite des Buchs) 
              im Rahmen. Der Scan erfolgt automatisch, sobald der Barcode erkannt wird.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Scannen läuft...</span>
              </>
            ) : (
              <span>Bereit zum Scannen</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

