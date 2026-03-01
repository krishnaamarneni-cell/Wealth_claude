import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | WealthClaude',
  description: 'Read the WealthClaude cookie policy.',
}

export default function CookiePolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: March 1, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">What Are Cookies</h2>
        <p className="text-gray-400">
          Cookies are small text files stored on your device to help us remember your preferences
          and improve your experience on WealthClaude.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">How We Use Cookies</h2>
        <p className="text-gray-400">
          We use essential cookies for authentication and session management, and optional analytics
          cookies to understand how users interact with our platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">Managing Cookies</h2>
        <p className="text-gray-400">
          You can disable cookies in your browser settings at any time, though some features of
          WealthClaude may not function correctly without them.
        </p>
      </section>
    </main>
  )
}
