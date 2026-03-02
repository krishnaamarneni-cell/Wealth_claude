'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, notFound } from 'next/navigation'
import { LineChart, ArrowLeft, MapPin, Clock, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Footer } from '@/components/footer'
import { openings } from '../page'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function JobPage() {
  const { id } = useParams()
  const job = openings.find((o) => o.id === id)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!job) return notFound()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !name || !email) {
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
        .insert({ name, email, role: job.id, resume_url: urlData.publicUrl })

      if (dbError) throw dbError

      setSuccess(true)
      setName('')
      setEmail('')
      setFile(null)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
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
        <Link href="/careers" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          All Positions
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">

        {/* Job Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">{job.title}</h1>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1 text-sm text-primary">
              <Clock className="h-4 w-4" />
              {job.contract}
            </span>
          </div>
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">About the Role</h2>
          <p className="text-muted-foreground">{job.description}</p>
        </section>

        {/* Responsibilities */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Responsibilities</h2>
          <ul className="space-y-2">
            {job.responsibilities.map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground text-sm">
                <span className="text-primary mt-1 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span key={skill} className="text-sm px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Application Form */}
        <div className="border border-border rounded-xl p-8 bg-card">
          <h2 className="text-xl font-semibold text-foreground mb-1">Apply for this Role</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Fill in your details and upload your resume to apply for {job.title}.
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

              {error && <p className="text-red-500 text-sm">{error}</p>}

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
