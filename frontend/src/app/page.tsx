import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Our Service</h1>
      <p className="mb-4">This is the landing page for our application.</p>
      <Link href="/selection" className="text-blue-500 hover:underline">
        Go to Selection Page
      </Link>
    </div>
  )
}