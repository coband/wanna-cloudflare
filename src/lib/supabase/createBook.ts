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
): Promise<CreateBookResult> {
  if (!session) {
    return {
      success: false,
      error: "Keine gültige Session - Anmeldung erforderlich",
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

    const payload = {
      title: input.title.trim(),
      author: input.author.trim(),
      isbn: input.isbn.trim() || "Unbekannt",
      publisher: input.publisher.trim() || "Unbekannt",
      subject: input.subject.trim() || "Unbekannt",
      description: input.description?.trim() || null,
      year: typeof input.year === "number" ? input.year : null,
      level: input.level?.trim() || null,
      type: input.type?.trim() || null,
      school: input.school?.trim() || null,
      location: input.location?.trim() || null,
      available: input.available ?? true,
      has_pdf: input.has_pdf ?? false,
      user_id: sessionUserId,
    };

    const { data, error } = await supabase
      .from("books")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Fehler beim Erstellen eines Buchs:", error);

      const message = error.code === "23505"
        ? "ISBN ist bereits vergeben"
        : error.message || "Unbekannter Fehler beim Speichern";

      return {
        success: false,
        error: message,
      };
    }

    return {
      success: true,
      data: data as unknown as Book,
    };
  } catch (err) {
    console.error("Unerwarteter Fehler in createBook:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}
