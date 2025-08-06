"use client"
import { Book } from '@/lib/supabase/fetchBooks'
import { deleteBook } from '@/lib/supabase/deleteBook'
import { BookOpen, Trash2 } from 'lucide-react'
import { useSession, useAuth } from '@clerk/nextjs'
import { useState } from 'react'

interface BookListItemProps {
  book: Book
  onClick?: (book: Book) => void
  onDelete?: (bookId: string) => void
}

export default function BookListItem({ book, onClick, onDelete }: BookListItemProps) {
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

  // Prüfe, ob der Benutzer Admin oder Superadmin ist
  const canDelete = () => {
    if (!isLoaded || !isSignedIn) return false
    const appRole = sessionClaims?.app_role as string | undefined
    return appRole === 'admin' || appRole === 'superadmin'
  }

  return (
    <div 
      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-4">
        <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">{book.subject} • {book.level}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                {book.title || 'Unbekannter Titel'}
              </h3>
              <p className="text-sm text-gray-600">{book.author || 'Unbekannter Autor'}</p>
            </div>
            {book.available && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Verfügbar
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {book.description || 'Keine Beschreibung verfügbar'}
          </p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Erscheinungsjahr: {book.year || 'Unbekannt'}
            </div>
            <div className="flex items-center gap-2">
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
              <button 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}