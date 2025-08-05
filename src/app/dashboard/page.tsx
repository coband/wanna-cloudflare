import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Dashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Willkommen in Ihrer<br />
              WANNA Lehrmittelbibliothek
            </h1>
            <p className="text-xl mb-8 text-indigo-100 max-w-3xl mx-auto">
              Entdecken Sie über 2000 Lehrmittel für alle Schulstufen und 
              Fachbereiche. Durchsuchen Sie unseren Katalog und finden 
              Sie die passenden Materialien für Ihren Unterricht.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/books"
                className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
              >
                Katalog durchsuchen
              </Link>
              <Link 
                href="/books"
                className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Alle Bücher anzeigen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik-Karten */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Gesamtbestand */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Gesamtbestand</div>
                <div className="text-3xl font-bold text-gray-900">2,347</div>
                <div className="text-sm text-green-600">+28% mit letztem Monat</div>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          {/* Neue Zugänge */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Neue Zugänge</div>
                <div className="text-3xl font-bold text-gray-900">124</div>
                <div className="text-sm text-green-600">+8% im Vergleich zum Vormonat</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Aktive Nutzer */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Aktive Nutzer</div>
                <div className="text-3xl font-bold text-gray-900">843</div>
                <div className="text-sm text-green-600">+5% mit letztem Semester</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Ausleihvorgänge */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Ausleihvorgänge</div>
                <div className="text-3xl font-bold text-gray-900">1,287</div>
                <div className="text-sm text-green-600">+12% im Vergleich zum Vorjahr</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neueste Lehrmittel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Neueste Lehrmittel</h2>
          <Link 
            href="/books" 
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Alle anzeigen →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Beispiel Lehrmittel-Karten */}
          {[
            {
              subject: 'Mathematik',
              level: 'Sekundarstufe I',
              title: 'Mathematik entdecken',
              author: 'Prof. Dr. Maria Schmidt',
              year: '2023',
              isNew: true
            },
            {
              subject: 'Deutsch',
              level: 'Grundschule',
              title: 'Deutsch als Zweitsprache',
              author: 'Dr. Thomas Müller',
              year: '2022',
              isNew: false
            },
            {
              subject: 'Naturwissenschaften',
              level: 'Sekundarstufe I',
              title: 'Biologie heute',
              author: 'Sarah Weber & Team',
              year: '2023',
              isNew: true
            },
            {
              subject: 'Fremdsprachen',
              level: 'Oberstufe',
              title: 'Französisch im Kontext',
              author: 'Sophie Dubois',
              year: '2023',
              isNew: true
            }
          ].map((book, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-500">{book.subject} • {book.level}</span>
                {book.isNew && (
                  <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                    Neu
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{book.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{book.author}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{book.year}</span>
                <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer">Details →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Beliebte Fachbereiche und Neuigkeiten */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Beliebte Fachbereiche */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Beliebte Fachbereiche</h2>
            <div className="space-y-4">
              {[
                { subject: 'Mathematik', count: '428 Lehrmittel' },
                { subject: 'Deutsch', count: '356 Lehrmittel' },
                { subject: 'Naturwissenschaften', count: '312 Lehrmittel' },
                { subject: 'Fremdsprachen', count: '287 Lehrmittel' },
                { subject: 'Gesellschaft', count: '245 Lehrmittel' }
              ].map((fach, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-900">{fach.subject}</span>
                  <span className="text-gray-600 text-sm">{fach.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neuigkeiten */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Neuigkeiten</h2>
            <div className="space-y-6">
              <article className="border-b border-gray-200 pb-4">
                <div className="text-xs text-gray-500 mb-2">16. Juni 2023</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Neue Mathematik-Lehrmittel für die Sekundarstufe I
                </h3>
                <p className="text-sm text-gray-600">
                  Wir haben 24 neue Mathematik-Lehrmittel für die Sekundarstufe I hinzugefügt...
                </p>
              </article>

              <article className="border-b border-gray-200 pb-4">
                <div className="text-xs text-gray-500 mb-2">12. Juni 2023</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Wartungsarbeiten am 20. Juni
                </h3>
                <p className="text-sm text-gray-600">
                  Die Bibliothek wird am 20. Juni von 18:00 bis 20:00 Uhr wegen Wartungsarbeiten nicht verfügbar sein.
                </p>
              </article>

              <article>
                <div className="text-xs text-gray-500 mb-2">8. Juni 2023</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Neue Filterfunktionen
                </h3>
                <p className="text-sm text-gray-600">
                  Wir haben neue Filterfunktionen hinzugefügt, um die Suche nach Lehrmitteln zu erleichtern.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}