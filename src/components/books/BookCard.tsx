"use client"
import { Book } from '@/lib/supabase/fetchBooks'
import { deleteBook } from '@/lib/supabase/deleteBook'
import { Calendar, User, BookOpen, ExternalLink, Trash2 } from 'lucide-react'
import { useSession, useAuth } from '@clerk/nextjs'
import { useState } from 'react'

interface BookCardProps {
  book: Book
  onClick?: (book: Book) => void
  onDelete?: (bookId: string) => void
}

export default function BookCard({ book, onClick, onDelete }: BookCardProps) {
  const { session } = useSession()
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick(book)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Sind Sie sicher, dass Sie "${book.title}" löschen möchten?`)) {
      return
    }

    setIsDeleting(true)
    
    try {
      const result = await deleteBook(book.id, session)
      
      if (result.success) {
        console.log('Buch erfolgreich gelöscht')
        if (onDelete) {
          onDelete(book.id)
        }
      } else {
        alert(`Fehler beim Löschen: ${result.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert('Unerwarteter Fehler beim Löschen des Buchs')
    } finally {
      setIsDeleting(false)
    }
  }

  // Formatiere das Datum falls vorhanden
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unbekannt'
    try {
      return new Date(dateString).toLocaleDateString('de-DE')
    } catch {
      return dateString
    }
  }

  // Kürze die Beschreibung falls zu lang
  const truncateDescription = (description?: string, maxLength: number = 150) => {
    if (!description) return 'Keine Beschreibung verfügbar'
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + '...'
  }

  // Prüfe, ob der Benutzer Admin oder Superadmin ist
  const canDelete = () => {
    if (!isLoaded || !isSignedIn) return false
    const appRole = sessionClaims?.app_role as string | undefined
    return appRole === 'admin' || appRole === 'superadmin'
  }

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 
        border border-gray-200 overflow-hidden group
        ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}
      `}
      onClick={handleClick}
    >
      {/* Header mit Titel */}
      <div className="p-6 pb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {book.title || 'Unbekannter Titel'}
        </h3>
        
        {/* Autor */}
        <div className="flex items-center text-gray-600 mb-3">
          <User className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{book.author || 'Unbekannter Autor'}</span>
        </div>

        {/* Beschreibung */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          {truncateDescription(book.description)}
        </p>
      </div>

      {/* Footer mit Metadaten */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
          {/* ISBN */}
          {book.isbn && (
            <div className="flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              <span>ISBN: {book.isbn}</span>
            </div>
          )}
          
          {/* Veröffentlichungsjahr */}
          {book.year && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Jahr: {book.year}</span>
            </div>
          )}

          {/* Verlag */}
          {book.publisher && (
            <div className="flex items-center">
              <span>Verlag: {book.publisher}</span>
            </div>
          )}

          {/* Fach */}
          {book.subject && (
            <div className="flex items-center">
              <span>Fach: {book.subject}</span>
            </div>
          )}

          {/* Level */}
          {book.level && (
            <div className="flex items-center">
              <span>Level: {book.level}</span>
            </div>
          )}
        </div>

        {/* Verfügbarkeitsstatus */}
        <div className="mb-3">
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${book.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
            }
          `}>
            {book.available ? '✓ Verfügbar' : '✗ Ausgeliehen'}
          </span>
          {book.has_pdf && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              📄 PDF
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            ID: {book.id.slice(0, 8)}...
          </div>
          
          <div className="flex gap-2">
            {/* Delete Button - nur für Admins und Superadmins */}
            {canDelete() && (
              <button 
                className="
                  inline-flex items-center px-2 py-1 rounded-md text-sm font-medium
                  text-red-600 bg-red-50 hover:bg-red-100 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                onClick={handleDelete}
                disabled={isDeleting}
                title="Buch löschen"
              >
                <Trash2 className={`h-3 w-3 ${isDeleting ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Details Button */}
            {onClick && (
              <button 
                className="
                  inline-flex items-center px-3 py-1 rounded-md text-sm font-medium
                  text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                "
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                Details
                <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
