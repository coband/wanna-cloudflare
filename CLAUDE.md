# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 15 application for "WANNA Lehrmittelbibliothek" (educational materials library) deployed on Cloudflare Workers using OpenNext.js. The app uses Clerk for authentication, Supabase for data storage, and TailwindCSS for styling.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Build for Cloudflare deployment  
npm run build:cloudflare

# Deploy to Cloudflare
npm run deploy

# Preview Cloudflare build locally
npm run preview

# Lint code
npm run lint

# Generate Cloudflare types
npm run cf-typegen
```

## Architecture

### Core Stack
- **Next.js 15** with App Router and React 19
- **Cloudflare Workers** deployment via `@opennextjs/cloudflare`
- **Clerk** for authentication and user management
- **Supabase** for database and backend services
- **TailwindCSS v4** for styling
- **TypeScript** for type safety

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard page
│   ├── books/              # Book catalog page
│   ├── sign-in/[[...sign-in]]/ # Clerk sign-in
│   ├── sign-up/[[...sign-up]]/ # Clerk sign-up
│   └── layout.tsx          # Root layout with Clerk provider and navigation
├── components/
│   └── books/              # Book-related components
├── lib/
│   └── supabase/           # Supabase client utilities
└── middleware.ts           # Next.js middleware
```

### Authentication Flow
- Uses Clerk for authentication with German language UI
- Protected routes require authentication
- Navigation adapts based on auth state (SignedIn/SignedOut)
- User management handled through Clerk components

### Data Layer
- Supabase integration with separate browser/server clients
- Book management with CRUD operations
- Environment-specific database configurations

### Deployment
- Cloudflare Workers via OpenNext.js adapter
- Static assets served from Cloudflare
- Environment variables configured in `wrangler.jsonc`
- Production Clerk keys configured for Cloudflare domain

## Development Guidelines (from Cursor rules)

### Next.js Patterns
- Default to Server Components, use `"use client"` for client components
- Use async Server Components for data fetching
- Always type component props
- Follow App Router file conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Server Actions
- Use `"use server"` directive
- Return structured results: `{ success, data?, error? }`

### Data Fetching Strategy
- Server Components: initial data loading
- Client Components: interactive/real-time updates
- Use appropriate Supabase clients (browser vs server)

## Environment Configuration

Development uses `.env.local` and `.dev.vars` for local secrets. Production configuration is in `wrangler.jsonc` with Clerk and Supabase environment variables.

The app supports both local development and Cloudflare Workers deployment with proper environment separation.