import { UserButton } from '@clerk/nextjs';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-indigo-600">wanna Bibliothek</h1>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Willkommen zurück, {user?.firstName || 'User'}! 📚
          </h2>
          <p className="text-gray-600">
            Hier ist deine persönliche Bibliotheksübersicht.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Profil</h3>
                <p className="text-sm text-gray-600">Verwalte dein Konto</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">E-Mail:</span> {user?.emailAddresses[0]?.emailAddress}</p>
              <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
              <p><span className="font-medium">Mitglied seit:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : 'Vor kurzem'}</p>
            </div>
          </div>

          {/* Borrowed Books Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Ausgeliehene Bücher</h3>
                <p className="text-sm text-gray-600">Deine aktuellen Ausleihen</p>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-gray-800 mb-2">0</p>
              <p className="text-sm text-gray-600 mb-4">Bücher ausgeliehen</p>
              <button className="w-full py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors">
                Buch suchen
              </button>
            </div>
          </div>

          {/* Reading Progress Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Lesefortschritt</h3>
                <p className="text-sm text-gray-600">Deine Lesestatistiken</p>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-gray-800 mb-2">0</p>
              <p className="text-sm text-gray-600 mb-4">Bücher gelesen</p>
              <button className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors">
                Statistiken ansehen
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Letzte Aktivitäten</h3>
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500">Noch keine Aktivitäten</p>
            <p className="text-sm text-gray-400 mt-2">Deine Bibliotheksaktivitäten erscheinen hier, sobald du anfängst zu lesen</p>
          </div>
        </div>
      </main>
    </div>
  );
}