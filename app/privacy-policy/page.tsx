import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | WealthClaude',
  description: 'Read the WealthClaude privacy policy.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: March 1, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">Information We Collect</h2>
        <p className="text-gray-400">
          We collect information you provide directly, such as your email address when you sign up,
          and usage data to improve the platform experience.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">How We Use Your Data</h2>
        <p className="text-gray-400">
          Your data is used solely to provide and improve WealthClaude services. We do not sell
          your personal information to third parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
        <p className="text-gray-400">
          For privacy concerns, contact us at{' '}
          <a href="mailto:privacy@wealthclaude.com" className="text-green-400 hover:underline">
            privacy@wealthclaude.com
          </a>
        </p>
      </section>
    </main>
  )
}
