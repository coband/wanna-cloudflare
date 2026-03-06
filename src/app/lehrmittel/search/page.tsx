'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Search } from 'lucide-react';

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedQuery = localStorage.getItem('lehrmittelSearchQuery');
      const savedResult = localStorage.getItem('lehrmittelSearchResult');

      if (savedQuery) setQuery(savedQuery);
      if (savedResult) setResult(JSON.parse(savedResult));
    } catch (e) {
      console.error("Failed to load search state", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('lehrmittelSearchQuery', query);
    if (result) {
      localStorage.setItem('lehrmittelSearchResult', JSON.stringify(result));
    } else {
      localStorage.removeItem('lehrmittelSearchResult');
    }
  }, [query, result, isLoaded]);

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

      const data = await response.json() as { error?: string; data: SearchResult };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search');
      }

      setResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Z.B. Wo gibt es Aufgaben zum Thema Wasserkreislauf?"
            className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sucht...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Suchen</span>
              </>
            )}
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200"
          >
            {error}
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm mb-8 relative overflow-hidden"
          >
            {/* Background shimmer */}
            <motion.div
               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
               animate={{ x: ['-200%', '200%'] }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
            
            <div className="relative mb-6 z-10">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-400 rounded-full blur-xl"
              />
              <div className="relative bg-white p-4 rounded-full shadow-md border border-blue-50 text-blue-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
            
            <motion.div 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.2 }}
              className="text-center space-y-2 z-10"
            >
              <h3 className="text-xl font-medium text-gray-900 flex items-center gap-2 justify-center">
                <Sparkles className="w-5 h-5 text-blue-500" />
                KI analysiert Dokumente...
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Bitte habe einen Moment Geduld. Wir durchsuchen deine Lehrmittel nach der passenden Antwort.
              </p>
            </motion.div>
          </motion.div>
        )}

        {result && !isLoading && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hauptantwort */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-100 transition-colors">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
