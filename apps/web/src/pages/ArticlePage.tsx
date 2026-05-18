import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.ts'

export default function ArticlePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get(`/articles/${id}`).then(r => r.data.article)
  })

  const bookmark = useMutation({
    mutationFn: () => data?.isBookmarked
      ? api.delete(`/bookmarks/${id}`)
      : api.post(`/bookmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', id] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    }
  })

  const saveScroll = useMutation({
    mutationFn: (scrollOffset: number) =>
      api.patch(`/articles/${id}/scroll`, { scrollOffset })
  })

  useEffect(() => {
    if (data?.scrollOffset && contentRef.current) {
      window.scrollTo(0, data.scrollOffset)
    }
  }, [data])

  useEffect(() => {
    const handleScroll = () => {
      saveScroll.mutate(window.scrollY)
    }
    const throttled = throttle(handleScroll, 2000)
    window.addEventListener('scroll', throttled)
    return () => window.removeEventListener('scroll', throttled)
  }, [id])

  function throttle(fn: Function, delay: number) {
    let last = 0
    return (...args: any[]) => {
      const now = Date.now()
      if (now - last >= delay) { last = now; fn(...args) }
    }
  }

  function getPlainText(): string {
    if (!contentRef.current) return ''
    return contentRef.current.innerText ?? ''
  }

  function startSpeech() {
    window.speechSynthesis.cancel()
    const text = getPlainText()
    if (!text) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  function stopSpeech() {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  function toggleSpeech() {
    isSpeaking ? stopSpeech() : startSpeech()
  }

  if (isLoading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  )

  if (!data) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* TTS controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={speechRate}
              onChange={e => {
                setSpeechRate(Number(e.target.value))
                if (isSpeaking) { stopSpeech(); setTimeout(startSpeech, 100) }
              }}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', borderRadius: '6px',
                padding: '0.3rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button
              onClick={toggleSpeech}
              style={{
                padding: '0.35rem 0.85rem',
                background: isSpeaking ? 'var(--bg-tertiary)' : 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {isSpeaking ? '⏹ Stop' : '▶ Listen'}
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => bookmark.mutate()}
            style={{
              padding: '0.35rem 0.85rem',
              background: data.isBookmarked ? 'var(--accent)' : 'transparent',
              border: `1px solid ${data.isBookmarked ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: data.isBookmarked ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.8rem'
            }}
          >
            {data.isBookmarked ? '★ Saved' : '☆ Save'}
          </button>

          {/* Original link */}
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.35rem 0.85rem',
              border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--text-secondary)',
              textDecoration: 'none', fontSize: '0.8rem'
            }}
          >
            Original
          </a>
        </div>
      </div>

      {/* Article content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        {/* Meta */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontSize: '0.8rem', color: 'var(--accent)',
            marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {data.feed?.title}
          </p>

          <h1 style={{
            fontSize: '2rem', fontWeight: '700', lineHeight: '1.25',
            color: 'var(--text-primary)', marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            {data.title}
          </h1>

          <div style={{
            display: 'flex', gap: '1rem', fontSize: '0.8rem',
            color: 'var(--text-muted)', flexWrap: 'wrap'
          }}>
            {data.author && <span>By {data.author}</span>}
            {data.publishedAt && (
              <span>{new Date(data.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</span>
            )}
            {data.readingTime && <span>{data.readingTime} min read</span>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2.5rem' }} />

        {/* Body */}
        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: data.cleanContent ?? '' }}
          style={{
            color: 'var(--text-primary)',
            fontSize: '1.05rem',
            lineHeight: '1.8',
            fontFamily: 'Georgia, serif',
          }}
        />
      </div>

      {/* Article content styles */}
      <style>{`
        .article-body h1, .article-body h2, .article-body h3 {
          color: var(--text-primary);
          margin: 2rem 0 1rem;
          line-height: 1.3;
        }
        [ref] p { margin-bottom: 1.25rem; }
        [ref] a { color: var(--accent); text-decoration: none; }
        [ref] a:hover { text-decoration: underline; }
        [ref] code {
          background: var(--bg-tertiary);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: 'Monaco', monospace;
        }
        [ref] pre {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        [ref] pre code { background: none; padding: 0; }
        [ref] blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          color: var(--text-secondary);
          font-style: italic;
        }
        [ref] img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1.5rem 0;
        }
        [ref] ul, [ref] ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        [ref] li { margin-bottom: 0.4rem; }
        [ref] table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
        }
        [ref] th, [ref] td {
          border: 1px solid var(--border);
          padding: 0.6rem 0.75rem;
          text-align: left;
        }
        [ref] th { background: var(--bg-secondary); color: var(--text-secondary); }
      `}</style>
    </div>
  )
}
