"use client"
import { useState, useEffect, useCallback } from 'react'
import { useUser, useSession, SignInButton, useAuth } from '@clerk/nextjs'
import { fetchBooks, Book, FetchBooksParams } from '@/lib/supabase/fetchBooks'
import BookCard from './BookCard'
import BookListItem from './BookListItem'
import BookDetails from './BookDetails'
import AddBookModal from './AddBookModal'
import { Search, Loader2, BookOpen, AlertCircle, Lock, List, Grid3X3, ChevronDown, Plus, Filter } from 'lucide-react'

interface BookListClientProps {
  initialLimit?: number
}

import { SUBJECTS, LEVELS, MEDIA_TYPES } from '@/lib/constants'

// Removed local SUBJECTS definition since we import it

export default function BookListClient({ initialLimit = 12 }: BookListClientProps) {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const { isSignedIn, sessionClaims } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'author' | 'year' | 'subject'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit] = useState(initialLimit)
  // const [activeTab, setActiveTab] = useState<'titel' | 'autor' | 'fachbereich' | 'schulstufe' | 'erscheinungsjahr'>('titel') // Removed activeTab
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [selectedMediaType, setSelectedMediaType] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false)
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const appRole = sessionClaims?.app_role as string | undefined
  const canManageBooks = isSignedIn && (appRole === 'admin' || appRole === 'superadmin')

  // Bücher laden
  const loadBooks = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (!session) {
        setError('Keine gültige Session gefunden')
        return
      }

      const params: FetchBooksParams = {
        limit,
        fields: 'id, title, author, description, isbn, publisher, year, level, subject, type, school, location, available, has_pdf, created_at',
        orderBy: {
          column: sortBy,
          ascending: sortOrder === 'asc'
        },
        filters: []
      }

      // Global Search
      if (searchTerm.trim()) {
        params.search = {
          term: searchTerm.trim(),
          columns: ['title', 'author', 'isbn', 'subject', 'level', 'publisher']
        }
      }

      // Medientyp Filter
      if (selectedMediaType) {
        params.filters?.push({
          column: 'type',
          operator: 'eq',
          value: selectedMediaType
        })
      }

      // Fachbereich Filter
      if (selectedSubject) {
        params.filters?.push({
          column: 'subject',
          operator: 'ilike', // ilike für case-insensitive partial match, falls "Mathematik (Algebra)"
          value: `%${selectedSubject}%`
        })
      }


      // Schulstufe Filter (Multi-Select Overlap)
      if (selectedLevels.length > 0) {
        params.filters?.push({
          column: 'level',
          operator: 'overlaps',
          value: selectedLevels
        })
      }

      const result = await fetchBooks(params, session)

      if (result.success) {
        setBooks(result.data)
      } else {
        setError(result.error || 'Fehler beim Laden der Bücher')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [user, session, limit, sortBy, sortOrder, searchTerm, selectedSubject, selectedLevels, selectedMediaType])

  useEffect(() => {
    if (!isLoaded || !user) {
      return
    }

    const timer = setTimeout(() => {
      loadBooks()
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, searchTerm, sortBy, sortOrder, limit, selectedSubject, selectedLevels, selectedMediaType])

  useEffect(() => {
    if (!feedbackMessage) {
      return
    }

    const timer = setTimeout(() => setFeedbackMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [feedbackMessage])

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    setIsDetailsOpen(true)
  }

  const handleBookDelete = (bookId: string) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId))
  }

  const handleBookCreated = (book: Book) => {
    setFeedbackMessage(`"${book.title}" wurde erfolgreich hinzugefügt.`)
    // Optimistic Update: Add to list immediately
    setBooks(prevBooks => [book, ...prevBooks])
    // Optionally background re-fetch to ensure consistency (e.g. if sorting is active)
    // loadBooks() 
  }

  const handleLoadMore = () => {
    setLimit(prev => prev + 12)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedBook(null)
  }

  // Loading State für Clerk
  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Anwendung wird geladen...</span>
        </div>
      </div>
    )
  }

  // Auth Guard
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Anmeldung erforderlich
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Sie müssen sich anmelden, um Zugriff auf die Bücher-Bibliothek zu erhalten.
          </p>
          <SignInButton mode="modal">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
              <Lock className="h-4 w-4 mr-2" />
              Jetzt anmelden
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Katalog</h1>
            <p className="text-gray-600">
              Durchsuchen Sie unseren umfangreichen Katalog an Lehrmitteln für alle Schulstufen und Fachbereiche.
            </p>
          </div>
          {canManageBooks && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buch hinzufügen
            </button>
          )}
        </div>

        {feedbackMessage && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {feedbackMessage}
          </div>
        )}

        {/* Suchleiste und Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen Sie nach Titel, Autor, ISBN, Fachbereich..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Zusätzliche Filter */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtern nach:</span>
            </div>
            
            <div className="relative w-full md:w-auto md:min-w-[200px]">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle Fachbereiche</option>
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative w-full md:w-auto md:min-w-[200px]">
              <select
                value={selectedMediaType}
                onChange={(e) => setSelectedMediaType(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle Medienarten</option>
                {MEDIA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative w-full md:w-auto md:min-w-[200px]">
              <button
                onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                className="w-full text-left bg-gray-50 border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedLevels.length === 0 
                    ? 'Alle Schulstufen' 
                    : selectedLevels.length === 1 
                      ? selectedLevels[0] 
                      : `${selectedLevels.length} ausgewählt`}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              
              {isLevelDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsLevelDropdownOpen(false)}
                  />
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {LEVELS.map(level => (
                      <label 
                        key={level} 
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLevels([...selectedLevels, level])
                            } else {
                              setSelectedLevels(selectedLevels.filter(l => l !== level))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {(selectedSubject || selectedLevels.length > 0 || selectedMediaType) && (
              <button
                onClick={() => {
                  setSelectedSubject('')
                  setSelectedLevels([])
                  setSelectedMediaType('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline w-full md:w-auto text-left md:text-center"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        </div>



        {/* Suchergebnisse Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Suchergebnisse</h2>
            <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-4">
              <span className="text-sm text-gray-600 hidden md:inline">Sortieren nach:</span>
              <div className="relative flex-1 md:flex-none">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as typeof sortBy)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="w-full md:w-auto appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at-desc">Relevanz</option>
                  <option value="title-asc">Titel A-Z</option>
                  <option value="title-desc">Titel Z-A</option>
                  <option value="author-asc">Autor A-Z</option>
                  <option value="year-desc">Neueste zuerst</option>
                  <option value="year-asc">Älteste zuerst</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Listenansicht Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Listenansicht</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && books.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Bücher werden geladen...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">Fehler: {error}</span>
            </div>
            <button
              onClick={loadBooks}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && books.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Bücher gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedSubject || selectedLevels.length > 0 || selectedMediaType
                ? 'Keine Bücher entsprechen Ihren Suchkriterien.'
                : 'Es wurden noch keine Bücher hinzugefügt.'
              }
            </p>
            {(searchTerm || selectedSubject || selectedLevels.length > 0 || selectedMediaType) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedSubject('')
                  setSelectedLevels([])
                  setSelectedMediaType('')
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Books Display */}
        {!loading && books.length > 0 && (
          <>
            {viewMode === 'list' ? (
              // Listen-Ansicht
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="divide-y divide-gray-200">
                  {books.map((book) => (
                    <BookListItem
                      key={book.id}
                      book={book}
                      onClick={handleBookClick}
                      onDelete={handleBookDelete}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Karten-Ansicht
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onClick={handleBookClick}
                    onDelete={handleBookDelete}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Wird geladen...
                  </>
                ) : (
                  'Mehr Bücher laden'
                )}
              </button>
            </div>
          </>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {books.length > 0 && (
            <p>
              {books.length} Bücher angezeigt
              {(searchTerm || selectedSubject || selectedLevels.length > 0 || selectedMediaType) && ' (gefiltert)'}
            </p>
          )}
        </div>
      </div>

      <AddBookModal
        isOpen={isAddModalOpen}
        session={session}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleBookCreated}
      />

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetails
          book={selectedBook}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onDelete={handleBookDelete}
        />
      )}
    </div>
  )
}