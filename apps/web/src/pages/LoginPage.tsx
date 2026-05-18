import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api.ts'
import { useAuthStore } from '../store/auth.ts'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const login = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/login', { email, password })
      return res.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      navigate('/')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Login failed')
    }
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Sign in to your Perch account
        </p>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#2a1515',
            border: '1px solid #5a2020',
            borderRadius: '8px',
            color: '#ff6b6b',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login.mutate()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login.mutate()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => login.mutate()}
            disabled={login.isPending}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              background: login.isPending ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: login.isPending ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem'
        }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
