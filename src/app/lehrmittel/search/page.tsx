'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface SearchSource {
  file_id: string;
  filename: string;
  score: number;
  content: { text: string }[];
}

interface SearchResult {
  response: string;
  data: SearchSource[];
}

export default function LehrmittelSearchPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/lehrmittel-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Lehrmittel KI-Suche</h1>
      <p className="mb-6 text-gray-600">
        Durchsuche deine Lehrmittel-Sammlung mit Cloudflare AutoRAG.
      </p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Z.B. Wo gibt es Aufgaben zum Thema Wasserkreislauf?"
            className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Suche...' : 'Suchen'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-8">
          {/* Hauptantwort */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> Antwort
            </h2>
            <div className="prose max-w-none text-gray-800 leading-relaxed">
              {result.response ? (
                <ReactMarkdown>{result.response}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">Keine direkte Antwort generiert.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
