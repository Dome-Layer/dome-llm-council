'use client'

import { useEffect, useState } from 'react'

const INTERESTING_FACTS = [
  'Claude serves as Strategic Advisor — focused on long-term implications and systemic risks.',
  "The Critical Advisor's role is to challenge consensus and surface blind spots.",
  "Gemini's Research Analyst role prioritises data integrity and structured reasoning.",
  'Round 2 is sequential — each advisor reviews the others\' Round 1 positions before responding.',
  'Confidence scores are extracted from each model\'s response using a regex pattern.',
  'A confidence score below 0.6 automatically triggers a human-in-loop recommendation.',
  'The governance log records a SHA-256 hash of the input for full auditability.',
  'The Chief Synthesis Advisor produces the final verdict by weighing all six responses across both rounds.',
]

const ROUND_COPY: Record<1 | 2 | 3, { headline: string; sub: string }> = {
  1: {
    headline: 'The Panel is forming independent positions',
    sub: 'Each advisor deliberates independently — no cross-examination yet.',
  },
  2: {
    headline: 'The Panel is conducting cross-examination',
    sub: 'Advisors are reviewing initial positions and refining their assessments.',
  },
  3: {
    headline: 'Synthesising the verdict',
    sub: 'Weighing confidence scores, consensus patterns, and dissenting views.',
  },
}

interface StatusIndicatorProps {
  message: string
  phase: 'connecting' | 'deliberating'
  round: 1 | 2 | 3 | null
}

export default function StatusIndicator({ message, phase, round }: StatusIndicatorProps) {
  const [factIndex, setFactIndex] = useState(0)
  const [factVisible, setFactVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setFactVisible(false)
      setTimeout(() => {
        setFactIndex(i => (i + 1) % INTERESTING_FACTS.length)
        setFactVisible(true)
      }, 300)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const narrative = round ? ROUND_COPY[round] : null

  const headline =
    phase === 'connecting'
      ? 'Convening the Panel…'
      : narrative?.headline ?? message ?? 'Deliberating…'

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
        {INTERESTING_FACTS[factIndex]}
      </p>
    </div>
  )
}
