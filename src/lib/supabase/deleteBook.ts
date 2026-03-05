import { createClerkSupabaseClient } from "./browser";
import type { SessionResource } from "@clerk/types";

// Interface für das Löschen eines Buchs
export interface DeleteBookResult {
  success: boolean;
  error?: string;
}

// Hauptfunktion zum Löschen eines einzelnen Buchs
export async function deleteBook(
  bookId: string,
  session: SessionResource | null | undefined,
): Promise<DeleteBookResult> {
  // Auth-Prüfung am Anfang
  if (!session) {
    return {
      success: false,
      error: "Keine gültige Session - Anmeldung erforderlich",
    };
  }

  // Validierung der bookId
  if (!bookId || bookId.trim() === "") {
    return {
      success: false,
      error: "Ungültige Buch-ID - ID ist erforderlich",
    };
  }

  try {
    const supabase = createClerkSupabaseClient(session);

    // Überprüfen ob das Buch existiert und dem User gehört (sowie Titel und ISBN für das Löschen des MD-Files laden)
    const { data: existingBook, error: fetchError } = await supabase
      .from("organization_inventory")
      .select("id, location, global_books(title, isbn)")
      .eq("id", bookId)
      .single();

    if (fetchError) {
      console.error("Fehler beim Überprüfen des Buchs:", fetchError);
      return {
        success: false,
        error: "Buch nicht gefunden oder nicht zugänglich",
      };
    }

    if (!existingBook) {
      return {
        success: false,
        error: "Buch mit dieser ID existiert nicht",
      };
    }

    // Buch aus der Datenbank löschen
    const { error: deleteError } = await supabase
      .from("organization_inventory")
      .delete()
      .eq("id", bookId);

    if (deleteError) {
      console.error("Fehler beim Löschen des Buchs:", deleteError);
      throw new Error(`Supabase Fehler: ${deleteError.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalBook = existingBook.global_books as any;
    const title = globalBook?.title || "Unbekannter Titel";
    const isbn = globalBook?.isbn;

    console.log(`Buch erfolgreich gelöscht: ${title} (ID: ${bookId})`);

    // Asynchroner Aufruf zum Löschen des Markdown-Files im R2 Bucket
    try {
      if (title && title !== "Unbekannter Titel") {
        const url = new URL(window.location.href);
        const protocol = url.protocol || "http:";
        const host = url.host || "localhost:3000";

        await fetch(`${protocol}//${host}/api/delete-book-md`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            isbn,
          }),
        });
        console.log(`Löschanfrage für Markdown-File von "${title}" versendet.`);
      }
    } catch (r2Error) {
      // Wir werfen hier keinen Fehler, da das Buch in der Datenbank bereits erfolgreich gelöscht wurde.
      console.error(
        "Fehler beim Löschen des Markdown-Files im R2 Bucket:",
        r2Error,
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unerwarteter Fehler in deleteBook:", error);
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Unbekannter Fehler beim Löschen",
    };
  }
}
