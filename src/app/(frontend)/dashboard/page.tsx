'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Exam = {
  id: number
  title?: string
  label?: string
  driveUrl?: string | null;
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
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1>Exam Dashboard</h1>
          <p>{session?.user?.email}</p>
        </div>

        <button
          style={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <h2>{totalExams}</h2>
          <p>Total Exams</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/upload">
          <button style={styles.primaryBtn}>
            Upload New Exam
          </button>
        </Link>
      </div>

      {/* Recent uploads */}
      <div style={styles.card}>
        <h3>Recent Uploads</h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Grade</th>
              <th>Subject</th>
              <th>Label</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {recent.map((exam) => (
              <tr key={exam.id}>
                <td>
                  {exam.createdAt
                    ? new Date(exam.createdAt).toLocaleDateString()
                    : '-'}
                </td>

                <td>{exam.grade?.name || '-'}</td>
                <td>{exam.subject?.name || '-'}</td>
                <td>{exam.label || '-'}</td>
                <td>
                  {exam.driveUrl
                    ? <a href={exam.driveUrl} target="_blank">Link</a>
                    : '-'}
               </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles: any = {
  page: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: 30,
    fontFamily: 'Arial',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
    marginBottom: 30,
  },

  card: {
    border: '1px solid #ddd',
    borderRadius: 12,
    padding: 20,
    background: 'white',
    color: '#111',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  thtd: {
    padding: 12,
    borderBottom: '1px solid #eee',
    textAlign: 'left',
    color: '#111',
  },

  primaryBtn: {
    padding: '12px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },

  logoutBtn: {
    padding: '10px 16px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
}

