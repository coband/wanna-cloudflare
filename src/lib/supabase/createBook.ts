import { createClerkSupabaseClient } from "./browser";
import type { SessionResource } from "@clerk/types";
import type { Book } from "./fetchBooks";

export interface CreateBookInput {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  subject: string;
  description?: string;
  year?: number;
  level?: string;
  type?: string;
  school?: string;
  location?: string;
  available?: boolean;
  has_pdf?: boolean;
}

export interface CreateBookResult {
  success: boolean;
  data?: Book;
  error?: string;
}

const REQUIRED_FIELDS: Array<keyof CreateBookInput> = ["title", "author"];

export async function createBook(
  input: CreateBookInput,
  session: SessionResource | null | undefined,
  activeOrgId?: string | null,
): Promise<CreateBookResult> {
  if (!session) {
    return {
      success: false,
      error: "Keine gültige Session - Anmeldung erforderlich",
    };
  }

  // Use explicit activeOrgId if provided, otherwise try session properties (though unreliable)
  // @ts-ignore
  const orgId = activeOrgId || session.orgId ||
    session.lastActiveOrganizationId;

  if (!orgId) {
    return {
      success: false,
      error:
        "Keine Schule ausgewählt. Bitte wählen Sie eine Schule (Organisation) aus.",
    };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = input[field];
    if (typeof value !== "string" || value.trim() === "") {
      return {
        success: false,
        error: `Feld "${field}" ist erforderlich`,
      };
    }
  }

  try {
    const supabase = createClerkSupabaseClient(session);
    const sessionUserId = session?.user?.id ?? null;
    const cleanIsbn = input.isbn.trim() || "Unbekannt";

    // 1. Check if Book exists in Global Catalog
    let globalBookId: string | null = null;

    // Only check by ISBN if it's a valid ISBN (not "Unbekannt") to avoid merging unknown books
    if (cleanIsbn !== "Unbekannt") {
      const { data: existingBook } = await supabase
        .from("global_books")
        .select("id")
        .eq("isbn", cleanIsbn)
        .single();

      if (existingBook) {
        globalBookId = existingBook.id;
      }
    }

    // 2. If not found (or no ISBN), create in Global Catalog
    if (!globalBookId) {
      const globalPayload = {
        title: input.title.trim(),
        author: input.author.trim(),
        isbn: cleanIsbn === "Unbekannt" ? null : cleanIsbn, // Unique constraint handles NULLs gracefully (multiple nulls allowed) or we use UUID for unknown?
        // Postgres UNIQUE allows multiple NULLs.
        publisher: input.publisher.trim() || "Unbekannt",
        subject: input.subject.trim() || "Unbekannt",
        description: input.description?.trim() || null,
        year: typeof input.year === "number" ? input.year : null,
        level: input.level?.trim() || null,
        type: input.type?.trim() || null,
      };

      const { data: newGlobalBook, error: globalError } = await supabase
        .from("global_books")
        .insert(globalPayload)
        .select("id")
        .single();

      if (globalError) {
        // Handle race condition: If inserted by someone else in the meantime
        if (globalError.code === "23505") { // Unique violation
          const { data: retryBook } = await supabase
            .from("global_books")
            .select("id")
            .eq("isbn", cleanIsbn)
            .single();
          if (retryBook) globalBookId = retryBook.id;
        } else {
          console.error("Fehler beim Erstellen des Global Book:", globalError);
          return {
            success: false,
            error: "Fehler beim Anlegen im globalen Katalog.",
          };
        }
      } else {
        globalBookId = newGlobalBook.id;
      }
    }

    if (!globalBookId) {
      return { success: false, error: "Konnte Buch-ID nicht auflösen." };
    }

    // 3. Create Entry in Organization Inventory
    const inventoryPayload = {
      organization_id: orgId,
      global_book_id: globalBookId,
      location: input.location?.trim() || null,
      available: input.available ?? true,
      has_pdf: input.has_pdf ?? false,
      user_id: sessionUserId,
    };

    const { data, error } = await supabase
      .from("organization_inventory")
      .insert(inventoryPayload)
      .select(`
        *,
        global_books (
          *
        )
      `)
      .single();

    if (error) {
      console.error("Fehler beim Erstellen des Inventar-Eintrags:", error);
      return {
        success: false,
        error: error.message || "Fehler beim Speichern im Schulinventar.",
      };
    }

    // Map back to Book interface format for frontend compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedBook: any = {
      ...data.global_books, // Spread global properties (title, author...)
      ...data, // Spread inventory properties (id, location...)
      id: data.id, // Ensure Inventory ID is the primary ID used for management
      global_id: data.global_book_id, // Keep ref if needed
    };

    return {
      success: true,
      data: mappedBook as Book,
    };
  } catch (err) {
    console.error("Unerwarteter Fehler in createBook:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}
