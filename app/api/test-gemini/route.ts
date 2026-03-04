import { NextResponse } from 'next/server'

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY

  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not found in env vars' }, { status: 500 })
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello in one word' }] }],
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: 'Gemini failed', status: res.status, details: data }, { status: 502 })
  }

  return NextResponse.json({ success: true, response: data.candidates?.[0]?.content?.parts?.[0]?.text })
}
