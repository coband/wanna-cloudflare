import { createBrowserClient } from '@supabase/ssr'
import type { SessionResource } from '@clerk/types'

// Standard Supabase Browser Client für SSR
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Clerk-authentifizierter Supabase Client (native Integration)
export const createClerkSupabaseClient = (session: SessionResource | null | undefined) =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => session?.getToken() ?? null,
    }
  )

// Backwards compatibility
export const supabaseBrowser = createClient
