import HomeSessionScreen from '../components/session/HomeSessionScreen'

// The active-session/break/celebration state machine is owned by App.jsx
// so any screen's Start button — not just Home's — can transition into it
// (see App.jsx's activeTask handling). This page is just the Today screen.
export default function HomePage({
  session, startSession, onSessionStarted, captureOpen, onCloseCapture,
  roles, createRole, projects,
}) {
  return (
    <HomeSessionScreen
      session={session}
      startSession={startSession}
      onSessionStarted={onSessionStarted}
      captureOpen={captureOpen}
      onCloseCapture={onCloseCapture}
      roles={roles}
      createRole={createRole}
      projects={projects}
    />
  )
}
