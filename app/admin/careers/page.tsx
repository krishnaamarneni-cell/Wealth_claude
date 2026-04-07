'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, RefreshCw, MapPin, Clock } from 'lucide-react'

interface Job {
  id: string
  title: string
  location: string
  contract: string
  description: string
  responsibilities: string[]
  skills: string[]
  status: string
  created_at: string
}

const EMPTY_JOB = {
  title: '',
  location: 'Remote',
  contract: 'Unpaid Internship',
  description: '',
  responsibilities: [''],
  skills: [''],
  status: 'active',
}

export default function CareersAdmin() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_JOB)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/jobs')
      if (res.ok) setJobs(await res.json())
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch jobs' })
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setForm(EMPTY_JOB)
    setEditingId(null)
    setShowForm(true)
    setMessage(null)
  }

  function openEdit(job: Job) {
    setForm({
      title: job.title,
      location: job.location,
      contract: job.contract,
      description: job.description,
      responsibilities: job.responsibilities.length > 0 ? job.responsibilities : [''],
      skills: job.skills.length > 0 ? job.skills : [''],
      status: job.status,
    })
    setEditingId(job.id)
    setShowForm(true)
    setMessage(null)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: 'Job title is required' })
      return
    }

    setSaving(true)
    setMessage(null)

    const payload = {
      ...form,
      responsibilities: form.responsibilities.filter((r) => r.trim()),
      skills: form.skills.filter((s) => s.trim()),
    }

    try {
      const url = editingId ? `/api/admin/jobs/${editingId}` : '/api/admin/jobs'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: editingId ? 'Job updated!' : 'Job created!' })
        setShowForm(false)
        fetchJobs()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save job' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job posting?')) return
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Job deleted' })
        fetchJobs()
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete' })
    }
  }

  function updateListItem(field: 'responsibilities' | 'skills', index: number, value: string) {
    setForm((prev) => {
      const list = [...prev[field]]
      list[index] = value
      return { ...prev, [field]: list }
    })
  }

  function addListItem(field: 'responsibilities' | 'skills') {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  function removeListItem(field: 'responsibilities' | 'skills', index: number) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    draft: 'bg-yellow-500/10 text-yellow-500',
    closed: 'bg-red-500/10 text-red-500',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Careers</h1>
          <p className="text-muted-foreground text-sm">Manage job postings on wealthclaude.com/careers</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Job
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/20 text-green-500'
            : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Job' : 'New Job'}</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Job Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., SEO Specialist"
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Remote"
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Contract Type</label>
              <input
                type="text"
                value={form.contract}
                onChange={(e) => setForm({ ...form, contract: e.target.value })}
                placeholder="Unpaid Internship"
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Job description..."
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Responsibilities</label>
            {form.responsibilities.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem('responsibilities', i, e.target.value)}
                  placeholder="Responsibility..."
                  className="flex-1 px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                {form.responsibilities.length > 1 && (
                  <button onClick={() => removeListItem('responsibilities', i)} className="text-red-500 hover:text-red-400 px-2">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addListItem('responsibilities')} className="text-sm text-primary hover:underline">
              + Add responsibility
            </button>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Required Skills</label>
            {form.skills.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem('skills', i, e.target.value)}
                  placeholder="Skill..."
                  className="flex-1 px-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                {form.skills.length > 1 && (
                  <button onClick={() => removeListItem('skills', i)} className="text-red-500 hover:text-red-400 px-2">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addListItem('skills')} className="text-sm text-primary hover:underline">
              + Add skill
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {saving ? 'Saving...' : editingId ? 'Update Job' : 'Create Job'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border bg-card">
          <p className="text-muted-foreground mb-2">No job postings yet</p>
          <button onClick={openNew} className="text-primary hover:underline text-sm">
            Create your first job posting
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status] || ''}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.contract}</span>
                  </div>
                  {job.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.description}</p>
                  )}
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openEdit(job)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
