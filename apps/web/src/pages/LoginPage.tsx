import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { useAuthStore } from '../store/auth.ts';
import { usePageTitle } from '../hooks/usePageTitle.ts';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  usePageTitle('Login');

  const login = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Invalid email or password');
    },
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg)',
      }}
    >
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }}>
          {/* Logo */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '2rem',
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: '0.4rem',
              }}
            >
              perch
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Welcome back
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '0.65rem 0.9rem',
                background: 'rgba(224,85,85,0.08)',
                border: '1px solid rgba(224,85,85,0.2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--red)',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  color: 'var(--text-3)',
                  marginBottom: '0.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login.mutate()}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  color: 'var(--text-3)',
                  marginBottom: '0.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  fontWeight: 500,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login.mutate()}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <button
              onClick={() => login.mutate()}
              disabled={login.isPending || !email || !password}
              style={{
                marginTop: '0.25rem',
                padding: '0.75rem',
                background:
                  login.isPending || !email || !password ? 'var(--bg-3)' : 'var(--accent)',
                color: login.isPending || !email || !password ? 'var(--text-3)' : '#0c0c0e',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: login.isPending || !email || !password ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {login.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '0.825rem',
              color: 'var(--text-3)',
              textAlign: 'center',
            }}
          >
            No account?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
              }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — decorative */}
      <div
        style={{
          width: '420px',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
        }}
      >
        <div style={{ maxWidth: '300px' }}>
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '1.5rem',
              color: 'var(--text)',
              lineHeight: 1.4,
              marginBottom: '1.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            "Read deeply,{' '}
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>not widely.</span>"
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '◎', text: 'Follow anyone who writes' },
              { icon: '◎', text: 'Clean distraction-free reader' },
              { icon: '◎', text: 'Listen while you work' },
              { icon: '◎', text: 'Highlight what matters' },
            ].map((item) => (
              <div
                key={item.text}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <span style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
