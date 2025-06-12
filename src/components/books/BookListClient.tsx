"use client"
import { useState, useEffect, useCallback } from 'react'
import { useUser, useSession, SignInButton } from '@clerk/nextjs'
import { fetchBooks, Book, FetchBooksParams } from '@/lib/supabase/fetchBooks'
import BookCard from './BookCard'
import { Search, Filter, Loader2, BookOpen, AlertCircle, Lock } from 'lucide-react'

interface BookListClientProps {
  initialLimit?: number
}

export default function BookListClient({ initialLimit = 12 }: BookListClientProps) {
  const { user, isLoaded } = useUser()
  const { session } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'created_at' | 'year' | 'subject'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit] = useState(initialLimit)

  // Bücher laden
  const loadBooks = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Session für Clerk-Supabase Integration verwenden
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
        }
      }

      // Suchfilter hinzufügen falls vorhanden
      if (searchTerm.trim()) {
        params.filter = {
          column: 'title',
          operator: 'ilike',
          value: `%${searchTerm.trim()}%`
        }
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
  }, [user, session, limit, sortBy, sortOrder, searchTerm])

  // Initial load und bei Änderungen neu laden - mit isLoaded Check
  useEffect(() => {
    if (isLoaded) { // Nur laden wenn Clerk bereit ist
      loadBooks()
    }
  }, [isLoaded, user, limit, sortBy, sortOrder, loadBooks])

  // Suche mit Debounce - mit isLoaded Check
  useEffect(() => {
    if (isLoaded && user) { // Nur suchen wenn Clerk bereit und User da
      const timer = setTimeout(() => {
        loadBooks()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [searchTerm, isLoaded, user, loadBooks])

  const handleBookClick = (book: Book) => {
    console.log('Buch angeklickt:', book)
  }

  const handleLoadMore = () => {
    setLimit(prev => prev + 12)
  }

  // Loading State für Clerk (verhindert Flicker!)
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

  // Auth Guard - nur nach dem Laden prüfen
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
            <button className="
              inline-flex items-center px-6 py-3 border border-transparent text-base font-medium
              rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200
            ">
              <Lock className="h-4 w-4 mr-2" />
              Jetzt anmelden
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📚 Bücher Bibliothek
        </h1>
        <p className="text-gray-600">
          Entdecken Sie unsere Sammlung von Büchern
        </p>
      </div>

      {/* Filter und Suche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Suchfeld */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Büchern suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-gray-400
              "
            />
          </div>

          {/* Sortierung */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'author' | 'created_at' | 'year' | 'subject')}
              className="
                flex-1 border border-gray-300 rounded-md px-3 py-2
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            >
              <option value="created_at">Datum hinzugefügt</option>
              <option value="title">Titel</option>
              <option value="author">Autor</option>
              <option value="year">Jahr</option>
              <option value="subject">Fach</option>
            </select>
          </div>

          {/* Sortierreihenfolge */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="
              border border-gray-300 rounded-md px-3 py-2
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
          >
            <option value="desc">Neueste zuerst</option>
            <option value="asc">Älteste zuerst</option>
          </select>
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
            {searchTerm 
              ? `Keine Bücher entsprechen Ihrer Suche nach "${searchTerm}"`
              : 'Es wurden noch keine Bücher hinzugefügt.'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Suche zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Books Grid */}
      {!loading && books.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={handleBookClick}
              />
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="
                inline-flex items-center px-6 py-3 border border-transparent text-base font-medium
                rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                disabled:cursor-not-allowed transition-colors duration-200
              "
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
            {searchTerm && ` für "${searchTerm}"`}
          </p>
        )}
      </div>
    </div>
  )
}