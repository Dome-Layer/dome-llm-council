'use client'

import { useIntlLocale } from '@/lib/i18n'

interface ConfidenceBarProps {
  value: number // 0 to 1
}

export default function ConfidenceBar({ value }: ConfidenceBarProps) {
  const intl = useIntlLocale()
  const pct = `${Math.round(value * 100)}%`
  // Two decimals in the visitor's own notation (0.75, 0,75).
  const score = new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

  return (
    <div className="flex items-center gap-3">
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'var(--color-bg-muted)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          className="confidence-bar-fill"
          style={{ '--target-width': pct } as React.CSSProperties}
        />
      </div>
      <span
        style={{
          fontSize: 'var(--text-caption)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          fontVariantNumeric: 'tabular-nums',
          width: '2.5rem',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {score}
      </span>
    </div>
  )
}
