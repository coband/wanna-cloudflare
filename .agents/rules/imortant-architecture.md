---
trigger: always_on
---

---
description: Custom System Prompt und Projektarchitektur für Antigravity AI
globs:
  - "**/*"
alwaysApply: true
---

# 🚀 Antigravity / Gemini KI Projektrichtlinien

Du bist **Antigravity** (oder eine andere KI, die dieses Projekt liest). Dies
sind die kritischen Projekt-Metadaten und Architekturbestimmungen für das
`wanna-cloudflare` Projekt. Beachte diese Richtlinien bei der Codeerstellung,
Refaktorisierung und Problemlösung strikt.

## 1. Cloudflare & OpenNext (Infrastruktur)

- **Deployment-Ziel**: Cloudflare Workers / Pages mit `@opennextjs/cloudflare`.
- **Kompatibilität**: Die Anwendung läuft am Edge! Nutze primär Web-Standards
  (`fetch`, `Headers`, `Response`, `URL`, `Crypto`). Keine reinen Node.js APIs
  (`fs`, `path`) verwenden, es sei denn sie sind durch das `nodejs_compat` Flag
  in der `wrangler.jsonc` erlaubt.
- **R2 Buckets**: Für Storage nutzen wir Cloudflare R2. Der Bucket
  `BOOK_MD_BUCKET` (Name: `extract-md`) wird in `wrangler.jsonc` gebunden und
  primär dazu verwendet, aus Buchsuchen konvertierte `.md`-Dateien zu speichern.
- **AI Binding**: Das Projekt hat ein Cloudflare AI Binding (`"binding": "AI"`).
  Für externe KI-Calls (Konvertierung, Lookup) greifen wir oft auf die Google
  GenAI SDK (`@google/genai`) zurück.
- **VERBOTEN**: Die Build-Mechanismen (`open-next.config.ts`, `next.config.ts`),
  Wrangler-Bindings (`wrangler.jsonc`) sowie das Middleware-Routing nicht
  ungefragt umstrukturieren!

## 2. Authentifizierung (Clerk 🤝 Supabase)

- **Native Integration**: Wir setzen **Clerk** für das Auth-Frontend und
  Session-Management ein und binden es **nativ** an **Supabase** (für die
  Datenbank/RLS) an.
- **Wichtigste Regel**: Der JWT von Clerk wird direkt an PostgREST/Supabase
  weitergereicht. Es gibt kein langes JWT-Template-Handling mehr.
- **DB Zugriffe**: RLS (Row Level Security) nutzt `auth.jwt()->>'sub'` als
  Benutzererkennung.
- **Clients verwenden**: Nutze _immer_ die bereits erstellten Hilfsfunktionen in
  `src/lib/supabase` anstatt Clients manuell zu bauen:
  - Client-Side: `createClerkSupabaseClient(session)`
  - Server-Side: `createClerkServerSupabaseClient()`

## 3. Datenbank (Supabase)

- Nutze `@supabase/ssr` und den `@supabase/supabase-js` Client für den
  Datenzugriff.
- Lade nicht die gesamte Datenbank auf einmal (z.B. in der `/books`-Liste
  Limitierungen & Pagination verwenden, um Cloudflare Egress kosten-optimiert zu
  halten).

## 4. Next.js 15 App Router Architektur

- **Server Components (Default)**: Schreibe standardmäßig asynchrone
  Server-Komponenten, welche die Daten direkt holen.
- **Client Components**: Nur mit `"use client"` markieren, wenn Interaktivität
  (Buttons, Forms, Hooks, Browser-APIs) erforderlich ist. Komponenten klein
  halten.
- **Server Actions**: Verwende `"use server"` für Mutationen (z.B. Bücher
  speichern, löschen). Immer strukturierte Antworten zurückgeben:
  `{ success: boolean, data?: any, error?: string }`.

## 5. UI, Styling & Besonderheiten

- **Tailwind CSS v4**: Das Projekt verwendet das neueste Tailwind CSS (V4).
  Utility-Classes schreiben, responsive bleiben.
- **Animationen**: `framer-motion` für weiche Übergänge verwenden. Icons via
  `lucide-react`.
- **Spezifische Features**:
  - Kamera-Scannen (Barcode) mit `@zxing/library`.
  - PDF Upload und AI-gestützte Markdown-Konvertierung vor dem Upload in R2.
  - Generisches Markdown Rendering mit `react-markdown`.

## Zusammenfassung Deiner Aufgabe:

Denke, bevor du Code ausgibst, immer an **Cloudflare Edge-Kompatibilität** und
daran, dass **Clerk + Supabase in der nativen Integration** arbeiten. Schätze
Bandbreite und Egress, und verwende die bereitgestellten `wanna-cloudflare`
Konfigurationen!
