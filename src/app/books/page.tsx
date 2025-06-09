import BookListClient from '@/components/books/BookListClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bücher - Bibliothek',
  description: 'Entdecken Sie unsere umfangreiche Sammlung von Büchern',
}

export default function BooksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <BookListClient initialLimit={16} />
    </main>
  )
} 