// =============================================================================
// Assessment Layout
// Path: src/app/assessment/layout.tsx
// =============================================================================

import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Financial Assessment | WealthClaude',
  description: 'Take our comprehensive financial health assessment and get a personalized action plan.',
};

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-gray-900">WealthClaude</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link 
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      {children}
    </div>
  );
}
