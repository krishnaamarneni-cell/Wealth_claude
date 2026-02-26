import * as React from 'react'

interface WelcomeEmailProps {
  email: string
}

export function WelcomeEmail({ email }: WelcomeEmailProps) {
  return (
    <div style={{ backgroundColor: '#000', padding: '40px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#22c55e', fontSize: '32px' }}>WealthClaude ✅</h1>
      <p style={{ color: '#fff', fontSize: '18px' }}>
        Welcome! You are subscribed: <strong>{email}</strong>
      </p>
      <a href="https://wealthclaude.com/news"
        style={{
          background: '#22c55e', color: '#000', padding: '12px 24px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold'
        }}>
        Read Today's Brief →
      </a>
    </div>
  )
}
