import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function SessionTimer({ session }) {
  const [intervalMinutes, setIntervalMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('profiles')
      .select('settings')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const minutes = data.settings?.default_session_minutes ?? 25
        setIntervalMinutes(minutes)
        setSecondsLeft(minutes * 60)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s > 0 ? s - 1 : 0
        if (next === 0) {
          clearInterval(intervalRef.current)
          setRunning(false)
        }
        return next
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleIntervalChange = async (e) => {
    const minutes = Number(e.target.value)
    if (!minutes || minutes < 1) return
    setError(null)

    const { data, error: readError } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', session.user.id)
      .single()

    if (readError) {
      setError('Could not save the interval — try again.')
      return
    }

    const { error: writeError } = await supabase
      .from('profiles')
      .update({ settings: { ...(data.settings ?? {}), default_session_minutes: minutes } })
      .eq('id', session.user.id)

    if (writeError) {
      setError('Could not save the interval — try again.')
      return
    }

    setIntervalMinutes(minutes)
    setSecondsLeft(minutes * 60)
    setRunning(false)
  }

  const handleReset = () => {
    setRunning(false)
    setSecondsLeft(intervalMinutes * 60)
  }

  return (
    <div className="session-timer">
      <div className="timer-display">{formatTime(secondsLeft)}</div>

      <div className="timer-controls">
        <button type="button" onClick={() => setRunning((r) => !r)} disabled={secondsLeft === 0}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button type="button" onClick={handleReset}>Reset</button>
      </div>

      <label className="timer-interval">
        Interval (minutes)
        <input
          type="number"
          min="1"
          value={intervalMinutes}
          onChange={handleIntervalChange}
        />
      </label>

      {secondsLeft === 0 && <p className="timer-done">Time's up.</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
