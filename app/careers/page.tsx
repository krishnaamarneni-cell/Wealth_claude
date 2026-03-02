'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LineChart, ArrowLeft, Search, MapPin, Clock, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Footer } from '@/components/footer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const openings = [
  {
    id: 'seo-specialist',
    title: 'SEO Specialist',
    location: 'Remote',
    contract: 'Unpaid Internship',
    description:
      'Help grow WealthClaude\'s organic search presence. You will research keywords, optimize on-page content, build backlinks, and track rankings across our portfolio tracking and financial tools pages.',
    responsibilities: [
      'Research and implement high-value keywords for fintech audiences',
      'Optimize meta titles, descriptions, and on-page content',
      'Build and track backlinks to improve domain authority',
      'Monitor rankings using Google Search Console',
      'Write or edit SEO-optimized blog content for the news section',
    ],
    skills: ['Keyword Research', 'On-Page SEO', 'Google Search Console', 'Content Strategy'],
  },
  {
    id: 'backend-nodejs',
    title: 'Backend Developer (Node.js)',
    location: 'Remote',
    contract: 'Unpaid Internship',
    description:
      'Work on our backend APIs, data pipelines, and Supabase integrations. You will help build scalable endpoints for portfolio tracking, real-time market data, and user account management.',
    responsibilities: [
      'Build and maintain REST APIs using Node.js and TypeScript',
      'Integrate third-party financial data APIs (Polygon, Finnhub, FMP)',
      'Design and optimize PostgreSQL schemas in Supabase',
      'Implement authentication and authorization logic',
      'Write clean, documented, and testable backend code',
    ],
    skills: ['Node.js', 'TypeScript', 'REST APIs', 'PostgreSQL', 'Supabase'],
  },
  {
    id: 'ai-agent-specialist',
    title: 'AI Agent Specialist',
    location: 'Remote',
    contract: 'Unpaid Internship',
    description:
      'Build and fine-tune AI agents for financial analysis, portfolio insights, and automated reporting. Ideal for someone passionate about LLMs and applying AI to real-world fintech problems.',
    responsibilities: [
      'Design and build AI agents for portfolio analysis and market insights',
      'Engineer prompts for accurate and reliable financial outputs',
      'Integrate LLM APIs (OpenAI, Anthropic, or similar) into the platform',
      'Build automated financial reporting pipelines',
      'Research and apply latest AI agent frameworks',
    ],
    skills: ['LLMs', 'Prompt Engineering', 'Python or TypeScript', 'AI APIs', 'Financial Data'],
  },
]

export default function CareersPage() {
  const [titleSearch, setTitleSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchSuccess, setMatchSuccess] = useState(false)
  const [matchError, setMatchError] = useState('')

  const filtered = openings.filter((o) => {
    const matchTitle = o.title.toLowerCase().includes(titleSearch.toLowerCase())
    const matchLocation = o.location.toLowerCase().includes(locationSearch.toLowerCase())
    return matchTitle && matchLocation
  })

  const handleResumeMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeFile) {
      setMatchError('Please upload your resume.')
      return
    }
    setMatchLoading(true)
    setMatchError('')

    try {
      const fileName = `match-${Date.now()}-${resumeFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('applications')
        .insert({ name: 'Resume Match', email: 'pending', role: 'auto-match', resume_url: urlData.publicUrl })

      if (dbError) throw dbError

      setMatchSuccess(true)
      setResumeFile(null)
    } catch (err) {
      console.error(err)
      setMatchError('Upload failed. Please try again.')
    } finally {
      setMatchLoading(false)
    }
  }

  return (
    <>
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between bg-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">WealthClaude</span>
        </Link>
        <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">Careers at WealthClaude</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Join our remote team and build the future of personal finance. All positions are unpaid internships with real-world fintech experience.
          </p>
        </div>

        {/* Resume Match Banner */}
        <div className="border border-primary/30 rounded-xl p-6 bg-primary/5 mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-1">Upload Resume to Find a Match</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Not sure which role fits you? Upload your resume and we will match you to the best opening.
          </p>

          {matchSuccess ? (
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Resume received! We will review and reach out with the best match.</p>
            </div>
          ) : (
            <form onSubmit={handleResumeMatch} className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-3 flex-1 px-4 py-2 rounded-lg border border-dashed border-border bg-background hover:border-primary/50 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {resumeFile ? resumeFile.name : 'Upload your resume (PDF or DOC)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                type="submit"
                disabled={matchLoading}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
              >
                {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find My Match'}
              </button>
            </form>
          )}
          {matchError && <p className="text-red-500 text-sm mt-2">{matchError}</p>}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by job title..."
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by location..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Job Count */}
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-semibold text-foreground">Open Positions</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
            {filtered.length} {filtered.length === 1 ? 'opening' : 'openings'}
          </span>
        </div>

        {/* Job Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No positions found matching your search.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <Link
                key={job.id}
                href={`/careers/${job.id}`}
                className="block border border-border rounded-xl p-6 bg-card hover:border-primary/40 hover:bg-card/80 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Clock className="h-3 w-3" />
                        {job.contract}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium group-hover:bg-primary/90 transition-colors">
                      View Role →
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.skills.map((skill) => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                      {skill}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
