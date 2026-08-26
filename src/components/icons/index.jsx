/* Vendored icon set (Lucide, https://lucide.dev — ISC licensed), inlined as
   small React components so they render at any serving path and inherit
   currentColor, matching the Claude Design mockup's approach (the repo
   ships no icon library). Only the icons this app actually uses. */

function Icon({ size = 18, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', display: 'block' }}
      {...rest}
    >
      {children}
    </svg>
  )
}

export function IconSun(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </Icon>
  )
}

export function IconMoon(props) {
  return (
    <Icon {...props}>
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </Icon>
  )
}

export function IconCalendarWeek(props) {
  return (
    <Icon {...props}>
      <path d="M8 2v3" /><path d="M16 2v3" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 13h.01" /><path d="M12 13h.01" /><path d="M16 13h.01" />
      <path d="M8 17h.01" /><path d="M12 17h.01" /><path d="M16 17h.01" />
    </Icon>
  )
}

export function IconCalendar(props) {
  return (
    <Icon {...props}>
      <path d="M8 2v3" /><path d="M16 2v3" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </Icon>
  )
}

export function IconPlanned(props) {
  return (
    <Icon {...props}>
      <path d="M16 14v2.2l1.6 1" /><path d="M16 2v3" />
      <path d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338" />
      <path d="M3 9h5.859" /><path d="M8 2v3" />
      <circle cx="16" cy="16" r="6" />
    </Icon>
  )
}

export function IconCheckCircle(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  )
}

export function IconCheck(props) {
  return (
    <Icon {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  )
}

export function IconFolder(props) {
  return (
    <Icon {...props}>
      <path d="M4 20V8a2 2 0 0 1 2-2h3.5a2 2 0 0 1 1.6.8l.9 1.2H18a2 2 0 0 1 2 2v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M4 11h16" />
    </Icon>
  )
}

export function IconListMenu(props) {
  return (
    <Icon {...props}>
      <path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" />
      <path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" />
    </Icon>
  )
}

export function IconSettings(props) {
  return (
    <Icon {...props}>
      <path d="M10 5H3" /><path d="M12 19H3" /><path d="M14 3v4" />
      <path d="M16 17v4" /><path d="M21 12h-9" /><path d="M21 19h-5" />
      <path d="M21 5h-7" /><path d="M8 10v4" /><path d="M8 12H3" />
    </Icon>
  )
}

export function IconFlame(props) {
  return (
    <Icon {...props}>
      <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </Icon>
  )
}

export function IconPlus(props) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </Icon>
  )
}

export function IconPlay(props) {
  return (
    <Icon {...props}>
      <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </Icon>
  )
}

export function IconChevronRight(props) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  )
}

export function IconChevronLeft(props) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  )
}

export function IconChevronDown(props) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function IconX(props) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </Icon>
  )
}

export function IconSpeaker(props) {
  return (
    <Icon {...props}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </Icon>
  )
}

export function IconSearch(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  )
}

export function IconTrash(props) {
  return (
    <Icon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  )
}
