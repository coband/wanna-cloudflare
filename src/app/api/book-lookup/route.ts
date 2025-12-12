import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit } from "./middleware";

// Response interface matching our Book schema
export interface BookLookupResponse {
  success: boolean;
  data?: {
    title: string;
    author: string;
    isbn: string;
    publisher?: string;
    subject?: string;
    description?: string;
    year?: number;
    level?: string[];
    type?: string;
  };
  error?: string;
  /**
   * Optionale Links, die der Client als manuelle Fallback-Suche anzeigen kann
   * (z.B. Orell Füssli, Lernmedien-Shop).
   */
  fallbackUrls?: string[];
}

type BookData = NonNullable<BookLookupResponse["data"]>;

const MAX_GEMINI_ATTEMPTS = 2;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<BookLookupResponse>> {
  try {
    // Rate Limiting: Schützt vor Missbrauch
    const clientIp = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "60",
          },
        },
      );
    }

    const body = await request.json() as { query?: unknown; isbn?: unknown };
    // Support both 'query' (new generic search) and 'isbn' (legacy/specific)
    const query = (body.query || body.isbn) as string | undefined;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Suchbegriff ist erforderlich" },
        { status: 400 },
      );
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return NextResponse.json(
        { success: false, error: "API-Konfiguration fehlt" },
        { status: 500 },
      );
    }

    // Initialize Google GenAI with the new SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const model = "gemini-flash-latest";

    // Optimierter Prompt: Explizit die Nutzung der Suchergebnisse fordern
    const prompt =
      `Suche mit Google nach "${query}" und VERWENDE DIE GEFUNDENEN INFORMATIONEN um das folgende JSON auszufüllen.
Suche gezielt nach Buchinformationen (Titel, Autor, ISBN, Verlag, etc.).

WICHTIG: Extrahiere die Buchinformationen AUS DEN GOOGLE-SUCHERGEBNISSEN und fülle das JSON damit aus!

ZULÄSSIGE WERTE (bitte genau diese verwenden, wenn passend):
- Fächer: "Mathematik", "Deutsch", "Natur Mensch Gesellschaft", "Englisch", "Französisch", "Bildnerisches Gestalten", "Sport", "Textiles und Technisches Gestalten", "Musik", "Medien und Informatik", "Religion Kultur Ethik", "Divers".
- Medientypen: "Buch", "Lehrmittel", "Fachbuch", "Spiel", "Material", "Divers".
- Schulstufen: "Kindergarten", "1. Klasse", "2. Klasse", "3. Klasse", "4. Klasse", "5. Klasse", "6. Klasse", "7. Klasse", "8. Klasse", "9. Klasse", "Erwachsenenbildung".

Wähle für "Fach" und "Typ" den jeweils am besten passenden Begriff.
Wähle für "Stufe" ALLE passenden Stufen als Array. Wenn ein Buch für mehrere Klassen geeignet ist (z.B. 1.-3. Klasse), liste alle einzeln auf.

JSON-Format (EXAKT diese Feldnamen verwenden):
{
  "Titel": "HIER DEN GEFUNDENEN BUCHTITEL EINTRAGEN",
  "Autor": "HIER DEN GEFUNDENEN AUTOR EINTRAGEN",
  "ISBN": "HIER DIE GEFUNDENE ISBN EINTRAGEN (bevorzugt ISBN-13)",
  "Verlag": "HIER DEN GEFUNDENEN VERLAG EINTRAGEN",
  "Erscheinungsjahr": HIER DAS JAHR ALS ZAHL,
  "Stufe": ["Stufe 1", "Stufe 2"],
  "Fach": "Eines der zulässigen Fächer",
  "Typ": "Einer der zulässigen Medientypen",
  "Beschreibung": "Beschreibung aus Suchergebnissen"
}

ABLAUF:
1. Google-Suche nach "${query}"
2. Buchinformationen aus den Ergebnissen extrahieren. Nimm das relevanteste Buch, das zur Suche passt.
3. JSON ausfüllen mit den GEFUNDENEN Daten. Versuche Fach, Typ und Stufe den obigen Listen zuzuordnen.
4. Nur wenn wirklich nicht gefunden: null verwenden

BEISPIEL was du AUS den Suchergebnissen extrahieren sollst:
- Von Buchhändler-Seiten (Thalia, Amazon): Titel, Autor, Verlag, Jahr, ISBN
- Von Verlagsseiten: Beschreibung, Zielgruppe
- Von Bibliothekskatalogen: Schlagwörter, Kategorien

Gib NUR das ausgefüllte JSON zurück!`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const config = {
      temperature: 0, // maximal deterministisch
      thinkingConfig: {
        thinkingBudget: 0,
      },
      tools: [{ googleSearch: {} }],
    };

    console.log(`[Book Lookup] Searching for: ${query}`);

    let bookDataFromGemini: BookData | null = null;

    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
      console.log(
        `[Book Lookup] Gemini attempt ${attempt}/${MAX_GEMINI_ATTEMPTS} for: ${query}`,
      );

      // Generate content using the new API with Google Search
      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      // Collect all chunks
      let fullText = "";
      let finalUsageMetadata;

      for await (const chunk of response) {
        if (chunk.text) {
          fullText += chunk.text;
        }
        if (chunk.usageMetadata) {
          finalUsageMetadata = chunk.usageMetadata;
        }
      }

      if (finalUsageMetadata) {
        console.log(
          `[Book Lookup] Token Usage - Input: ${finalUsageMetadata.promptTokenCount}, Output: ${finalUsageMetadata.candidatesTokenCount}, Total: ${finalUsageMetadata.totalTokenCount}`,
        );
      }

      console.log("[Book Lookup] Received response stream");

      if (!fullText) {
        console.error("[Book Lookup] No text in response");
        // kein Sinn, weitere Versuche mit derselben Antwort zu machen
        break;
      }

      console.log("[Book Lookup] Raw response length:", fullText.length);
      // console.log('[Book Lookup] Raw response preview:', fullText.substring(0, 200))

      // Extract JSON from response (sometimes wrapped in markdown code blocks)
      let jsonText = fullText.trim();

      // Remove markdown code blocks
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      jsonText = jsonText.trim();

      // Prüfe, ob JSON vollständig ist (sollte mit } enden)
      if (!jsonText.endsWith("}")) {
        console.error(
          "[Book Lookup] Incomplete JSON detected - missing closing brace",
        );
        // console.error('[Book Lookup] Full text:', fullText)
        // Bei unvollständigem JSON einen weiteren Versuch wagen, falls verfügbar
        if (attempt < MAX_GEMINI_ATTEMPTS) {
          continue;
        }
        break;
      }

      try {
        const rawData = JSON.parse(jsonText);
        console.log("[Book Lookup] Successfully parsed JSON");

        // Parse levels: could be string or array
        let levels: string[] = [];
        const rawLevel = rawData.Stufe || rawData.level;
        if (Array.isArray(rawLevel)) {
          levels = rawLevel.map((l: unknown) => String(l));
        } else if (typeof rawLevel === "string") {
          levels = [rawLevel];
        }

        // Map deutsche Feldnamen zu englischen (flexibel für beide)
        const mappedBookData: BookData = {
          title: (rawData.Titel || rawData.title || "").trim(),
          author: (rawData.Autor || rawData.author || "Unbekannt").trim(),
          isbn: (rawData.ISBN || rawData.isbn || "Unbekannt").toString(),
          publisher: (rawData.Verlag || rawData.publisher || "Unbekannt")
            ?.toString(),
          subject: (rawData.Fach || rawData.subject || "Unbekannt")?.toString(),
          description:
            (rawData.Beschreibung || rawData.description || undefined)
              ?.toString(),
          year: (rawData.Erscheinungsjahr || rawData.year || undefined) as
            | number
            | undefined,
          level: levels.length > 0 ? levels : undefined,
          type: (rawData.Typ || rawData.type || undefined)?.toString(),
        };

        // Validate required fields - Title is strictly required
        if (!mappedBookData.title) {
          console.warn("[Book Lookup] Missing title from Gemini");
          // Noch ein Versuch, falls verfügbar
          if (attempt < MAX_GEMINI_ATTEMPTS) {
            continue;
          }
          break;
        }

        console.log("[Book Lookup] Mapped book data:", {
          title: mappedBookData.title,
          author: mappedBookData.author,
          isbn: mappedBookData.isbn,
        });

        bookDataFromGemini = mappedBookData;
        break;
      } catch (parseError) {
        console.error("[Book Lookup] JSON parse error:", parseError);
        console.error(
          "[Book Lookup] Failed to parse:",
          jsonText.substring(0, 500),
        );
        // Noch ein Versuch, falls verfügbar
        if (attempt < MAX_GEMINI_ATTEMPTS) {
          continue;
        }
        break;
      }
    }

    if (!bookDataFromGemini) {
      console.warn("[Book Lookup] No data from Gemini for query:", query);
      const fallbackUrls = [
        `https://www.orellfuessli.ch/suche?q=${encodeURIComponent(query)}`,
        // Lernmedien-Shop hat keine eindeutig dokumentierte Such-URL-Struktur,
        // daher verlinken wir auf die Startseite mit Hinweis auf manuelle Suche.
        "https://www.lernmedien-shop.ch/Home",
      ];

      return NextResponse.json({
        success: false,
        error:
          "Keine ausreichenden Buchinformationen gefunden (Titel fehlt). Bitte versuchen Sie es erneut oder suchen Sie manuell.",
        fallbackUrls,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: bookDataFromGemini,
      },
      {
        headers: {
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Book lookup error:", error);

    if (error instanceof Error) {
      // Handle rate limits or API errors
      if (
        error.message.includes("quota") || error.message.includes("rate limit")
      ) {
        return NextResponse.json({
          success: false,
          error: "API-Limit erreicht. Bitte versuchen Sie es später erneut.",
        });
      }

      return NextResponse.json({
        success: false,
        error: "Fehler bei der Buchabfrage: " + error.message,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Unbekannter Fehler bei der Buchabfrage",
    }, { status: 500 });
  }
}
