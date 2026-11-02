'use client'

import { ShieldCheck, ShieldAlert, ShieldX, Shield, type LucideIcon } from 'lucide-react'
import type { HumanInLoop } from '@/types/sse'
import { useT } from '@/lib/i18n'

interface GovernanceBadgeProps {
  humanInLoop: HumanInLoop
}

const CONFIG: Record<HumanInLoop, {
  badgeClass: string
  Icon: LucideIcon
}> = {
  not_required: {
    badgeClass: 'badge badge-success',
    Icon: ShieldCheck,
  },
  recommended: {
    badgeClass: 'badge badge-warning',
    Icon: ShieldAlert,
  },
  required: {
    badgeClass: 'badge badge-error',
    Icon: ShieldX,
  },
  completed: {
    badgeClass: 'badge badge-success',
    Icon: ShieldCheck,
  },
}

export default function GovernanceBadge({ humanInLoop }: GovernanceBadgeProps) {
  const t = useT()
  const { badgeClass, Icon } = CONFIG[humanInLoop]
  const label = t.governance[humanInLoop]

  return (
    <span className={badgeClass} style={{ gap: 5 }}>
      <Icon size={10} />
      {label}
    </span>
  )
}
