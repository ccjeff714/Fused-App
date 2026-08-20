import { useState } from 'react'
import SessionTimer from './SessionTimer'

export default function ActiveSessionScreen({ session, task, executionSession, endSession, onExit }) {
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState(null)

  const handleEndSession = async () => {
    setEnding(true)
    const startedAtMs = new Date(executionSession.started_at).getTime()
    const durationSec = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))

    const { error } = await endSession(executionSession.id, task.id, durationSec)
    setEnding(false)
    if (error) {
      setError(`Session ended, but saving follow-up updates failed: ${error} — try again.`)
    } else {
      onExit()
    }
  }

  return (
    <div className="active-session-screen">
      <h1>{task.title}</h1>

      {task.notes && <p className="active-session-notes">{task.notes}</p>}

      <SessionTimer session={session} />

      {error && <p className="error-text">{error}</p>}

      <button type="button" className="end-session-button" onClick={handleEndSession} disabled={ending}>
        {ending ? 'Ending...' : 'End Session'}
      </button>
    </div>
  )
}
