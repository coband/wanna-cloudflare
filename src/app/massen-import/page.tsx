"use client"

import { useState, useRef } from "react"
import { useSession } from "@clerk/nextjs"
import { 
  Loader2, 
  Play, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  X,
  Plus,
  SaveAll
} from "lucide-react"
import { createBook, type CreateBookInput } from "@/lib/supabase/createBook"
import type { BookLookupResponse } from "@/app/api/book-lookup/route"

type ImportStatus = "pending" | "loading" | "success" | "error" | "saved"

interface ImportItem {
  id: string
  originalQuery: string
  status: ImportStatus
  data?: {
    title: string
    author: string
    isbn: string
    publisher: string
    subject: string
    description: string
    year: string
    level: string
    type: string
    school: string
    location: string
    available: boolean
    hasPdf: boolean
  }
  error?: string
}

export default function MassImportPage() {
  // const { user } = useUser()
  const { session } = useSession()
  
  const [inputText, setInputText] = useState("")
  const [items, setItems] = useState<ImportItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  
  // Queue processing ref to stop it if needed
  const abortControllerRef = useRef<AbortController | null>(null)

  const parseInput = () => {
    if (!inputText.trim()) return

    const lines = inputText.split("\n").filter(line => line.trim().length > 0)
    const newItems: ImportItem[] = lines.map(line => ({
      id: crypto.randomUUID(),
      originalQuery: line.trim(),
      status: "pending"
    }))

    setItems(prev => [...prev, ...newItems])
    setInputText("")
  }

  const processQueue = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    abortControllerRef.current = new AbortController()

    const pendingItems = items.filter(item => item.status === "pending")
    setProgress({ current: 0, total: pendingItems.length })

    // Process in chunks of 3 to respect rate limits but be faster than serial
    const CONCURRENCY = 3
    
    let processedCount = 0

    for (let i = 0; i < pendingItems.length; i += CONCURRENCY) {
      if (abortControllerRef.current?.signal.aborted) break

      const chunk = pendingItems.slice(i, i + CONCURRENCY)
      
      await Promise.all(chunk.map(async (item) => {
        // Update status to loading
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "loading" } : p))

        try {
          const response = await fetch("/api/book-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: item.originalQuery }),
            signal: abortControllerRef.current?.signal
          })

          const result: BookLookupResponse = await response.json()

          if (result.success && result.data) {
            setItems(prev => prev.map(p => p.id === item.id ? {
              ...p,
              status: "success",
              data: {
                title: result.data!.title || "",
                author: result.data!.author || "",
                isbn: result.data!.isbn || "Unbekannt",
                publisher: result.data!.publisher || "Unbekannt",
                subject: result.data!.subject || "Unbekannt",
                description: result.data!.description || "",
                year: result.data!.year ? String(result.data!.year) : "",
                level: result.data!.level || "",
                type: result.data!.type || "",
                school: "",
                location: "",
                available: true,
                hasPdf: false
              }
            } : p))
          } else {
             setItems(prev => prev.map(p => p.id === item.id ? {
              ...p,
              status: "error",
              error: result.error || "Keine Daten gefunden"
            } : p))
          }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return
            setItems(prev => prev.map(p => p.id === item.id ? {
              ...p,
              status: "error",
              error: "Netzwerkfehler"
            } : p))
        } finally {
          processedCount++
          setProgress(prev => ({ ...prev, current: processedCount }))
        }
      }))

      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsProcessing(false)
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsProcessing(false)
    }
  }

  const updateItemData = (id: string, field: string, value: string | boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id || !item.data) return item
      return {
        ...item,
        data: {
          ...item.data,
          [field]: value
        }
      }
    }))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const saveItem = async (item: ImportItem) => {
    if (!item.data || !session) return

    try {
      const payload: CreateBookInput = {
        title: item.data.title,
        author: item.data.author,
        isbn: item.data.isbn,
        publisher: item.data.publisher,
        subject: item.data.subject,
        description: item.data.description,
        year: item.data.year ? Number(item.data.year) : undefined,
        level: item.data.level,
        type: item.data.type,
        school: item.data.school,
        location: item.data.location,
        available: item.data.available,
        has_pdf: item.data.hasPdf
      }

      const result = await createBook(payload, session)

      if (result.success) {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: "saved" } : p))
      } else {
        alert(`Fehler beim Speichern von "${item.data.title}": ${result.error}`)
      }
    } catch (err) {
      console.error("Save error:", err)
      alert("Fehler beim Speichern")
    }
  }

  const handleSaveAll = async () => {
    if (!session) return
    setIsSaving(true)

    const itemsToSave = items.filter(item => item.status === "success" && item.data)
    
    // Process sequentially to avoid database locking issues if any
    for (const item of itemsToSave) {
      await saveItem(item)
    }

    setIsSaving(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Massen-Import</h1>
        <p className="mt-2 text-gray-600">
          Fügen Sie hier eine Liste von Büchern ein (ein Buch pro Zeile). 
          Das System sucht automatisch nach Details.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Buchliste (Autor, Titel, ISBN...)
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input 
                  type="checkbox" 
                  checked={wordWrap} 
                  onChange={(e) => setWordWrap(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Zeilenumbruch
              </label>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`h-[400px] w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!wordWrap ? 'whitespace-nowrap overflow-x-auto' : ''}`}
              placeholder="978-3-551-55167-2&#10;Harry Potter und der Stein der Weisen&#10;Funke, Cornelia : Herr der Diebe"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={parseInput}
                disabled={!inputText.trim()}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Zur Liste hinzufügen
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="font-medium text-gray-900">Status</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gesamt:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ausstehend:</span>
                <span className="font-medium">{items.filter(i => i.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Gefunden:</span>
                <span className="font-medium">{items.filter(i => i.status === 'success' || i.status === 'saved').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Fehler:</span>
                <span className="font-medium">{items.filter(i => i.status === 'error').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Verarbeite {progress.current} / {progress.total}
                  </span>
                  <button 
                    onClick={handleStop}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Stoppen
                  </button>
                </div>
              ) : (
                <button
                  onClick={processQueue}
                  disabled={items.filter(i => i.status === 'pending').length === 0}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Suche starten
                </button>
              )}
            </div>

            <div className="flex gap-2">
               <button
                  onClick={handleSaveAll}
                  disabled={isSaving || items.filter(i => i.status === 'success').length === 0}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveAll className="h-4 w-4" />}
                  Alle hinzufügen
                </button>
               <button
                  onClick={() => setItems([])}
                  className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Alles löschen
                </button>
            </div>
          </div>

          <div className="space-y-2">
            {items.length === 0 && (
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
                Keine Einträge
              </div>
            )}
            
            {items.map((item) => (
              <ImportItemRow 
                key={item.id} 
                item={item} 
                onUpdate={(field, val) => updateItemData(item.id, field, val)}
                onRemove={() => removeItem(item.id)}
                onSave={() => saveItem(item)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ImportItemRow({ 
  item, 
  onUpdate, 
  onRemove,
  onSave 
}: { 
  item: ImportItem
  onUpdate: (field: string, value: string | boolean) => void
  onRemove: () => void
  onSave: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (item.status === 'pending' || item.status === 'loading') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {item.status === 'loading' ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
          )}
          <span className="font-medium text-gray-700">{item.originalQuery}</span>
        </div>
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
          <X className="h-5 w-5" />
        </button>
      </div>
    )
  }

  if (item.status === 'error') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <div className="font-medium text-gray-900">{item.originalQuery}</div>
            <div className="text-sm text-red-600">{item.error}</div>
          </div>
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600">
          <X className="h-5 w-5" />
        </button>
      </div>
    )
  }

  // Success/Saved state
  return (
    <div className={`rounded-lg border transition-all ${
      item.status === 'saved' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
    } shadow-sm`}>
      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0">
          {item.status === 'saved' ? (
             <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
             <CheckCircle2 className="h-6 w-6 text-blue-600" />
          )}
        </div>
        
        {/* Collapsed View: Prioritize Title and Author */}
        <div className="flex-1 grid gap-4 md:grid-cols-[2fr_1.5fr]">
          <input 
            value={item.data?.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm font-medium"
            placeholder="Titel"
            disabled={item.status === 'saved'}
            title={item.data?.title} // Tooltip for full text
          />
          <input 
            value={item.data?.author}
            onChange={(e) => onUpdate('author', e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="Autor"
            disabled={item.status === 'saved'}
            title={item.data?.author}
          />
        </div>

        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline px-2"
          >
            {isExpanded ? 'Weniger' : 'Mehr'}
          </button>
          {item.status !== 'saved' && (
             <button 
              onClick={onSave}
              className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
              title="Speichern"
            >
              <Save className="h-4 w-4" />
            </button>
          )}
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-6">
           <div className="grid gap-6">
              {/* Main Fields Row */}
              <div className="grid gap-4 md:grid-cols-2">
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Titel</label>
                    <input 
                      value={item.data?.title}
                      onChange={(e) => onUpdate('title', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium"
                      disabled={item.status === 'saved'}
                    />
                 </div>
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Autor</label>
                    <input 
                      value={item.data?.author}
                      onChange={(e) => onUpdate('author', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
              </div>

              {/* Secondary Fields Row */}
              <div className="grid gap-4 md:grid-cols-3">
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">ISBN</label>
                    <input 
                      value={item.data?.isbn}
                      onChange={(e) => onUpdate('isbn', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Verlag</label>
                    <input 
                      value={item.data?.publisher}
                      onChange={(e) => onUpdate('publisher', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Fach</label>
                    <input 
                      value={item.data?.subject}
                      onChange={(e) => onUpdate('subject', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
              </div>

              {/* Details Row */}
              <div className="grid gap-4 md:grid-cols-4">
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Jahr</label>
                    <input 
                      value={item.data?.year}
                      onChange={(e) => onUpdate('year', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Stufe</label>
                    <input 
                      value={item.data?.level}
                      onChange={(e) => onUpdate('level', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Typ</label>
                    <input 
                      value={item.data?.type}
                      onChange={(e) => onUpdate('type', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
                 <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Standort</label>
                    <input 
                      value={item.data?.location}
                      onChange={(e) => onUpdate('location', e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      disabled={item.status === 'saved'}
                    />
                 </div>
              </div>

               {/* Description */}
               <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Beschreibung</label>
                <textarea 
                  value={item.data?.description}
                  onChange={(e) => onUpdate('description', e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  rows={6}
                  disabled={item.status === 'saved'}
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input 
                    type="checkbox"
                    checked={item.data?.available}
                    onChange={(e) => onUpdate('available', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={item.status === 'saved'}
                  />
                  Sofort verfügbar
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input 
                    type="checkbox"
                    checked={item.data?.hasPdf}
                    onChange={(e) => onUpdate('hasPdf', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={item.status === 'saved'}
                  />
                  PDF vorhanden
                </label>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
