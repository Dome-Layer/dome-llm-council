import { ShieldCheck, ShieldAlert, ShieldX, Shield, type LucideIcon } from 'lucide-react'
import type { HumanInLoop } from '@/types/sse'

interface GovernanceBadgeProps {
  humanInLoop: HumanInLoop
}

const CONFIG: Record<HumanInLoop, {
  label: string
  badgeClass: string
  Icon: LucideIcon
}> = {
  not_required: {
    label: 'Autonomous',
    badgeClass: 'badge badge-success',
    Icon: ShieldCheck,
  },
  recommended: {
    label: 'Review recommended',
    badgeClass: 'badge badge-warning',
    Icon: ShieldAlert,
  },
  required: {
    label: 'Human required',
    badgeClass: 'badge badge-error',
    Icon: ShieldX,
  },
  completed: {
    label: 'Human reviewed',
    badgeClass: 'badge badge-success',
    Icon: ShieldCheck,
  },
}

export default function GovernanceBadge({ humanInLoop }: GovernanceBadgeProps) {
  const { label, badgeClass, Icon } = CONFIG[humanInLoop]

  return (
    <span className={badgeClass} style={{ gap: 5 }}>
      <Icon size={10} />
      {label}
    </span>
  )
}
