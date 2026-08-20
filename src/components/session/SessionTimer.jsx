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
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleIntervalChange = async (e) => {
    const minutes = Number(e.target.value)
    if (!minutes || minutes < 1) return
    setIntervalMinutes(minutes)
    setSecondsLeft(minutes * 60)
    setRunning(false)

    const { data } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', session.user.id)
      .single()

    await supabase
      .from('profiles')
      .update({ settings: { ...(data?.settings ?? {}), default_session_minutes: minutes } })
      .eq('id', session.user.id)
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
    </div>
  )
}
