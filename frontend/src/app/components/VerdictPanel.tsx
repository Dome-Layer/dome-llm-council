import type { VerdictPayload, GovernanceEventPayload } from '@/types/sse'
import ConfidenceBar from './ConfidenceBar'
import GovernanceBadge from './GovernanceBadge'

interface VerdictPanelProps {
  verdict: VerdictPayload
  governance: GovernanceEventPayload | null
}

export default function VerdictPanel({ verdict, governance }: VerdictPanelProps) {
  return (
    <div
      className="card-accent"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Panel verdict</p>
          <h2
            style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: 'var(--color-text-primary)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {verdict.verdict}
          </h2>
        </div>
        {governance && (
          <GovernanceBadge humanInLoop={governance.human_in_loop} />
        )}
      </div>

      <hr className="divider" style={{ margin: 0 }} />

      {/* Consensus confidence */}
      <div>
        <p
          style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--color-text-tertiary)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 8px',
          }}
        >
          Consensus confidence
        </p>
        <ConfidenceBar value={verdict.consensus_confidence} />
      </div>

      {/* Recommendation */}
      {verdict.recommendation && (
        <div>
          <p
            style={{
              fontSize: 'var(--text-label)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 6px',
            }}
          >
            Recommendation
          </p>
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {verdict.recommendation}
          </p>
        </div>
      )}

      {/* Dissenting views */}
      {(verdict.dissenting_views?.length ?? 0) > 0 && (
        <div>
          <p
            style={{
              fontSize: 'var(--text-label)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 8px',
            }}
          >
            Dissenting views
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 'var(--space-4)',
              listStyleType: 'disc',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {(verdict.dissenting_views ?? []).map((view, i) => (
              <li
                key={i}
                style={{
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {view}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Governance metadata (collapsed summary) */}
      {governance && (
        <div
          style={{
            paddingTop: 'var(--space-4)',
            borderTop: '0.5px solid var(--color-border-accent)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--color-text-tertiary)',
              margin: 0,
            }}
          >
            <span style={{ fontWeight: 500 }}>Audit log:</span>{' '}
            {governance.output_summary}
            {(governance.rules_applied?.length ?? 0) > 0 && (
              <> &middot; Rules applied: {governance.rules_applied.join(', ')}</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
