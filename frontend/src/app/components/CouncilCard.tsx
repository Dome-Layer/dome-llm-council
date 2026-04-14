'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import ConfidenceBar from './ConfidenceBar'

interface RoundData {
  response: string
  confidence: number
}

interface CouncilCardProps {
  displayName: string
  role: string
  round1: RoundData | null
  round2: RoundData | null
  isActive: boolean
}

const THINKING_MESSAGES: Record<string, string> = {
  'Claude':  'The Strategic Advisor is weighing long-term implications…',
  'Gemini':  'The Research Analyst is structuring the evidence…',
  'Chat-GPT':  'The Critical Advisor is stress-testing assumptions…',
}

const RESPONSE_MAX_HEIGHT = 200

// Wrap tables so they scroll horizontally instead of overflowing
const mdTableWrapper: Components = {
  table: ({ children, ...props }) => (
    <div style={{ overflowX: 'auto' }}>
      <table {...props}>{children}</table>
    </div>
  ),
}

export default function CouncilCard({ displayName, role, round1, round2, isActive }: CouncilCardProps) {
  const [activeRound, setActiveRound] = useState<1 | 2>(2)
  const [modalOpen, setModalOpen] = useState(false)

  const hasBothRounds = round1 !== null && round2 !== null
  const hasAnyData    = round1 !== null || round2 !== null

  const displayRound: 1 | 2 | null = !hasAnyData
    ? null
    : hasBothRounds
    ? activeRound
    : round2 ? 2 : 1

  const current = displayRound === 2 ? round2 : displayRound === 1 ? round1 : null

  const closeModal = useCallback(() => setModalOpen(false), [])

  // Escape key + body-scroll lock while modal is open
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modalOpen, closeModal])

  // ── Skeleton / loading state ──────────────────────────────────────
  if (!current) {
    return (
      <div
        className="card-subtle"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: 200 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              style={{
                fontSize: 'var(--text-h4)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {displayName}
            </p>
            <p className="eyebrow" style={{ marginTop: 4 }}>{role}</p>
          </div>
          {isActive && <div className="spinner" />}
        </div>

        {isActive && (
          <>
            {THINKING_MESSAGES[displayName] && (
              <p
                style={{
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--color-text-tertiary)',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                {THINKING_MESSAGES[displayName]}
              </p>
            )}
            <div className="flex flex-col gap-2" style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton" style={{ height: 16, width: '70%' }} />
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Populated state ───────────────────────────────────────────────
  return (
    <>
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              style={{
                fontSize: 'var(--text-h4)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {displayName}
            </p>
            <p className="eyebrow" style={{ marginTop: 4 }}>{role}</p>
          </div>

          {hasBothRounds ? (
            <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
              {([1, 2] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRound(r)}
                  className={activeRound === r ? 'badge badge-accent' : 'badge badge-neutral'}
                  style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: 'none' }}
                >
                  R{r}
                </button>
              ))}
            </div>
          ) : (
            <span className={displayRound === 2 ? 'badge badge-accent' : 'badge badge-neutral'}>
              Round {displayRound}
            </span>
          )}
        </div>

        {/* Response — compact markdown preview, fades out at bottom */}
        <div
          className="prose-compact"
          style={{
            maxHeight: RESPONSE_MAX_HEIGHT,
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdTableWrapper}>
            {current.response}
          </ReactMarkdown>
        </div>

        {/* Open full response in modal */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            alignSelf: 'flex-start',
            fontSize: 'var(--text-caption)',
            color: 'var(--color-text-accent)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Read full response ↗
        </button>

        {/* Confidence */}
        <div>
          <p
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--color-text-tertiary)',
              fontWeight: 500,
              margin: '0 0 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Confidence
          </p>
          <ConfidenceBar value={current.confidence} key={`${displayRound}-${current.confidence}`} />
        </div>
      </div>

      {/* ── Full-response modal ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="response-modal-backdrop" onClick={closeModal}>
          <div className="response-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="response-modal-header">
              <div>
                <p
                  style={{
                    fontSize: 'var(--text-h4)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  {displayName}
                </p>
                <p className="eyebrow" style={{ marginTop: 4 }}>{role}</p>
              </div>

              <div className="flex items-center gap-2">
                {hasBothRounds && (
                  <div className="flex items-center gap-1">
                    {([1, 2] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setActiveRound(r)}
                        className={activeRound === r ? 'badge badge-accent' : 'badge badge-neutral'}
                        style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: 'none' }}
                      >
                        R{r}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    border: '0.5px solid var(--color-border-default)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 20,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal body — full prose rendering */}
            <div className="prose response-modal-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdTableWrapper}>
                {current.response}
              </ReactMarkdown>
            </div>

            {/* Modal footer — confidence bar */}
            <div className="response-modal-footer">
              <p
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-text-tertiary)',
                  fontWeight: 500,
                  margin: '0 0 6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Confidence
              </p>
              <ConfidenceBar
                value={current.confidence}
                key={`modal-${displayRound}-${current.confidence}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
