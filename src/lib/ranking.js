const tierOrder = { critical: 0, high_priority: 1, medium_priority: 2, low_priority: 3 }

export function rankTasks(tasks) {
  return [...tasks].sort((a, b) => {
    // due date ascending, nulls last
    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date < b.due_date ? -1 : 1 // ISO date strings sort lexically
    }
    // same due date (or both null) — priority tier breaks the tie
    const priorityDelta = tierOrder[a.priority_tier] - tierOrder[b.priority_tier]
    if (priorityDelta !== 0) return priorityDelta
    // still tied — fall back to id so ordering doesn't depend on fetch order
    return String(a.id).localeCompare(String(b.id))
  })
}
