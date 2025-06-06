import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="text-center space-y-8">
        <h1 className="text-4xl font-bold mb-8">
          Willkommen zu deiner Cloudflare + Next.js App!
        </h1>
        
        <SignedOut>
          <div className="space-y-4">
            <p className="text-lg text-gray-600">
              Du bist nicht angemeldet. Bitte melde dich an, um fortzufahren.
            </p>
            <SignInButton />
          </div>
        </SignedOut>

        <SignedIn>
          <div className="space-y-4">
            <p className="text-lg text-green-600">
              🎉 Erfolgreich angemeldet! Willkommen zurück!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <span>Du bist angemeldet als:</span>
              <UserButton />
            </div>
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Was als nächstes?</h2>
              <ul className="text-left space-y-2">
                <li>✅ Clerk Auth erfolgreich integriert</li>
                <li>✅ Custom Sign-In Page erstellt</li>
                <li>🚀 Bereit für die Entwicklung!</li>
              </ul>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
