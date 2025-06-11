import { createClerkSupabaseClient } from './browser'

// Interface für das Löschen eines Buchs
export interface DeleteBookResult {
  success: boolean
  error?: string
}

// Hauptfunktion zum Löschen eines einzelnen Buchs
export async function deleteBook(
  bookId: string,
  session?: any
): Promise<DeleteBookResult> {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      error: 'Keine gültige Session - Anmeldung erforderlich'
    }
  }

  // Validierung der bookId
  if (!bookId || bookId.trim() === '') {
    return {
      success: false,
      error: 'Ungültige Buch-ID - ID ist erforderlich'
    }
  }

  try {
    const supabase = createClerkSupabaseClient(session)

    // Überprüfen ob das Buch existiert und dem User gehört
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('id, title, user_id')
      .eq('id', bookId)
      .single()

    if (fetchError) {
      console.error('Fehler beim Überprüfen des Buchs:', fetchError)
      return {
        success: false,
        error: 'Buch nicht gefunden oder nicht zugänglich'
      }
    }

    if (!existingBook) {
      return {
        success: false,
        error: 'Buch mit dieser ID existiert nicht'
      }
    }

    // Buch löschen
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    if (deleteError) {
      console.error('Fehler beim Löschen des Buchs:', deleteError)
      throw new Error(`Supabase Fehler: ${deleteError.message}`)
    }

    console.log(`Buch erfolgreich gelöscht: ${existingBook.title} (ID: ${bookId})`)
    
    return {
      success: true
    }

  } catch (error) {
    console.error('Unerwarteter Fehler in deleteBook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen'
    }
  }
}
