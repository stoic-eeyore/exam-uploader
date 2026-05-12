'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState, CSSProperties, useRef } from 'react'
import Link from 'next/link'

type Option = {
  id: string
  name: string
}

export default function UploadPage() {
  const { data: session } = useSession()

  const [grades, setGrades] = useState<Option[]>([])
  const [subjects, setSubjects] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [dropdownLoading, setDropdownLoading] = useState(true)
  const [fileName, setFileName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Function to trigger the toast and auto-hide it
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000) // Hide after 3 seconds
  }

  // 🔄 Fetch dropdown data
  useEffect(() => {
    async function fetchData() {
      try {
        const [gRes, sRes] = await Promise.all([fetch('/api/grades'), fetch('/api/subjects')])

        if (!gRes.ok || !sRes.ok) throw new Error('API Dataset failure')

        const gData = await gRes.json()
        const sData = await sRes.json()

        setGrades(gData.docs)
        setSubjects(sData.docs)
      } catch (err) {
        console.error('Dropdown error:', err)
        showToast('Failed to load form parameters', 'error')
      } finally {
        setDropdownLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const file = fileInputRef.current?.files?.[0]

    const grade = (form.elements.namedItem('grade') as HTMLSelectElement).value
    const subject = (form.elements.namedItem('subject') as HTMLSelectElement).value
    const label = (form.elements.namedItem('label') as HTMLInputElement).value
    const year = (form.elements.namedItem('year') as HTMLSelectElement).value
    const title = (form.elements.namedItem('title') as HTMLInputElement).value

    const payload = new FormData(form)

    // Append file
    if (file) {
      payload.append('file', file)
    }

    // Append metadata
    payload.append(
      '_payload',
      JSON.stringify({
        title,
        grade: Number(grade),
        subject: Number(subject),
        label,
        year,
      }),
    )

    const res = await fetch('/api/upload-exam', {
      method: 'POST',
      body: payload,
    })

    setLoading(false)

    if (res.ok) {
      showToast('Uploaded successfully!', 'success')
      form.reset()
      setFileName('')
    } else {
      const error = await res.text()
      console.log(error)
      showToast('Upload failed', 'error')
    }
  }

  return (
    <div style={styles.page}>
      {/* Top Header: Navigation & Auth */}
      <div style={styles.header}>
        <Link href="/dashboard" style={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <button style={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
          Logout
        </button>
      </div>

      {/* Header */}
      <div style={styles.titleSection}>
        <h2 style={styles.titleText}>Upload Exam</h2>
        <p style={styles.userEmail}>{session?.user?.email || '...'}</p>
      </div>

      {/* Form Card */}
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input name="title" type="hidden" placeholder="Title (optional)" style={styles.input} />

          {/* Grade dropdown */}
          <select name="grade" required style={styles.input} disabled={dropdownLoading}>
            <option value="">{dropdownLoading ? 'Loading grades...' : 'Select Grade'}</option>
            {grades?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Subject dropdown */}
          <select name="subject" required style={styles.input} disabled={dropdownLoading}>
            <option value="">{dropdownLoading ? 'Loading subjects...' : 'Select Subject'}</option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Label is now free text */}
          <input name="label" placeholder="Label (e.g. Formatif 1)" style={styles.input} />

          <select name="year" required style={styles.input}>
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
            <option value="2023/2024">2023/2024</option>
            <option value="2022/2023">2022/2023</option>
            <option value="2021/2022">2021/2022</option>
          </select>

          {/* File upload */}
          <div style={styles.fileBox} onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              required
              style={styles.input}
              onChange={(e: any) => setFileName(e.target.files?.[0]?.name || '')}
            />
            <span style={{ color: fileName ? '#000' : '#666' }}>
              {fileName || 'Click to select exam file (PDF/Doc)'}
            </span>
          </div>

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Uploading...' : 'Upload Exam'}
          </button>
        </form>
      </div>

      {toast && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  )
}

const styles: { [key: string]: CSSProperties } = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb', // Match dashboard bg
    padding: '20px 20px',
    maxWidth: 500,
    margin: '0 auto',
    fontFamily: '-apple-system, system-ui, sans-serif', // Match dashboard font
  },
  titleText: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 700,
    color: '#111827', // Dark Slate (nearly black) for visibility
    letterSpacing: '-0.02em',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backLink: {
    textDecoration: 'none',
    color: '#2563eb',
    fontSize: 13,
    fontWeight: 500,
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280', // Match dashboard subtitle color
    marginTop: 12,
  },
  titleSection: {
    marginBottom: 10,
  },
  card: {
    padding: 24,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  fileBox: {
    padding: '20px',
    border: '2px dashed #d1d5db',
    borderRadius: 8,
    textAlign: 'center' as 'center',
    cursor: 'pointer',
    fontSize: 14,
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.2s',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
  },
  primaryBtn: {
    padding: 12,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  logoutBtn: {
    padding: '6px 12px',
    background: 'transparent', // Match dashboard logout
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  center: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingOverlay: {
    position: 'absolute' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f9fafb', // Perfectly matches your background layout color
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 500,
  },
}
