'use client'

import { useState } from 'react'
import type { SSEEvent, VerdictPayload, GovernanceEventPayload } from '@/types/sse'
import QuestionForm from './components/QuestionForm'
import CouncilCard from './components/CouncilCard'
import VerdictPanel from './components/VerdictPanel'
import StatusIndicator from './components/StatusIndicator'

// ─── Member config ────────────────────────────────────────────────

const MEMBER_ORDER = ['claude', 'gemini', 'openai'] as const
type MemberId = typeof MEMBER_ORDER[number]

const MEMBER_DISPLAY: Record<MemberId, { displayName: string; defaultRole: string }> = {
  claude: { displayName: 'Claude',  defaultRole: 'Strategic Advisor' },
  gemini: { displayName: 'Gemini',  defaultRole: 'Research Analyst' },
  openai: { displayName: 'Chat-GPT', defaultRole: 'Critical Advisor' },
}

// ─── State types ──────────────────────────────────────────────────

interface RoundData {
  response: string
  confidence: number
}

interface MemberState {
  role: string
  round1: RoundData | null
  round2: RoundData | null
}

type MembersState = Record<MemberId, MemberState>

type Phase = 'idle' | 'connecting' | 'deliberating' | 'complete' | 'error'
type StatusRound = 1 | 2 | 3 | null

function getInitialMembers(): MembersState {
  return {
    claude: { role: MEMBER_DISPLAY.claude.defaultRole, round1: null, round2: null },
    gemini: { role: MEMBER_DISPLAY.gemini.defaultRole, round1: null, round2: null },
    openai: { role: MEMBER_DISPLAY.openai.defaultRole, round1: null, round2: null },
  }
}

function isMemberId(id: string): id is MemberId {
  return (MEMBER_ORDER as readonly string[]).includes(id)
}

// ─── SSE streaming ────────────────────────────────────────────────

function getSSOAuthHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const match = document.cookie.split('; ').find(r => r.startsWith('dome_auth_token='))
  if (!match) return {}
  const token = match.split('=').slice(1).join('=')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function streamDeliberation(
  question: string,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  const response = await fetch(`${apiUrl}/deliberate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getSSOAuthHeader() },
    body: JSON.stringify({ question, context: '', user_id: null }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  if (!response.body) {
    throw new Error('No response body from server')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        continue
      }

      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'type' in parsed &&
        typeof (parsed as { type: unknown }).type === 'string'
      ) {
        onEvent(parsed as SSEEvent)
        const eventType = (parsed as SSEEvent).type
        if (eventType === 'done' || eventType === 'error') return
      }
    }
  }
}

// ─── Page ─────────────────────────────────────────────────────────

export default function Page() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusRound, setStatusRound] = useState<StatusRound>(null)
  const [members, setMembers] = useState<MembersState>(getInitialMembers())
  const [verdict, setVerdict] = useState<VerdictPayload | null>(null)
  const [governance, setGovernance] = useState<GovernanceEventPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const isSubmitting = phase === 'connecting' || phase === 'deliberating'

  async function handleSubmit(question: string) {
    if (isSubmitting) return

    setPhase('connecting')
    setStatusMessage('')
    setStatusRound(null)
    setMembers(getInitialMembers())
    setVerdict(null)
    setGovernance(null)
    setErrorMessage('')

    try {
      await streamDeliberation(question, (event) => {
        switch (event.type) {
          case 'status':
            setPhase('deliberating')
            setStatusMessage(event.message)
            setStatusRound(event.round)
            break

          case 'member_response': {
            const { member_id, role, response, confidence, round } = event
            if (!isMemberId(member_id)) break
            setMembers(prev => ({
              ...prev,
              [member_id]: {
                role,
                round1: round === 1 ? { response, confidence } : prev[member_id].round1,
                round2: round === 2 ? { response, confidence } : prev[member_id].round2,
              },
            }))
            break
          }

          case 'verdict':
            setVerdict({
              question:             event.question,
              verdict:              event.verdict,
              consensus_confidence: event.consensus_confidence,
              dissenting_views:     event.dissenting_views,
              recommendation:       event.recommendation,
              member_responses:     event.member_responses,
            })
            break

          case 'governance_event':
            setGovernance({
              agent_id:       event.agent_id,
              action_type:    event.action_type,
              timestamp:      event.timestamp,
              input_hash:     event.input_hash,
              input_type:     event.input_type,
              output_summary: event.output_summary,
              rules_applied:  event.rules_applied,
              rules_triggered: event.rules_triggered,
              confidence:     event.confidence,
              human_in_loop:  event.human_in_loop,
              user_id:        event.user_id,
              metadata:       event.metadata,
            })
            break

          case 'done':
            setPhase('complete')
            break

          case 'error':
            setErrorMessage(event.message)
            setPhase('error')
            break
        }
      })

      // Stream ended without explicit done event
      setPhase(prev => (prev === 'deliberating' || prev === 'connecting') ? 'complete' : prev)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Connection failed')
      setPhase('error')
    }
  }

  const showCards = phase !== 'idle'
  const hasAnyResponse = MEMBER_ORDER.some(id => members[id].round1 !== null)

  return (
    <div
      style={{
        maxWidth: '1152px',
        margin: '0 auto',
        padding: 'var(--space-10) var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
      }}
    >
        {/* Page title */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>Multi-model deliberation</p>
          <h1
            style={{
              fontSize: 'var(--text-h1)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--color-text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Ask the Panel
          </h1>
          <p
            style={{
              fontSize: 'var(--text-body)',
              color: 'var(--color-text-secondary)',
              marginTop: 12,
              marginBottom: 0,
              maxWidth: '36rem',
              lineHeight: 1.625,
            }}
          >
            Three AI advisors deliberate independently, then cross-examine each other producing a governed verdict with a confidence score and full audit trail.
          </p>
        </div>

        {/* Question form */}
        <QuestionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {/* Status indicator */}
        {(phase === 'connecting' || phase === 'deliberating') && (
          <StatusIndicator message={statusMessage} phase={phase} round={statusRound} />
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--color-error-subtle)',
              border: '0.5px solid var(--color-error-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-error)',
            }}
          >
            {errorMessage || 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Council cards */}
        {showCards && (
          <section>
            <p className="eyebrow" style={{ marginBottom: 16 }}>
              {hasAnyResponse ? 'Panel members' : 'Convening the Panel…'}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {MEMBER_ORDER.map(id => (
                <CouncilCard
                  key={id}
                  displayName={MEMBER_DISPLAY[id].displayName}
                  role={members[id].role}
                  round1={members[id].round1}
                  round2={members[id].round2}
                  isActive={isSubmitting}
                />
              ))}
            </div>
          </section>
        )}

        {/* Verdict panel */}
        {verdict && (
          <VerdictPanel verdict={verdict} governance={governance} />
        )}
    </div>
  )
}
