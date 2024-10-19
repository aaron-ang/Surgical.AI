import Link from 'next/link'

export default function SurgeryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Surgery Page</h1>
      <p className="mb-4">Information about the surgery.</p>
      <Link href="/" className="text-blue-500 hover:underline">
        Back to Home
      </Link>
    </div>
  )
}