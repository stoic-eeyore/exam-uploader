'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

type Exam = {
  id: number
  title?: string
  label?: string
  driveUrl?: string | null
  aiAnalysis?: string | null
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
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [showDevColumn, setShowDevColumn] = useState(false)
  const inputSequence = useRef<string[]>([])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Capture the pressed key
      inputSequence.current.push(e.key.toLowerCase())

      // 2. Keep only the last 3 keystrokes (matching the length of "dev")
      if (inputSequence.current.length > 3) {
        inputSequence.current.shift()
      }

      // 3. Check if the string matches the secret code
      const currentCode = inputSequence.current.join('')
      if (currentCode === 'zyx') {
        setShowDevColumn((prev) => !prev) // Toggle visibility
        console.log('🚧 Developer mode toggled:', !showDevColumn)
        inputSequence.current = [] // Clear array
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDevColumn])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header & Stats Inline */}
        <div style={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={styles.title}>Dashboard</h1>
              <span style={styles.totalBadge}>{loading ? '...' : `${totalExams} Exams`}</span>
            </div>
            <p style={styles.subtitle}>{session?.user?.email || '...'}</p>
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
                  {showDevColumn && <th style={styles.th}>AI</th>}
                  <th style={{ ...styles.th, textAlign: 'right' }}>File</th>
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
                    {showDevColumn && (
                      <td style={styles.td}>
                        {exam.aiAnalysis ? (
                          // Show link if analysis exists
                          <button
                            onClick={() => {
                              console.log('bakeko')
                              console.log(exam.aiAnalysis)
                              setSelectedAnalysis(exam.aiAnalysis ?? null)
                            }}
                            style={styles.viewLink}
                          >
                            View Analysis
                          </button>
                        ) : (
                          <button
                            disabled={analyzingId === exam.id}
                            style={{
                              ...styles.aiBtn,
                              ...(analyzingId === exam.id ? styles.aiBtnLoading : {}),
                            }}
                            onClick={async () => {
                              setAnalyzingId(exam.id)
                              try {
                                const res = await fetch('/api/analyze-exam', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ examId: exam.id }),
                                })
                                const data = await res.json()
                              } finally {
                                setAnalyzingId(null)
                              }
                            }}
                          >
                            {analyzingId === exam.id ? '...' : '✨ Analyze'}
                          </button>
                        )}
                      </td>
                    )}
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
          {selectedAnalysis && (
            <div style={styles.modalOverlay} onClick={() => setSelectedAnalysis(null)}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0 }}>AI Analysis Results</h2>
                  <button onClick={() => setSelectedAnalysis(null)} style={styles.closeBtn}>
                    ✕
                  </button>
                </div>
                <div style={styles.modalBody}>{JSON.stringify(selectedAnalysis, null, 2)}</div>
              </div>
            </div>
          )}
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
  aiBtn: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  aiBtnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
    background: '#9ca3af',
  },
  // Update your tr style to add vertical alignment
  tr: {
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dimmer background for better focus
    backdropFilter: 'blur(4px)', // Modern frosted glass effect
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Ensure it sits above everything
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh', // Prevent modal from leaving the screen
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column', // Keeps header at top, body scrollable
    overflow: 'hidden', // Rounded corners stay clipped
    animation: 'modalFadeIn 0.2s ease-out', // Requires CSS keyframe or simple transition
  },
  modalHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto', // Scroll long analysis here, not the whole page
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    backgroundColor: '#fdfdfd',
  },
  closeBtn: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '18px',
    transition: 'background 0.2s',
  },
  viewLink: {
    padding: '6px 12px',
    backgroundColor: '#f5f7ff', // Very light indigo/blue
    color: '#4f46e5', // Solid indigo text
    border: '1px solid #e0e7ff',
    borderRadius: '20px', // Matching the pill shape of the Analyze button
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12px',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    textDecoration: 'none', // Remove underline for a cleaner button look
  },
}
