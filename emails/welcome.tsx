import * as React from 'react'

interface WelcomeEmailProps {
  email: string
}

export function WelcomeEmail({ email }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#0a0a0a', color: '#ffffff', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#22c55e', fontSize: '28px', margin: '0' }}>WealthClaude</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '8px 0 0' }}>Daily Market Intelligence</p>
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', marginTop: '0' }}>You're in! 🎯</h2>
        <p style={{ color: '#aaa', lineHeight: '1.6' }}>
          Every morning at <strong style={{ color: '#fff' }}>7AM EST</strong> you'll get:
        </p>
        <ul style={{ color: '#aaa', lineHeight: '2' }}>
          <li>📈 Top market movers</li>
          <li>🤖 AI-powered stock analysis</li>
          <li>💡 Actionable trade insights</li>
        </ul>
        <a href="https://wealthclaude.com/news"
          style={{ display: 'inline-block', backgroundColor: '#22c55e', color: '#000', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginTop: '16px' }}>
          Read Today's Analysis →
        </a>
      </div>

      {/* Footer */}
      <p style={{ color: '#444', fontSize: '12px', textAlign: 'center' }}>
        WealthClaude · <a href="https://wealthclaude.com" style={{ color: '#444' }}>wealthclaude.com</a>
      </p>
    </div>
  )
}
