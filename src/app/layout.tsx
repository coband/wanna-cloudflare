import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WANNA Lehrmittelbibliothek",
  description: "Ihre digitale Lehrmittelbibliothek für alle Schulstufen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="de">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
        >
          <SignedIn>
            {/* Header mit Navigation */}
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  {/* Logo/Titel */}
                  <Link href="/dashboard" className="text-2xl font-bold text-gray-900 tracking-tight">
                    WANNA LEHRMITTELBIBLIOTHEK
                  </Link>
                  
                  {/* Navigation */}
                  <nav className="hidden md:flex space-x-8">
                    <Link 
                      href="/dashboard" 
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/books" 
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Katalog
                    </Link>
                    <Link 
                      href="/fachbereiche" 
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Fachbereiche
                    </Link>
                    <Link 
                      href="/neuerscheinungen" 
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Neuerscheinungen
                    </Link>
                  </nav>

                  {/* User Actions */}
                  <div className="flex items-center space-x-4">
                    {/* Anmelden Button */}
                    <button className="text-gray-700 hover:text-gray-900 text-sm font-medium">
                      Anmelden
                    </button>
                    {/* Suchicon */}
                    <button className="text-gray-700 hover:text-gray-900">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <UserButton />
                  </div>
                </div>
              </div>
            </header>
          </SignedIn>

          <SignedOut>
            {/* Einfacher Header für nicht-angemeldete Benutzer */}
            <header className="flex justify-between items-center p-4 gap-4 h-16 bg-white shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                WANNA LEHRMITTELBIBLIOTHEK
              </div>
              <div className="flex items-center gap-4">
                <SignInButton />
                <SignUpButton />
              </div>
            </header>
          </SignedOut>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
