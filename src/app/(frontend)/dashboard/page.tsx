'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Exam = {
  id: number
  title?: string
  label?: string
  driveUrl?: string | null
  year?: string
  createdAt?: string
  grade?: {
    name: string
  }
  subject?: {
    name: string
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [totalExams, setTotalExams] = useState(0)
  const [recent, setRecent] = useState<Exam[]>([])

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch('/api/dashboard')
      const data = await res.json()

      setTotalExams(data.totalExams)
      setRecent(data.recent)

      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (status === 'loading' || loading) {
    return <p style={{ padding: 30 }}>Loading...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header & Stats Inline */}
        <div style={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={styles.title}>Dashboard</h1>
              <span style={styles.totalBadge}>{totalExams} Exams</span>
            </div>
            <p style={styles.subtitle}>{session?.user?.email}</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/dashboard/upload">
              <button style={styles.primaryBtn}>+ Upload</button>
            </Link>
            <button style={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
              Logout
            </button>
          </div>
        </div>

        {/* Recent uploads Table */}
        <div style={styles.card}>
          <h3 style={styles.tableTitle}>Recently Uploaded</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Label</th>
                  <th style={styles.th}>Year</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((exam) => (
                  <tr key={exam.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{exam.grade?.name || '-'}</strong>
                    </td>
                    <td style={styles.td}>{exam.subject?.name || '-'}</td>
                    <td style={styles.td}>
                      {exam.label ? <span style={styles.badge}>{exam.label}</span> : '-'}
                    </td>
                    <td style={styles.td}>{exam.year}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {exam.driveUrl ? (
                        <a href={exam.driveUrl} target="_blank" style={styles.linkBtn}>
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: any = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px',
    fontFamily: '-apple-system, system-ui, sans-serif',
  },
  container: {
    maxWidth: 800, // Narrower container for a tighter look
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { margin: 0, fontSize: 32, fontWeight: 700, color: '#111827' },
  totalBadge: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  subtitle: { margin: 0, color: '#6b7280', fontSize: 13 },
  card: {
    background: 'white',
    borderRadius: 8,
    padding: '16px 20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  tableTitle: { marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#374151' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '10px 0',
    color: '#6b7280',
    fontSize: 11,
    textTransform: 'uppercase',
    borderBottom: '1px solid #f3f4f6',
  },
  td: { padding: '12px 0', fontSize: 14, color: '#374151', borderBottom: '1px solid #f3f4f6' },
  badge: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
  },
  linkBtn: { color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 13 },
  primaryBtn: {
    padding: '8px 14px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  logoutBtn: {
    padding: '8px 12px',
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
}
