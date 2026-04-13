export type HumanInLoop = 'not_required' | 'recommended' | 'required' | 'completed'

export interface MemberResponsePayload {
  member_id: string
  role: string
  response: string
  confidence: number
  round: 1 | 2
}

export interface VerdictPayload {
  question: string
  verdict: string
  consensus_confidence: number
  dissenting_views: string[]
  recommendation: string
  member_responses: MemberResponsePayload[]
}

export interface GovernanceEventPayload {
  agent_id: string
  action_type: string
  timestamp: string
  input_hash: string
  input_type: string
  output_summary: string
  rules_applied: string[]
  rules_triggered: string[]
  confidence: number | null
  human_in_loop: HumanInLoop
  user_id: string | null
  metadata: Record<string, unknown>
}

export type SSEEvent =
  | { type: 'status'; round: 1 | 2 | 3; message: string }
  | ({ type: 'member_response' } & MemberResponsePayload)
  | ({ type: 'verdict' } & VerdictPayload)
  | ({ type: 'governance_event' } & GovernanceEventPayload)
  | { type: 'done' }
  | { type: 'error'; message: string }
