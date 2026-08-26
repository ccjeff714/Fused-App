import { useState, useEffect, useRef } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { useTasks } from '../../hooks/useTasks'
import { useTopThree } from '../../hooks/useTopThree'
import { resolveSessionBackgroundUrl } from '../../lib/sessionBackground'
import { playSuccessSound } from '../../lib/celebrationSound'
import ActiveSessionScreen from './ActiveSessionScreen'
import BreakScreen from './BreakScreen'
import CelebrationScreen from './CelebrationScreen'

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Owns the sprint/break/celebration state machine for one active task
// session (Phase2_Handoff_Spec.md A3/A3a/A5). Rendered by App.jsx whenever
// a task is being worked on, regardless of which screen started it.
// Waits for settings to load before mounting the actual engine below, so
// the engine's initial timer state can be computed once at mount (a lazy
// useState initializer) instead of needing an effect to patch it in later.
export default function SessionFlow(props) {
  const { settings, loading: settingsLoading } = useSettings(props.session)
  if (settingsLoading) return null
  return <SessionFlowEngine {...props} settings={settings} />
}

function SessionFlowEngine({ session, task, executionSession, endSession, onExit, settings }) {
  const { updateTask } = useTasks(session)
  const { topThree } = useTopThree(session)

  const [uiPhase, setUiPhase] = useState('active') // 'active' | 'celebration'
  const [timer, setTimer] = useState(() => ({
    phase: 'sprint', running: true,
    secondsLeft: (settings.default_session_minutes ?? 25) * 60,
    elapsed: 0, workAccum: 0,
  }))
  const [postCompletionBreak, setPostCompletionBreak] = useState(false)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState(null)
  const [completedTitle, setCompletedTitle] = useState('')
  const [remainingCount, setRemainingCount] = useState(0)
  const [playedSound, setPlayedSound] = useState(false)
  const [backgroundUrl, setBackgroundUrl] = useState(null)

  const settingsRef = useRef(settings)
  useEffect(() => { settingsRef.current = settings }, [settings])

  useEffect(() => {
    let cancelled = false
    resolveSessionBackgroundUrl(settings.session_background_url).then((url) => {
      if (!cancelled) setBackgroundUrl(url)
    })
    return () => { cancelled = true }
  }, [settings.session_background_url])

  useEffect(() => {
    if (uiPhase !== 'active' || !timer.running) return
    const id = setInterval(() => {
      setTimer((t) => {
        const s = settingsRef.current
        const isStopwatch = !s.pomodoro_enabled
        if (isStopwatch) return { ...t, elapsed: t.elapsed + 1 }

        if (t.phase === 'sprint') {
          const workAccum = t.workAccum + 1
          if (t.secondsLeft <= 1) {
            return {
              ...t, workAccum, phase: 'break',
              secondsLeft: (s.default_break_minutes ?? 5) * 60,
              running: !!s.auto_start_breaks,
            }
          }
          return { ...t, workAccum, secondsLeft: t.secondsLeft - 1 }
        }

        // phase === 'break'
        if (t.secondsLeft <= 1) {
          if (postCompletionBreak) {
            return { ...t, phase: 'break', secondsLeft: 0, running: false }
          }
          return {
            ...t, phase: 'sprint',
            secondsLeft: (s.default_session_minutes ?? 25) * 60,
            running: !!s.auto_start_next_sprint,
          }
        }
        return { ...t, secondsLeft: t.secondsLeft - 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timer.running, uiPhase, postCompletionBreak])

  // A post-completion break that finishes just returns to Today — there's
  // no next sprint to resume on an already-completed task.
  useEffect(() => {
    if (postCompletionBreak && timer.phase === 'break' && timer.secondsLeft === 0) {
      onExit()
    }
  }, [postCompletionBreak, timer.phase, timer.secondsLeft, onExit])

  const toggleRun = () => setTimer((t) => ({ ...t, running: !t.running }))

  const skipBreak = () => {
    if (postCompletionBreak) {
      onExit()
      return
    }
    setTimer((t) => ({
      ...t, phase: 'sprint',
      secondsLeft: (settings.default_session_minutes ?? 25) * 60,
      running: !!settings.auto_start_next_sprint,
    }))
  }

  const currentDurationSec = () => (settings.pomodoro_enabled ? timer.workAccum : timer.elapsed)

  const handleEndSession = async () => {
    setEnding(true)
    setError(null)
    const { error } = await endSession(executionSession.id, task.id, currentDurationSec())
    setEnding(false)
    if (error) {
      setError(`Session ended, but saving follow-up updates failed: ${error} — try again.`)
    } else {
      onExit()
    }
  }

  const handleMarkComplete = async () => {
    setEnding(true)
    setError(null)
    const durationSec = currentDurationSec()

    const [{ error: taskError }, { error: sessionError }] = await Promise.all([
      updateTask(task.id, { status: 'done' }),
      endSession(executionSession.id, task.id, durationSec),
    ])
    setEnding(false)

    if (taskError || sessionError) {
      setError(`Couldn't finish marking this complete: ${taskError || sessionError} — try again.`)
      return
    }

    const wasInTopThree = topThree.some((t) => t.id === task.id)
    const stillOpenInTopThree = topThree.filter((t) => t.id !== task.id && t.status !== 'done').length
    setRemainingCount(wasInTopThree ? stillOpenInTopThree : topThree.filter((t) => t.status !== 'done').length)
    setCompletedTitle(task.title)

    if (settings.success_sound_effect) {
      playSuccessSound()
      setPlayedSound(true)
    }

    if (settings.show_success_screen) {
      setUiPhase('celebration')
    } else {
      onExit()
    }
  }

  const handleTakeBreak = () => {
    setPostCompletionBreak(true)
    setUiPhase('active')
    setTimer((t) => ({ ...t, phase: 'break', running: true, secondsLeft: (settings.default_break_minutes ?? 5) * 60 }))
  }

  if (uiPhase === 'celebration') {
    return (
      <CelebrationScreen
        completedTitle={completedTitle}
        remainingCount={remainingCount}
        showGif={settings.success_screen_gif}
        playedSound={playedSound}
        onTakeBreak={handleTakeBreak}
        onNextTask={onExit}
      />
    )
  }

  const isStopwatch = !settings.pomodoro_enabled

  if (timer.phase === 'break') {
    const breakTotal = (settings.default_break_minutes ?? 5) * 60
    const nextTitle = postCompletionBreak
      ? null
      : (topThree.find((t) => t.id !== task.id)?.title ?? null)
    return (
      <BreakScreen
        running={timer.running}
        timeText={formatTime(timer.secondsLeft)}
        progress={breakTotal > 0 ? 1 - timer.secondsLeft / breakTotal : 0}
        nextTitle={nextTitle}
        onToggleRun={toggleRun}
        onSkip={skipBreak}
      />
    )
  }

  const sprintTotal = (settings.default_session_minutes ?? 25) * 60
  const progress = isStopwatch ? 0 : (sprintTotal > 0 ? 1 - timer.secondsLeft / sprintTotal : 0)

  return (
    <ActiveSessionScreen
      task={task}
      running={timer.running}
      timeText={isStopwatch ? formatTime(timer.elapsed) : formatTime(timer.secondsLeft)}
      progress={progress}
      isStopwatch={isStopwatch}
      hasStarted={isStopwatch ? timer.elapsed > 0 : timer.secondsLeft < sprintTotal}
      phaseLabel={isStopwatch ? 'Stopwatch' : 'Work sprint'}
      onToggleRun={toggleRun}
      onEndSession={handleEndSession}
      onMarkComplete={handleMarkComplete}
      ending={ending}
      error={error}
      backgroundUrl={backgroundUrl}
    />
  )
}
