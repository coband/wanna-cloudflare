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
  const [error, setError] = useState<string | null>(null)
  
  // We use a ref to track if the component is currently mounted/scanning
  // to avoid race conditions with the async startScanning function
  const mountedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    mountedRef.current = true

    if (isOpen) {
      startScanning()
    } else {
      stopScanning()
    }
    
    return () => {
      mountedRef.current = false
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const startScanning = async () => {
    // Reset any previous error
    setError(null)
    
    // Slight delay to ensure video element is rendered
    await new Promise(resolve => setTimeout(resolve, 100))
    if (!mountedRef.current || !isOpen || !videoRef.current) return

    try {
      // Create reader if not exists
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader()
      }

      const reader = codeReaderRef.current
      
      // Start decoding
      await reader.decodeFromVideoDevice(
        null, // use default device
        videoRef.current,
        (result, err) => {
          if (!mountedRef.current) return

          if (result) {
            const isbn = result.getText()
             // Validate that it looks like an ISBN (10 or 13 digits)
             // Allow some flexibility (dashes)
            const cleanIsbn = isbn.replace(/-/g, '')
            if (/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
              stopScanning() // Stop immediately on success
              onScan(isbn)
              onClose()
            }
          }
          
          if (err && !(err instanceof NotFoundException)) {
            // console.error('Scan error:', err)
            // Silence routine scan errors
          }
        }
      )
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Camera error:', err)
      
      if (err instanceof Error) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          setError('Kamera-Zugriff verweigert. Bitte prüfen Sie die Browser-Einstellungen.')
        } else if (err.message.includes('NotFoundError')) {
          setError('Keine Kamera gefunden.')
        } else {
          setError('Kamera-Fehler: ' + err.message)
        }
      } else {
        setError('Kamera konnte nicht gestartet werden.')
      }
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      // Important: Resetting the reader releases the camera
      codeReaderRef.current.reset()
      // We don't nullify the ref here to reuse the instance if needed, 
      // but creating a new one each time is also fine if reset() is called.
      // To be safe against "black screen" (camera busy), we ensure reset is called.
    }
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-black shadow-2xl transition-all">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-4 pt-4 text-white">
          <h2 className="text-lg font-bold drop-shadow-md">ISBN scannen</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Camera Area */}
        <div className="relative flex aspect-[3/4] max-h-[80vh] w-full items-center justify-center bg-black sm:aspect-[4/3]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
            
            {/* Scan Overlay / Guides */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
               {/* Darkened borders to highlight scan area */}
              <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col">
                <div className="flex-1 bg-black/40"></div>
                <div className="flex w-full h-48">
                   <div className="flex-1 bg-black/40"></div>
                   <div className="w-64 border-2 border-white/70 relative">
                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 -mt-[2px] -ml-[2px]" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 -mt-[2px] -mr-[2px]" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 -mb-[2px] -ml-[2px]" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 -mb-[2px] -mr-[2px]" />
                      
                      {/* Scanning Line Animation */}
                      <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                   </div>
                   <div className="flex-1 bg-black/40"></div>
                </div>
                <div className="flex-1 bg-black/40 flex items-start justify-center pt-6">
                   <p className="text-white/90 text-sm font-medium px-4 text-center">
                     Barcode in den Rahmen halten
                   </p>
                </div>
              </div>
            </div>
            
            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 text-center backdrop-blur-sm">
                <div className="max-w-xs rounded-lg p-4">
                  <p className="mb-2 font-medium text-red-400">Es ist ein Fehler aufgetreten</p>
                  <p className="text-sm text-gray-300">{error}</p>
                  <button 
                    onClick={() => { setError(null); startScanning(); }}
                    className="mt-4 rounded-md bg-white px-6 py-2 text-sm font-medium text-black hover:bg-gray-100"
                  >
                    Erneut versuchen
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  )
}

