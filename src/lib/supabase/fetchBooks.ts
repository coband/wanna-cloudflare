import { createClerkSupabaseClient } from "./browser";
import type { SessionResource } from "@clerk/types";

// Interface für die fetchBooks Parameter
export interface FetchBooksParams {
  limit?: number;
  fields?: string;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  filter?: {
    column: string;
    operator:
      | "eq"
      | "neq"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "like"
      | "ilike"
      | "in";
    value: string | number | string[] | number[];
  };
  filters?: Array<{
    column: string;
    operator:
      | "eq"
      | "neq"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "like"
      | "like"
      | "ilike"
      | "in"
      | "cs";
    value: string | number | string[] | number[];
  }>;
  search?: {
    term: string;
    columns: string[];
  };
}

// Interface für das Book-Objekt basierend auf der Datenbankstruktur
export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  publisher?: string;
  year?: number;
  level?: string[];
  subject?: string;
  type?: string;
  school?: string;
  location?: string;
  available: boolean;
  has_pdf: boolean;
  borrowed_at?: string;
  borrowed_by?: string;
  user_id?: string;
  organization_id?: string;
  created_at: string;
}

// Hauptfunktion zum Abrufen von Büchern
export async function fetchBooks(
  params: FetchBooksParams = {},
  session: SessionResource | null | undefined,
) {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      data: [],
      count: 0,
      error: "Keine gültige Session - Anmeldung erforderlich",
    };
  }

  const {
    limit = 10,
    orderBy = { column: "created_at", ascending: false },
    search,
    filters,
  } = params;

  const supabase = createClerkSupabaseClient(session);

  try {
    // Query starten auf INVENTORY (nur Bücher meiner Schule)
    let query = supabase
      .from("organization_inventory")
      .select(`
        *,
        global_books!inner (
          title,
          author,
          isbn,
          publisher,
          year,
          category:subject, 
          description,
          level,
          type
        )
      `);
    // Note: "category:subject" aliases subject to match Book interface if needed, or we just map it manually later.
    // actually let's just select * from global_books and map in memory to be safe, or explicit columns.

    // Helper to determine if column belongs to Global or Inventory
    const isGlobalCol = (col: string) =>
      [
        "title",
        "author",
        "isbn",
        "publisher",
        "year",
        "subject",
        "level",
        "type",
      ].includes(col);

    // ... Filter logic needs to be sophisticated for Joins in Supabase ...
    // Supabase .or() with foreign tables is tricky.
    // Simplifying assumption: Standard Filters handled via manual mapping?

    // Quick Fix: For this iteration, we might pull data and filter, OR use the specific join syntax per filter.
    // Actually, Supabase supports filtering on joined tables: .eq('global_books.title', '...')

    // Apply Filters
    if (search && search.term) {
      // Global Search usually targets Title/Author/ISBN -> Global Table
      const term = search.term;
      query = query.or(
        `title.ilike.%${term}%,author.ilike.%${term}%,isbn.ilike.%${term}%`,
        { foreignTable: "global_books" },
      );
    }

    // Filter anwenden
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        const column = isGlobalCol(filter.column)
          ? `global_books.${filter.column}`
          : filter.column;

        switch (filter.operator) {
          case "eq":
            query = query.eq(column, filter.value);
            break;
          case "neq":
            query = query.neq(column, filter.value);
            break;
          case "gt":
            query = query.gt(column, filter.value);
            break;
          case "gte":
            query = query.gte(column, filter.value);
            break;
          case "lt":
            query = query.lt(column, filter.value);
            break;
          case "lte":
            query = query.lte(column, filter.value);
            break;
          case "like":
            query = query.like(column, filter.value as string);
            break;
          case "ilike":
            query = query.ilike(column, filter.value as string);
            break;
          case "in":
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            query = query.in(column, filter.value as any[]);
            break;
          case "cs":
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            query = query.contains(column, filter.value as any);
            break;
        }
      });
    }

    // Sortierung
    if (orderBy) {
      if (isGlobalCol(orderBy.column)) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending,
          foreignTable: "global_books",
        });
      } else {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }
    }

    // Limit
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map Join Result to Flat Book Interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const books = (data || []).map((item: any) => ({
      ...item.global_books, // Title, Author etc.
      ...item, // Inventory ID, Location, etc.
      id: item.id, // Inventory ID is the primary key for the viewing user
      global_id: item.global_book_id, // Keep ref
    }));

    return {
      success: true,
      data: books as unknown as Book[],
      count: books.length,
    };
  } catch (error) {
    console.error("Unerwarteter Fehler in fetchBooks:", error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

// Hilfsfunktion: Ein einzelnes Buch anhand der ID abrufen
export async function fetchBookById(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _fields: string = "*",
  session: SessionResource | null | undefined,
) {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      data: null,
      error: "Keine gültige Session - Anmeldung erforderlich",
    };
  }

  try {
    const supabase = createClerkSupabaseClient(session);

    // Fetch Inventory Entry + Global Data
    const { data, error } = await supabase
      .from("organization_inventory")
      .select(`
        *,
        global_books!inner (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Fehler beim Abrufen des Buchs:", error);
      throw new Error(`Supabase Fehler: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedBook: any = {
      ...data.global_books,
      ...data,
      id: data.id,
      global_id: data.global_book_id,
    };

    return {
      success: true,
      data: mappedBook as Book,
    };
  } catch (error) {
    console.error("Unerwarteter Fehler in fetchBookById:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

// Hilfsfunktion: Bücher mit Textsuche
export async function searchBooks(
  searchTerm: string,
  searchFields: string[] = ["title", "author"],
  limit: number = 20,
  session: SessionResource | null | undefined,
) {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      data: [],
      count: 0,
      error: "Keine gültige Session - Anmeldung erforderlich",
    };
  }

  try {
    const supabase = createClerkSupabaseClient(session);

    let query = supabase.from("books").select("*");

    // Textsuche in mehreren Feldern
    if (searchFields.length === 1) {
      query = query.ilike(searchFields[0], `%${searchTerm}%`);
    } else {
      // OR-Verknüpfung für mehrere Felder
      const orConditions = searchFields
        .map((field) => `${field}.ilike.%${searchTerm}%`)
        .join(",");
      query = query.or(orConditions);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Fehler bei der Buchsuche:", error);
      throw new Error(`Supabase Fehler: ${error.message}`);
    }

    return {
      success: true,
      data: (data || []) as unknown as Book[],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error("Unerwarteter Fehler in searchBooks:", error);
    return {
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}
