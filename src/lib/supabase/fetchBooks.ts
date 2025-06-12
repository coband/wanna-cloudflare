import { createClerkSupabaseClient } from './browser'
import type { SessionResource } from '@clerk/types'

// Interface für die fetchBooks Parameter
export interface FetchBooksParams {
  limit?: number
  fields?: string
  orderBy?: {
    column: string
    ascending?: boolean
  }
  filter?: {
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: string | number | string[] | number[]
  }
}

// Interface für das Book-Objekt basierend auf der Datenbankstruktur
export interface Book {
  id: string
  title: string
  author: string
  description?: string
  isbn?: string
  publisher?: string
  year?: number
  level?: string
  subject?: string
  type?: string
  school?: string
  location?: string
  available: boolean
  has_pdf: boolean
  borrowed_at?: string
  borrowed_by?: string
  user_id?: string
  created_at: string
}

// Hauptfunktion zum Abrufen von Büchern
export async function fetchBooks(params: FetchBooksParams = {}, session: SessionResource | null | undefined) {
    // Auth-Prüfung am Anfang
    if (!session) {
      return {
        success: false,
        data: [],
        count: 0,
        error: 'Keine gültige Session - Anmeldung erforderlich'
      }
    }
  
    const {
      limit = 10,
      fields = '*',
      orderBy = { column: 'created_at', ascending: false },
      filter
    } = params
  
    try {
      const supabase = createClerkSupabaseClient(session)
    
    // Query starten
    let query = supabase
      .from('books')
      .select(fields)

    // Filter anwenden, falls vorhanden
    if (filter) {
      const { column, operator, value } = filter
      
      switch (operator) {
        case 'eq':
          if (typeof value === 'string' || typeof value === 'number') query = query.eq(column, value)
          break
        case 'neq':
          if (typeof value === 'string' || typeof value === 'number') query = query.neq(column, value)
          break
        case 'gt':
          if (typeof value === 'string' || typeof value === 'number') query = query.gt(column, value)
          break
        case 'gte':
          if (typeof value === 'string' || typeof value === 'number') query = query.gte(column, value)
          break
        case 'lt':
          if (typeof value === 'string' || typeof value === 'number') query = query.lt(column, value)
          break
        case 'lte':
          if (typeof value === 'string' || typeof value === 'number') query = query.lte(column, value)
          break
        case 'like':
          if (typeof value === 'string') query = query.like(column, value)
          break
        case 'ilike':
          if (typeof value === 'string') query = query.ilike(column, value)
          break
        case 'in':
          if (Array.isArray(value)) query = query.in(column, value)
          break
      }
    }

    // Sortierung anwenden
    query = query.order(orderBy.column, { ascending: orderBy.ascending })

    // Limit anwenden
    if (limit > 0) {
      query = query.limit(limit)
    }

    // Query ausführen
    const { data, error } = await query

    if (error) {
      console.error('Fehler beim Abrufen der Bücher:', error)
      throw new Error(`Supabase Fehler: ${error.message}`)
    }

    return {
      success: true,
      data: (data || []) as unknown as Book[],
      count: data?.length || 0
    }

  } catch (error) {
    console.error('Unerwarteter Fehler in fetchBooks:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}

// Hilfsfunktion: Ein einzelnes Buch anhand der ID abrufen
export async function fetchBookById(
  id: string,
  fields: string = '*',
  session: SessionResource | null | undefined
) {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      data: null,
      error: 'Keine gültige Session - Anmeldung erforderlich'
    }
  }

  try {
    const supabase = createClerkSupabaseClient(session)
    
    const { data, error } = await supabase
      .from('books')
      .select(fields)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Fehler beim Abrufen des Buchs:', error)
      throw new Error(`Supabase Fehler: ${error.message}`)
    }

    return {
      success: true,
      data: data as unknown as Book
    }

  } catch (error) {
    console.error('Unerwarteter Fehler in fetchBookById:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}

// Hilfsfunktion: Bücher mit Textsuche
export async function searchBooks(
  searchTerm: string,
  searchFields: string[] = ['title', 'author'],
  limit: number = 20,
  session: SessionResource | null | undefined
) {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      data: [],
      count: 0,
      error: 'Keine gültige Session - Anmeldung erforderlich'
    }
  }

  try {
    const supabase = createClerkSupabaseClient(session)
    
    let query = supabase.from('books').select('*')

    // Textsuche in mehreren Feldern
    if (searchFields.length === 1) {
      query = query.ilike(searchFields[0], `%${searchTerm}%`)
    } else {
      // OR-Verknüpfung für mehrere Felder
      const orConditions = searchFields
        .map(field => `${field}.ilike.%${searchTerm}%`)
        .join(',')
      query = query.or(orConditions)
    }

    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Fehler bei der Buchsuche:', error)
      throw new Error(`Supabase Fehler: ${error.message}`)
    }

    return {
      success: true,
      data: (data || []) as unknown as Book[],
      count: data?.length || 0
    }

  } catch (error) {
    console.error('Unerwarteter Fehler in searchBooks:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}
