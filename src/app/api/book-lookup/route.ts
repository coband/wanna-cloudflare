import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { checkRateLimit } from './middleware'

// Response interface matching our Book schema
export interface BookLookupResponse {
  success: boolean
  data?: {
    title: string
    author: string
    isbn: string
    publisher?: string
    subject?: string
    description?: string
    year?: number
    level?: string
    type?: string
  }
  error?: string
  /**
   * Optionale Links, die der Client als manuelle Fallback-Suche anzeigen kann
   * (z.B. Orell Füssli, Lernmedien-Shop).
   */
  fallbackUrls?: string[]
}

type BookData = NonNullable<BookLookupResponse['data']>

const MAX_GEMINI_ATTEMPTS = 2

export const runtime = 'edge'

export async function POST(request: NextRequest): Promise<NextResponse<BookLookupResponse>> {
  try {
    // Rate Limiting: Schützt vor Missbrauch
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'anonymous'
    
    const rateLimitResult = checkRateLimit(clientIp)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '60'
          }
        }
      )
    }

    const body = await request.json() as { isbn?: unknown }
    const { isbn } = body

    if (!isbn || typeof isbn !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ISBN ist erforderlich' },
        { status: 400 }
      )
    }

    // Validate ISBN format (10 or 13 digits)
    const cleanIsbn = isbn.replace(/-/g, '')
    if (!/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
      return NextResponse.json(
        { success: false, error: 'Ungültiges ISBN-Format' },
        { status: 400 }
      )
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY not configured')
      return NextResponse.json(
        { success: false, error: 'API-Konfiguration fehlt' },
        { status: 500 }
      )
    }

    // Initialize Google GenAI with the new SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    })

    const model = 'gemini-3-pro-preview'

    // Optimierter Prompt: Explizit die Nutzung der Suchergebnisse fordern
    const prompt = `Suche mit Google nach der ISBN ${isbn} und VERWENDE DIE GEFUNDENEN INFORMATIONEN um das folgende JSON auszufüllen.

WICHTIG: Extrahiere die Buchinformationen AUS DEN GOOGLE-SUCHERGEBNISSEN und fülle das JSON damit aus!

JSON-Format (EXAKT diese Feldnamen verwenden):
{
  "Titel": "HIER DEN GEFUNDENEN BUCHTITEL EINTRAGEN",
  "Autor": "HIER DEN GEFUNDENEN AUTOR EINTRAGEN",
  "ISBN": "${isbn}",
  "Verlag": "HIER DEN GEFUNDENEN VERLAG EINTRAGEN",
  "Erscheinungsjahr": HIER DAS JAHR ALS ZAHL,
  "Stufe": "Schulstufe aus Suchergebnissen",
  "Fach": "Schulfach aus Suchergebnissen",
  "Typ": "Medientyp aus Suchergebnissen",
  "Beschreibung": "Beschreibung aus Suchergebnissen"
}

ABLAUF:
1. Google-Suche nach ISBN ${isbn}
2. Buchinformationen aus den Ergebnissen extrahieren
3. JSON ausfüllen mit den GEFUNDENEN Daten
4. Nur wenn wirklich nicht gefunden: null verwenden

BEISPIEL was du AUS den Suchergebnissen extrahieren sollst:
- Von Buchhändler-Seiten (Thalia, Amazon): Titel, Autor, Verlag, Jahr
- Von Verlagsseiten: Beschreibung, Zielgruppe
- Von Bibliothekskatalogen: Schlagwörter, Kategorien

Gib NUR das ausgefüllte JSON zurück!`

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ]

    const config = {
      temperature: 0, // maximal deterministisch
      topP: 0.9,
      topK: 32,
      maxOutputTokens: 2048, // Erhöht für vollständige JSON-Antworten
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      tools: [{ googleSearch: {} }],
    }

    console.log(`[Book Lookup] Searching for ISBN: ${isbn}`)

    let bookDataFromGemini: BookData | null = null

    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
      console.log(`[Book Lookup] Gemini attempt ${attempt}/${MAX_GEMINI_ATTEMPTS} for ISBN: ${isbn}`)

      // Generate content using the new API with Google Search
      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      })

      // Collect all chunks
      let fullText = ''
      for await (const chunk of response) {
        if (chunk.text) {
          fullText += chunk.text
        }
      }

      console.log('[Book Lookup] Received response stream')

      if (!fullText) {
        console.error('[Book Lookup] No text in response')
        // kein Sinn, weitere Versuche mit derselben Antwort zu machen
        break
      }

      console.log('[Book Lookup] Raw response length:', fullText.length)
      console.log('[Book Lookup] Raw response preview:', fullText.substring(0, 200))

      // Extract JSON from response (sometimes wrapped in markdown code blocks)
      let jsonText = fullText.trim()
      
      // Remove markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '')
      }
      
      jsonText = jsonText.trim()
      
      // Prüfe, ob JSON vollständig ist (sollte mit } enden)
      if (!jsonText.endsWith('}')) {
        console.error('[Book Lookup] Incomplete JSON detected - missing closing brace')
        console.error('[Book Lookup] Full text:', fullText)
        // Bei unvollständigem JSON einen weiteren Versuch wagen, falls verfügbar
        if (attempt < MAX_GEMINI_ATTEMPTS) {
          continue
        }
        break
      }

      try {
        const rawData = JSON.parse(jsonText)
        console.log('[Book Lookup] Successfully parsed JSON')
        
        // Map deutsche Feldnamen zu englischen (flexibel für beide)
        const mappedBookData: BookData = {
          title: (rawData.Titel || rawData.title || '').trim(),
          author: (rawData.Autor || rawData.author || '').trim(),
          isbn: (rawData.ISBN || rawData.isbn || isbn).toString(),
          publisher: (rawData.Verlag || rawData.publisher || undefined)?.toString(),
          subject: (rawData.Fach || rawData.subject || undefined)?.toString(),
          description: (rawData.Beschreibung || rawData.description || undefined)?.toString(),
          year: (rawData.Erscheinungsjahr || rawData.year || undefined) as number | undefined,
          level: (rawData.Stufe || rawData.level || undefined)?.toString(),
          type: (rawData.Typ || rawData.type || undefined)?.toString(),
        }

        const allNullishCoreFields =
          (rawData.Titel === null || typeof rawData.Titel === 'undefined') &&
          (rawData.Autor === null || typeof rawData.Autor === 'undefined')
        
        console.log('[Book Lookup] Mapped book data:', {
          title: mappedBookData.title,
          author: mappedBookData.author,
          hasPublisher: !!mappedBookData.publisher,
          hasSubject: !!mappedBookData.subject,
          allNullishCoreFields,
        })
        
        // Validate required fields
        if (!mappedBookData.title || !mappedBookData.author || allNullishCoreFields) {
          console.warn('[Book Lookup] Missing required fields from Gemini:', {
            hasTitle: !!mappedBookData.title,
            hasAuthor: !!mappedBookData.author,
            allNullishCoreFields,
          })
          // Noch ein Versuch, falls verfügbar
          if (attempt < MAX_GEMINI_ATTEMPTS) {
            continue
          }
          break
        }

        // Ensure ISBN is included (bereits oben gesetzt, hier nur sicherstellen)
        mappedBookData.isbn = isbn

        console.log('[Book Lookup] Success! Book found via Gemini:', mappedBookData.title)
        bookDataFromGemini = mappedBookData
        break
      } catch (parseError) {
        console.error('[Book Lookup] JSON parse error:', parseError)
        console.error('[Book Lookup] Failed to parse:', jsonText.substring(0, 500))
        // Noch ein Versuch, falls verfügbar
        if (attempt < MAX_GEMINI_ATTEMPTS) {
          continue
        }
        break
      }
    }

    if (!bookDataFromGemini) {
      console.warn('[Book Lookup] No data from Gemini for ISBN:', isbn)
      const fallbackUrls = [
        `https://www.orellfuessli.ch/suche?q=${encodeURIComponent(isbn)}`,
        // Lernmedien-Shop hat keine eindeutig dokumentierte Such-URL-Struktur,
        // daher verlinken wir auf die Startseite mit Hinweis auf manuelle Suche.
        'https://www.lernmedien-shop.ch/Home',
      ]

      return NextResponse.json({
        success: false,
        error:
          'Keine ausreichenden Buchinformationen gefunden. Bitte versuchen Sie es erneut oder suchen Sie direkt bei Orell Füssli oder im Lernmedien-Shop.',
        fallbackUrls,
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: bookDataFromGemini,
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Book lookup error:', error)
    
    if (error instanceof Error) {
      // Handle rate limits or API errors
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'API-Limit erreicht. Bitte versuchen Sie es später erneut.'
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Fehler bei der Buchabfrage: ' + error.message
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unbekannter Fehler bei der Buchabfrage'
    }, { status: 500 })
  }
}

