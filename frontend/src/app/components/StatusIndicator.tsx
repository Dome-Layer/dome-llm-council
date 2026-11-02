'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n'

interface StatusIndicatorProps {
  message: string
  phase: 'connecting' | 'deliberating'
  round: 1 | 2 | 3 | null
}

export default function StatusIndicator({ message, phase, round }: StatusIndicatorProps) {
  const t = useT()
  const facts = t.status.facts
  const [factIndex, setFactIndex] = useState(0)
  const [factVisible, setFactVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setFactVisible(false)
      setTimeout(() => {
        setFactIndex(i => (i + 1) % facts.length)
        setFactVisible(true)
      }, 300)
    }, 5000)
    return () => clearInterval(id)
  }, [facts.length])

  const narrative = round ? t.status.rounds[round] : null

  const headline =
    phase === 'connecting'
      ? t.status.convening
      : narrative?.headline ?? message ?? t.status.deliberating

  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'var(--color-bg-accent)',
        border: '0.5px solid var(--color-border-accent)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Spinner + headline */}
      <div className="flex items-center gap-3">
        <div
          className="spinner"
          style={{ width: 16, height: 16, borderWidth: '1.5px', flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 'var(--text-body-sm)',
            color: 'var(--color-text-accent)',
            fontWeight: 500,
          }}
        >
          {headline}
        </span>
      </div>

      {/* Round sub-narrative */}
      {phase === 'deliberating' && narrative?.sub && (
        <p
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--color-text-accent)',
            opacity: 0.7,
            margin: 0,
            paddingLeft: 28,
          }}
        >
          {narrative.sub}
        </p>
      )}

      {/* Cycling interesting fact */}
      <p
        style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--color-text-accent)',
          opacity: factVisible ? 0.5 : 0,
          margin: 0,
          paddingLeft: 28,
          transition: 'opacity 0.3s ease',
          fontStyle: 'italic',
        }}
      >
        {facts[factIndex]}
      </p>
    </div>
  )
}
