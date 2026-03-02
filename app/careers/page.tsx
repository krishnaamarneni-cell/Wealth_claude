'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LineChart, ArrowLeft, Upload, CheckCircle, Loader2, MapPin, Clock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Footer } from '@/components/footer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const openings = [
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
      'Monitor rankings using Google Search Console and analytics tools',
      'Write or edit SEO-optimized blog content for the news section',
    ],
    skills: ['Keyword Research', 'On-Page SEO', 'Google Search Console', 'Content Strategy'],
  },
  {
    id: 'backend-nodejs',
    title: 'Backend Developer',
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
      'Build automated financial reporting and summarization pipelines',
      'Research and apply latest AI agent frameworks and tools',
    ],
    skills: ['LLMs', 'Prompt Engineering', 'Python or TypeScript', 'AI APIs', 'Financial Data'],
  },
]

export default function CareersPage() {
  const [selectedRole, setSelectedRole] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleApply = (roleId: string) => {
    setSelectedRole(roleId)
    setSuccess(false)
    setError('')
    setTimeout(() => {
      document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name || !email || !selectedRole) {
      setError('Please fill in all fields and attach your resume.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('applications')
        .insert({ name, email, role: selectedRole, resume_url: urlData.publicUrl })

      if (dbError) throw dbError

      setSuccess(true)
      setName('')
      setEmail('')
      setFile(null)
      setSelectedRole('')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedOpening = openings.find((o) => o.id === selectedRole)

  return (
    <>
      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between bg-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LineChart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">WealthClaude</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Careers</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            We are a small but fast-moving team building the future of personal finance.
            Join us remotely and gain real-world fintech experience.
          </p>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold text-foreground">Open Positions</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              {openings.length} openings
            </span>
          </div>

          <div className="space-y-5">
            {openings.map((opening) => (
              <div
                key={opening.id}
                className="border border-border rounded-xl p-6 bg-card hover:border-primary/40 transition-colors"
              >
                {/* Job Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{opening.title}</h3>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {opening.location}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Clock className="h-3 w-3" />
                        {opening.contract}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(opening.id)}
                    className="shrink-0 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Apply Now
                  </button>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4">{opening.description}</p>

                {/* Responsibilities */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Responsibilities
                  </p>
                  <ul className="space-y-1">
                    {opening.responsibilities.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {opening.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div id="apply-form" className="border border-border rounded-xl p-8 bg-card">
          <h2 className="text-xl font-semibold text-foreground mb-1">Submit Your Application</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {selectedOpening
              ? `Applying for: ${selectedOpening.title}`
              : 'Select a position above or choose one below.'}
          </p>

          {success ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle className="h-5 w-5 text-primary" />
              <p className="text-primary font-medium">
                Application submitted! We will review it and be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Position</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a role</option>
                  {openings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Resume (PDF or DOC)
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border bg-background hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {file ? file.name : 'Click to upload your resume'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </label>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
