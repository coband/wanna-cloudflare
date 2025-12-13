"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { SessionResource } from '@clerk/types'
import { X, Loader2, ScanBarcode, Search } from 'lucide-react'

import type { Book } from '@/lib/supabase/fetchBooks'
import { createBook, CreateBookInput } from '@/lib/supabase/createBook'
import BarcodeScannerModal from './BarcodeScannerModal'
import type { BookLookupResponse } from '@/app/api/book-lookup/route'
import { SUBJECTS, MEDIA_TYPES, LEVELS } from '@/lib/constants'

interface AddBookModalProps {
  isOpen: boolean
  session: SessionResource | null | undefined
  onClose: () => void
  onSuccess?: (book: Book) => void
}

interface FormState {
  title: string
  author: string
  isbn: string
  publisher: string
  subject: string
  description: string
  year: string
  level: string[]
  type: string
  school: string
  location: string
  available: boolean
  hasPdf: boolean
}

const initialFormState: FormState = {
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  subject: '',
  description: '',
  year: '',
  level: [],
  type: '',
  school: '',
  location: '',
  available: true,
  hasPdf: false
}

export default function AddBookModal({ isOpen, session, onClose, onSuccess }: AddBookModalProps) {
  const { orgId } = useAuth()
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isLookingUpBook, setIsLookingUpBook] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setFormState(initialFormState)
      setSearchQuery('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormState((prev) => {
      const currentLevels = prev.level
      if (checked) {
        return { ...prev, level: [...currentLevels, value] }
      } else {
        return { ...prev, level: currentLevels.filter((l) => l !== value) }
      }
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormState((prev) => ({
      ...prev,
      [name]: checked
    }))
  }

  const lookupBook = async (query: string) => {
    setError(null)
    setIsLookingUpBook(true)

    try {
      const response = await fetch('/api/book-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      const result: BookLookupResponse = await response.json()

      if (result.success && result.data) {
        const bookData = result.data
        // Auto-fill form with book data
        setFormState((prev) => ({
          ...prev,
          title: bookData.title || prev.title,
          author: bookData.author || prev.author,
          isbn: bookData.isbn || prev.isbn,
          publisher: bookData.publisher || prev.publisher,
          subject: bookData.subject || prev.subject,
          description: bookData.description || prev.description,
          year: bookData.year ? String(bookData.year) : prev.year,
          level: bookData.level || prev.level,
          type: bookData.type || prev.type
        }))
      } else {
        setError(result.error || 'Keine Buchinformationen gefunden')
      }
    } catch (err) {
      console.error('Book lookup error:', err)
      setError('Fehler beim Abrufen der Buchinformationen')
    } finally {
      setIsLookingUpBook(false)
    }
  }

  const handleIsbnScan = async (isbn: string) => {
    setSearchQuery(isbn)
    await lookupBook(isbn)
  }

  const handleSearch = async () => {
    const query = searchQuery.trim()
    
    if (!query) {
      setError('Bitte geben Sie einen Suchbegriff ein')
      return
    }

    await lookupBook(query)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!session) {
      setError('Keine gültige Session vorhanden.')
      return
    }

    const requiredFields: Array<keyof FormState> = ['title', 'author']
    for (const field of requiredFields) {
      const value = formState[field]
      if (typeof value === 'string' && value.trim() === '') {
        setError('Bitte füllen Sie alle Pflichtfelder aus.')
        return
      }
    }

    const yearValue = formState.year.trim()
    if (yearValue) {
      const parsedYear = Number(yearValue)
      if (Number.isNaN(parsedYear)) {
        setError('Das Erscheinungsjahr muss eine Zahl sein.')
        return
      }
      if (parsedYear < 1500 || parsedYear > new Date().getFullYear() + 5) {
        setError('Bitte geben Sie ein realistisches Erscheinungsjahr an.')
        return
      }
    }

    const payload: CreateBookInput = {
      title: formState.title,
      author: formState.author,
      isbn: formState.isbn,
      publisher: formState.publisher,
      subject: formState.subject,
      description: formState.description || undefined,
      year: yearValue ? Number(yearValue) : undefined,
      level: formState.level.length > 0 ? formState.level : undefined,
      type: formState.type || undefined,
      school: formState.school || undefined,
      location: formState.location || undefined,
      available: formState.available,
      has_pdf: formState.hasPdf
    }

    setIsSubmitting(true)
    try {
      const result = await createBook(payload, session, orgId)
      if (!result.success || !result.data) {
        setError(result.error ?? 'Unbekannter Fehler beim Speichern.')
        return
      }

      if (onSuccess) {
        onSuccess(result.data)
      }

      onClose()
    } catch (err) {
      console.error('Fehler beim Hinzufügen eines Buchs:', err)
      setError('Unerwarteter Fehler beim Hinzufügen des Buchs.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Neues Buch hinzufügen</h2>
            <p className="text-sm text-gray-500">Pflichtfelder sind mit * markiert.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Modal schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-4">
          {/* Search Section */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Buch suchen (Titel, Autor, ISBN)
            </label>
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Harry Potter, 978-3-551-55167-2"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isLookingUpBook || !searchQuery.trim()}
                className="flex items-center justify-center rounded-md bg-blue-600 p-2.5 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Suchen"
                title="Suchen"
              >
                {isLookingUpBook ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Titel *
              </label>
              <input
                name="title"
                value={formState.title}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Titel des Buchs"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Autor *
              </label>
              <input
                name="author"
                value={formState.author}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Autor oder Autoren"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ISBN
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  name="isbn"
                  value={formState.isbn}
                  onChange={handleChange}
                  className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="978-3-16-148410-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  disabled={isLookingUpBook}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="ISBN scannen"
                >
                  <ScanBarcode className="h-5 w-5" />
                  <span className="hidden sm:inline">Scannen</span>
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Verlag
              </label>
              <input
                name="publisher"
                value={formState.publisher}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Verlag"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fach
              </label>
              <select
                name="subject"
                value={formState.subject}
                onChange={handleSelectChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Bitte wählen...</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Erscheinungsjahr
              </label>
              <input
                name="year"
                value={formState.year}
                onChange={handleChange}
                type="number"
                min="1500"
                max={new Date().getFullYear() + 5}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="2025"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Schulstufe(n)
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {LEVELS.map((level) => (
                  <label key={level} className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      value={level}
                      checked={formState.level.includes(level)}
                      onChange={handleLevelChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Medientyp
              </label>
              <select
                name="type"
                value={formState.type}
                onChange={handleSelectChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Bitte wählen...</option>
                {MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Schule
              </label>
              <input
                name="school"
                value={formState.school}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Schule / Standort"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Standort
              </label>
              <input
                name="location"
                value={formState.location}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Regal, Zimmer ..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Beschreibung
            </label>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Kurze Beschreibung oder Notizen"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="available"
                checked={formState.available}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Sofort verfügbar</span>
            </label>
            <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="hasPdf"
                checked={formState.hasPdf}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>PDF vorhanden</span>
            </label>
          </div>

          {isLookingUpBook && (
            <div className="mt-4 flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Buchinformationen werden geladen...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                'Buch speichern'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleIsbnScan}
      />
    </div>
  )
}

