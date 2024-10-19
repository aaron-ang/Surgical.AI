import Link from 'next/link'

export default function SelectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Selection Page</h1>
      <p className="mb-4">Make your selection here.</p>
      <Link href="/surgery" className="text-blue-500 hover:underline">
        Proceed to Surgery Page
      </Link>
    </div>
  )
}