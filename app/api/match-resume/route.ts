import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const jobs = [
  {
    id: 'seo-specialist',
    title: 'SEO Specialist',
    keywords: [
      'seo',
      'search engine',
      'keyword research',
      'backlinks',
      'google search console',
      'on-page',
      'content strategy',
      'rankings',
      'organic',
      'meta',
      'analytics',
      'content',
      'blog',
      'writing',
      'marketing',
      'traffic',
    ],
  },
  {
    id: 'backend-nodejs',
    title: 'Backend Developer (Node.js)',
    keywords: [
      'node',
      'nodejs',
      'node.js',
      'typescript',
      'javascript',
      'rest api',
      'api',
      'postgresql',
      'supabase',
      'backend',
      'server',
      'express',
      'database',
      'sql',
      'next.js',
      'react',
      'web development',
      'developer',
      'software',
    ],
  },
  {
    id: 'ai-agent-specialist',
    title: 'AI Agent Specialist',
    keywords: [
      'ai',
      'llm',
      'openai',
      'gpt',
      'prompt',
      'langchain',
      'machine learning',
      'python',
      'agent',
      'automation',
      'nlp',
      'anthropic',
      'fine-tuning',
      'vector',
      'data science',
      'deep learning',
      'neural',
      'tensorflow',
      'pytorch',
    ],
  },
]

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    const parsed = await pdfParse(buffer)
    return parsed.text.toLowerCase()
  }

  if (ext === 'doc' || ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.toLowerCase()
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOC file.')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const resumeText = await extractText(buffer, file.name)

    if (!resumeText || resumeText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not read file content.' },
        { status: 400 }
      )
    }

    const scores = jobs.map((job) => {
      const matchedKeywords: string[] = []

      job.keywords.forEach((keyword) => {
        if (resumeText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
        }
      })

      const score = Math.round(
        (matchedKeywords.length / job.keywords.length) * 100
      )

      return {
        id: job.id,
        title: job.title,
        score,
        matchedKeywords,
        totalKeywords: job.keywords.length,
      }
    })

    scores.sort((a, b) => b.score - a.score)

    const topMatch = scores[0].score > 0 ? scores[0] : null

    return NextResponse.json({
      success: true,
      topMatch,
      allMatches: scores.map(({ id, title, score }) => ({ id, title, score })),
    })
  } catch (err: any) {
    console.error('[match-resume]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to process resume' },
      { status: 500 }
    )
  }
}
