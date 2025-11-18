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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-3xl" />
        </div>

        <SignedOut>
          <div className="text-center max-w-4xl mx-auto space-y-12 z-10">
            {/* Logo/Brand */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-2xl mb-6">
                <span className="text-blue-600 font-medium px-4 py-1">Digitale Lehrmittelbibliothek</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
                WANNA
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-2">
                  Lehrmittelbibliothek
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Der moderne Zugang zu über 2000 Lehrmitteln. 
                Einfach, digital und immer verfügbar für Ihren Unterricht.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/sign-in" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
                  Anmelden
                </button>
              </Link>
              
              <Link href="/sign-up" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
                  Konto erstellen
                </button>
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 text-left">
              <div className="p-6 rounded-2xl bg-white/50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Umfangreich</h3>
                <p className="text-gray-600 text-sm">Zugriff auf tausende Lehrmittel für alle Schulstufen.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Durchsuchbar</h3>
                <p className="text-gray-600 text-sm">Intelligente Suche und Filter für schnelles Finden.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/50 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Geprüft</h3>
                <p className="text-gray-600 text-sm">Qualitätsgesicherte Inhalte für Ihren Unterricht.</p>
              </div>
            </div>
          </div>
        </SignedOut>
      </main>
      
      {/* Simple Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} WANNA Lehrmittelbibliothek</p>
      </footer>
    </div>
  );
}
