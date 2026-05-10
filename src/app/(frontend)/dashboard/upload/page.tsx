'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

type Option = {
  id: string
  name: string
}

export default function UploadPage() {
  const { data: session, status } = useSession()

  const [grades, setGrades] = useState<Option[]>([])
  const [subjects, setSubjects] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)

  const [fileName, setFileName] = useState('')

  // 🔄 Fetch dropdown data
  useEffect(() => {
    async function fetchData() {
      const [gRes, sRes] = await Promise.all([
        fetch('/api/grades'),
        fetch('/api/subjects'),
      ])

      const gData = await gRes.json()
      const sData = await sRes.json()

      console.dir(gData.docs)
      console.dir(sData.docs)

      setGrades(gData.docs)
      setSubjects(sData.docs)
    }

    fetchData()
  }, [])

  if (status === 'loading') return <p>Loading...</p>

  if (!session) {
    return (
      <div style={styles.center}>
        <h2>Exam Upload System</h2>
        <button style={styles.primaryBtn} onClick={() => signIn('google')}>
          Sign in with Google
        </button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
  
    const form = e.currentTarget
  
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0]
  
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
      })
    )
  
    // Debug
    for (const [key, value] of payload.entries()) {
      console.log(key, value)
    }
  
    const res = await fetch('/api/upload-exam', {
      method: 'POST',
      body: payload,
    })
  
    setLoading(false)
  
    if (res.ok) {
      alert('Uploaded successfully!')
      form.reset()
      setFileName('')
    } else {
      const error = await res.text()
      console.log(error)
      alert('Upload failed')
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2>Upload Exam</h2>
          <p style={{ opacity: 0.7 }}>{session.user?.email}</p>
        </div>

        <button style={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
          Logout
        </button>
      </div>

      {/* Form Card */}
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>

          <input name="title" placeholder="Title (optional)" style={styles.input} /> 

          {/* Grade dropdown */}
          <select name="grade" required style={styles.input}>
            <option value="">Select Grade</option>
            {grades?.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Subject dropdown */}
          <select name="subject" required style={styles.input}>
            <option value="">Select Subject</option>
            {subjects?.map(s => (
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
          <input
            name="file"
            type="file"
            required
            style={styles.input}
            onChange={(e: any) => setFileName(e.target.files?.[0]?.name || '')}
          />

          {fileName && (
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Selected: {fileName}
            </p>
          )}

          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Uploading...' : 'Upload Exam'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: 30,
    maxWidth: 600,
    margin: '0 auto',
    fontFamily: 'Arial',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  card: {
    padding: 20,
    border: '1px solid #ddd',
    borderRadius: 10,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc',
    fontSize: 14,
  },

  primaryBtn: {
    padding: 12,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },

  logoutBtn: {
    padding: 8,
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },

  center: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
}

