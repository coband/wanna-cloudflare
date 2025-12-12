"use client"
import { Book } from '@/lib/supabase/fetchBooks'
import { deleteBook } from '@/lib/supabase/deleteBook'
import { 
  X, 
  BookOpen, 
  User, 
  Calendar, 
  Building, 
  MapPin, 
  GraduationCap, 
  Tag,
  Hash,
  School,
  FileText,
  Trash2,
  Download
} from 'lucide-react'
import { useSession, useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

interface BookDetailsProps {
  book: Book
  isOpen: boolean
  onClose: () => void
  onDelete?: (bookId: string) => void
}

export default function BookDetails({ book, isOpen, onClose, onDelete }: BookDetailsProps) {
  const { session } = useSession()
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Animation beim Öffnen/Schließen
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    } else {
      // Verzögerung beim Schließen für Animation
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prüfe, ob der Benutzer Admin oder Superadmin ist
  const canDelete = () => {
    if (!isLoaded || !isSignedIn) return false
    const appRole = sessionClaims?.app_role as string | undefined
    return appRole === 'admin' || appRole === 'superadmin'
  }

  const handleDelete = async () => {
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
        onClose() // Modal schließen nach erfolgreichem Löschen
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen && !isAnimating) return null

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-out ${
        isOpen 
          ? 'bg-black/50' 
          : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out ${
          isOpen 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-75 opacity-0 translate-y-8'
        }`}
        style={{
          transformOrigin: 'center center',
          animation: isOpen ? 'modal-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1 mr-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {book.title || 'Unbekannter Titel'}
            </h1>
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>{book.author || 'Unbekannter Autor'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-all duration-200 hover:shadow-md"
            title="Schließen"
          >
            <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Buch Vorschau */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center mb-6 border border-blue-100">
                <BookOpen className="h-24 w-24 text-blue-500 mx-auto mb-4" />
                <div className="text-sm text-blue-600 font-medium">
                  Buchvorschau
                </div>
              </div>

              {/* Verfügbarkeit */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verfügbarkeit</h3>
                <div className="space-y-2">
                  <span className={`
                    inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                    ${book.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }
                  `}>
                    {book.available ? '✓ Verfügbar' : '✗ Ausgeliehen'}
                  </span>
                  {book.has_pdf && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        📄 PDF verfügbar
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Aktionen */}
              <div className="space-y-3">
                {book.has_pdf && (
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <Download className="h-4 w-4 mr-2" />
                    PDF herunterladen
                  </button>
                )}
                
                {canDelete() && (
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Trash2 className={`h-4 w-4 mr-2 ${isDeleting ? 'animate-spin' : ''}`} />
                    {isDeleting ? 'Wird gelöscht...' : 'Buch löschen'}
                  </button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-2">
              {/* Beschreibung */}
              {book.description && (
                <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Beschreibung</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Metadaten Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Publikationsdetails */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-blue-500" />
                    Publikationsdetails
                  </h4>
                  <div className="space-y-3">
                    {book.isbn && (
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">ISBN</div>
                          <div className="text-sm font-medium">{book.isbn}</div>
                        </div>
                      </div>
                    )}
                    
                    {book.publisher && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">Verlag</div>
                          <div className="text-sm font-medium">{book.publisher}</div>
                        </div>
                      </div>
                    )}
                    
                    {book.year && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">Erscheinungsjahr</div>
                          <div className="text-sm font-medium">{book.year}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bildungsdetails */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-green-500" />
                    Bildungsdetails
                  </h4>
                  <div className="space-y-3">
                    {book.subject && (
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">Fachbereich</div>
                          <div className="text-sm font-medium">{book.subject}</div>
                        </div>
                      </div>
                    )}
                    
                    {book.level && (
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">Schulstufe</div>
                          <div className="text-sm font-medium">{book.level}</div>
                        </div>
                      </div>
                    )}
                    
                    {book.school && (
                      <div className="flex items-center">
                        <School className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">Schule</div>
                          <div className="text-sm font-medium">{book.school}</div>
                        </div>
                      </div>
                    )}
                    
                    {book.type && (
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-500">Typ</div>
                          <div className="text-sm font-medium">{book.type}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Standort */}
              {book.location && (
                <div className="mt-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                      Standort
                    </h4>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm font-medium">{book.location}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Zusätzliche Informationen */}
              <div className="mt-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="font-mono">Buch-ID: {book.id}</div>
                    {book.created_at && (
                      <div>Hinzugefügt am: {new Date(book.created_at).toLocaleDateString('de-DE')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}