'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard/upload')
    }
  }, [session])

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1>Exam Upload System</h1>

      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard'})}
        style={{
          padding: '12px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Sign in with Google
      </button>
    </div>
  )
}

