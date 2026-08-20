import { useState } from 'react'
import SessionTimer from './SessionTimer'

export default function ActiveSessionScreen({ session, task, executionSession, endSession, onExit }) {
  const [ending, setEnding] = useState(false)

  const handleEndSession = async () => {
    setEnding(true)
    const startedAtMs = new Date(executionSession.started_at).getTime()
    const durationSec = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))

    const { error } = await endSession(executionSession.id, task.id, durationSec)
    setEnding(false)
    if (!error) onExit()
  }

  return (
    <div className="active-session-screen">
      <button type="button" className="link-button" onClick={onExit}>
        ← Back
      </button>

      <h1>{task.title}</h1>

      {task.notes && <p className="active-session-notes">{task.notes}</p>}

      <SessionTimer session={session} />

      <button type="button" className="end-session-button" onClick={handleEndSession} disabled={ending}>
        {ending ? 'Ending...' : 'End Session'}
      </button>
    </div>
  )
}
