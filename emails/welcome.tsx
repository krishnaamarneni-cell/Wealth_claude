import * as React from 'react'

interface WelcomeEmailProps {
  email: string
}

export function WelcomeEmail({ email }: WelcomeEmailProps) {
  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: '600px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: '#ffffff',
      padding: '40px 24px'
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          padding: '16px 32px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '900',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255,255,255,0.5)'
          }}>
            WealthClaude
          </h1>
        </div>
        <p style={{
          color: '#94a3b8',
          fontSize: '16px',
          margin: '12px 0 0',
          fontWeight: '500'
        }}>
          AI-Powered Market Intelligence
        </p>
      </div>

      {/* Welcome Card */}
      <div style={{
        background: 'rgba(34, 197, 94, 0.08)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '24px',
        padding: '40px',
        marginBottom: '32px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)'
          }}>
            <span style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#000'
            }}>🎯</span>
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '900',
            color: '#ffffff',
            margin: '0 0 12px',
            lineHeight: '1.2'
          }}>
            You're In!
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#e2e8f0',
            margin: 0,
            fontWeight: '500'
          }}>
            Welcome to the future of market intelligence
          </p>
        </div>

        {/* What you'll get */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            lineHeight: '1.7',
            marginBottom: '32px'
          }}>
            Every morning at <strong style={{ color: '#22c55e', fontSize: '18px' }}>7AM EST</strong>,
            you'll receive our AI-powered daily brief covering:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[
              { icon: '📈', title: 'Top Market Movers' },
              { icon: '🤖', title: 'AI Stock Analysis' },
              { icon: '💡', title: 'Actionable Insights' },
              { icon: '⚡', title: 'Real-Time Alerts' }
            ].map(({ icon, title }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{title}</div>
              </div>
            ))}
          </div>

          <a href="https://wealthclaude.com/news" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#000000',
            padding: '16px 40px',
            borderRadius: '16px',
            textDecoration: 'none',
            fontWeight: '800',
            fontSize: '16px',
            boxShadow: '0 10px 30px rgba(34, 197, 94, 0.4)',
            transition: 'all 0.3s ease'
          }}>
            Read Today's Brief →
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        paddingTop: '32px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '14px',
        color: '#64748b'
      }}>
        <p style={{ margin: '0 0 8px' }}>
          WealthClaude · <a href="https://wealthclaude.com" style={{ color: '#94a3b8', textDecoration: 'none' }}>wealthclaude.com</a>
        </p>
        <p style={{ margin: 0, fontSize: '12px' }}>
          You're receiving this because you subscribed.
          <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Unsubscribe</a> anytime.
        </p>
      </div>
    </div>
  )
}
