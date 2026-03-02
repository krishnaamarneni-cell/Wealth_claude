import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

const jobs = [
  {
    id: 'seo-specialist',
    title: 'SEO Specialist',
    keywords: [
      'seo', 'search engine', 'keyword research', 'backlinks', 'google search console',
      'on-page', 'content strategy', 'rankings', 'organic', 'meta', 'analytics',
    ],
  },
  {
    id: 'backend-nodejs',
    title: 'Backend Developer (Node.js)',
    keywords: [
      'node', 'nodejs', 'node.js', 'typescript', 'javascript', 'rest api', 'api',
      'postgresql', 'supabase', 'backend', 'server', 'express', 'database', 'sql',
    ],
  },
  {
    id: 'ai-agent-specialist',
    title: 'AI Agent Specialist',
    keywords: [
      'ai', 'llm', 'openai', 'gpt', 'prompt', 'langchain', 'machine learning',
      'python', 'agent', 'automation', 'nlp', 'anthropic', 'fine-tuning', 'vector',
    ],
  },
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer and extract text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parsed = await pdfParse(buffer)
    const resumeText = parsed.text.toLowerCase()

    // Score each job based on keyword matches
    const scores = jobs.map((job) => {
      const matchedKeywords: string[] = []

      job.keywords.forEach((keyword) => {
        if (resumeText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
        }
      })

      const score = Math.round((matchedKeywords.length / job.keywords.length) * 100)

      return {
        id: job.id,
        title: job.title,
        score,
        matchedKeywords,
        totalKeywords: job.keywords.length,
      }
    })

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    const topMatch = scores[0]
    const hasMatch = topMatch.score > 0

    return NextResponse.json({
      success: true,
      topMatch: hasMatch ? topMatch : null,
      allMatches: scores,
      resumeWordCount: resumeText.split(' ').length,
    })
  } catch (err) {
    console.error('[match-resume]', err)
    return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 })
  }
}
