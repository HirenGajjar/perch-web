import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.ts';
import { useAuthStore } from '../store/auth.ts';
import { stripHtml } from '../lib/stripHtml.ts';

export default function FeedPage() {
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const [feedUrl, setFeedUrl] = useState('')
  const [addError, setAddError] = useState('')
  const [showAddFeed, setShowAddFeed] = useState(false)

  const { data: feedsData } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => api.get('/feeds').then(r => r.data)
  })

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => api.get('/articles').then(r => r.data)
  })

  const addFeed = useMutation({
    mutationFn: (url: string) => api.post('/feeds', { url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      setFeedUrl('')
      setShowAddFeed(false)
      setAddError('')
    },
    onError: (err: any) => {
      setAddError(err.response?.data?.error ?? 'Failed to add feed')
    }
  })

  const articles = articlesData?.articles ?? []
  const feeds = feedsData?.subscriptions ?? []

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <div style={{
        width: '260px',
        minWidth: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0'
      }}>
        {/* Logo */}
        <div style={{
          padding: '0 1.5rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1rem'
        }}>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            perch
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {user?.name ?? user?.email}
          </p>
        </div>

        {/* Feeds list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
          <p style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '0 0.5rem',
            marginBottom: '0.75rem'
          }}>
            Following
          </p>

          {feeds.map((sub: any) => (
            <div key={sub.id} style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {sub.customTitle ?? sub.feed.title}
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px'
              }}>
                {sub.feed._count.articles}
              </span>
            </div>
          ))}

          {/* Add feed button */}
          <button
            onClick={() => setShowAddFeed(true)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              marginTop: '0.5rem',
              background: 'transparent',
              border: '1px dashed var(--border)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            + Add feed
          </button>
        </div>

        {/* Logout */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
            letterSpacing: '-0.01em'
          }}>
            All articles
          </h2>

          {articlesLoading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</p>
          )}

          {articles.map((article: any) => (
            <div
              key={article.id}
              onClick={() => navigate(`/article/${article.id}`)}
              style={{
                padding: '1.25rem 0',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                opacity: article.isRead ? 0.6 : 1,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                  {article.feed.title}
                </span>
                {article.isBookmarked && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>· bookmarked</span>
                )}
              </div>

              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
                lineHeight: '1.4',
              }}>
                {article.title}
              </h3>

              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                marginBottom: '0.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {stripHtml(article.excerpt ?? '')}
              </p>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {article.publishedAt && (
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                )}
                {article.readingTime && <span>{article.readingTime} min read</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add feed modal */}
      {showAddFeed && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50
        }}
          onClick={() => setShowAddFeed(false)}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
            width: '480px',
          }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Add a feed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Paste any RSS feed URL
            </p>

            {addError && (
              <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem' }}>{addError}</p>
            )}

            <input
              autoFocus
              type="url"
              placeholder="https://example.com/feed.xml"
              value={feedUrl}
              onChange={e => setFeedUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFeed.mutate(feedUrl)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                marginBottom: '1rem',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddFeed(false)}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => addFeed.mutate(feedUrl)}
                disabled={addFeed.isPending || !feedUrl}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: addFeed.isPending || !feedUrl ? 0.5 : 1
                }}
              >
                {addFeed.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
