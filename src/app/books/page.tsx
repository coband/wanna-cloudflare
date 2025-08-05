import BookListClient from '@/components/books/BookListClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Katalog - Lehrmittelbibliothek',
  description: 'Durchsuchen Sie unseren umfangreichen Katalog an Lehrmitteln für alle Schulstufen und Fachbereiche',
}

export default function BooksPage() {
  return (
    <BookListClient initialLimit={16} />
  )
} 