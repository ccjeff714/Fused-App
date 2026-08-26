function toISO(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function todayISO() {
  return toISO(new Date())
}

// Returns the ISO date `offset` days from today (offset 0 = today).
export function isoDaysFromToday(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return toISO(d)
}

export function formatLongDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export function weekdayName(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' })
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysISO(iso, days) {
  const dt = parseISO(iso)
  dt.setDate(dt.getDate() + days)
  return toISO(dt)
}

// Monday of the week containing `iso` — week starts Monday, per Planned
// screen's spec (Phase5-era clarification).
export function mondayOfWeek(iso) {
  const dt = parseISO(iso)
  const day = dt.getDay() // 0=Sun..6=Sat
  const offset = day === 0 ? 6 : day - 1
  dt.setDate(dt.getDate() - offset)
  return toISO(dt)
}

// Last day of the month `monthsAhead` months after `iso`'s month
// (monthsAhead 0 = iso's own month, 1 = the following month, etc).
export function endOfMonthISO(iso, monthsAhead = 0) {
  const [y, m] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1 + monthsAhead + 1, 0)
  return toISO(dt)
}
