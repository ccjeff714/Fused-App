// Shared tier display constants — one copy instead of the label maps
// previously duplicated across TaskCard/TopThreeCard, so a tier's label or
// color token can't drift out of sync between cards (same lesson as the
// Phase 1 sort-order fix in lib/ranking.js).
// Display labels only — stored values (critical/high_priority/
// medium_priority/low_priority) are unchanged everywhere they're written
// to or read from Supabase; this is purely a label-mapping layer.
export const TIERS = {
  critical: { label: 'Critical', dot: 'var(--tier-critical)' },
  high_priority: { label: 'High', dot: 'var(--tier-high)' },
  medium_priority: { label: 'Medium', dot: 'var(--tier-medium)' },
  low_priority: { label: 'Low', dot: 'var(--tier-low)' },
}

export const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

export function tierInfo(tier) {
  return TIERS[tier] ?? { label: tier, dot: 'var(--tier-low)' }
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

export function formatDueDate(dueDate) {
  return dueDate || 'No due date'
}
