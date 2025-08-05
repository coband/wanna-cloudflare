import Link from 'next/link';
import { SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();
  
  if (userId) {
    redirect('/dashboard');
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <SignedOut>
        <main className="text-center space-y-12 px-8">
          {/* Logo/Brand */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-bold text-indigo-600 tracking-tight">
              WANNA
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
              Lehrmittelbibliothek
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Entdecken Sie über 2000 Lehrmittel für alle Schulstufen und Fachbereiche. 
              Moderne digitale Bibliothek mit umfassenden Lernmaterialien - 
              jederzeit und überall verfügbar für Lehrkräfte und Schüler.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto my-16">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Umfangreicher Katalog</h3>
              <p className="text-gray-600">Über 2000 Lehrmittel aus allen Fachbereichen und Schulstufen</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Qualitätsgeprüft</h3>
              <p className="text-gray-600">Alle Materialien werden von Fachexperten geprüft und bewertet</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Einfache Suche</h3>
              <p className="text-gray-600">Intelligente Suchfunktion mit Filtern nach Fach, Stufe und mehr</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto my-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">2,347</div>
                <div className="text-gray-600">Lehrmittel im Katalog</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">843</div>
                <div className="text-gray-600">Aktive Nutzer</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">1,287</div>
                <div className="text-gray-600">Ausleihvorgänge</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/sign-in">
              <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105">
                Zur Bibliothek
              </button>
            </Link>
            
            <Link href="/sign-up">
              <button className="w-full sm:w-auto px-8 py-4 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105">
                Registrieren
              </button>
            </Link>
          </div>

          {/* Tagline */}
          <div className="mt-16">
            <p className="text-sm text-gray-500">
              WANNA Lehrmittelbibliothek - Moderne Lernmaterialien für zeitgemäßen Unterricht
            </p>
          </div>
        </main>
      </SignedOut>
    </div>
  );
}
