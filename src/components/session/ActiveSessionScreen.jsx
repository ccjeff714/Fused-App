import { IconCheck } from '../icons'

const CIRC = 1005.3

export default function ActiveSessionScreen({
  task, running, timeText, progress, isStopwatch, phaseLabel, hasStarted,
  onToggleRun, onEndSession, onMarkComplete, ending, error, backgroundUrl,
}) {
  const ringOffset = isStopwatch ? 0 : CIRC - CIRC * progress
  const runLabel = running ? 'Pause' : (hasStarted ? 'Resume' : 'Start')

  return (
    <main
      className="session-field"
      style={backgroundUrl ? { backgroundImage: `linear-gradient(rgba(22,36,31,0.35), rgba(22,36,31,0.55)), url(${backgroundUrl})` } : undefined}
    >
      <div className="session-field-scrim" />
      <div className="session-field-inner">
        <div className="session-top-row">
          <div className="session-task-meta">
            <div className="eyebrow" style={{ color: 'var(--work-accent)', marginBottom: 12 }}>Working on</div>
            <h1 className="session-task-title">{task.title}</h1>
            {task.notes && <p className="session-task-notes">{task.notes}</p>}
          </div>
        </div>

        <div className="session-center">
          <div className="timer-ring-wrap">
            <svg viewBox="0 0 340 340" width="320" height="320" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="170" cy="170" r="160" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
              {!isStopwatch && (
                <circle
                  cx="170" cy="170" r="160" fill="none" stroke="var(--work-accent)" strokeWidth="3"
                  strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={ringOffset}
                />
              )}
            </svg>
            <div className="timer-ring-face">
              <span className="tnum timer-time" style={{ fontSize: 'var(--timer-lg)' }}>{timeText}</span>
              <span className="eyebrow" style={{ color: 'var(--work-accent)' }}>{phaseLabel}</span>
            </div>
          </div>
          <button type="button" className="session-run-btn" onClick={onToggleRun}>{runLabel}</button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="session-action-row">
          <button type="button" className="session-btn session-btn-end" onClick={onEndSession} disabled={ending}>
            {ending ? 'Ending...' : 'End session'}
          </button>
          <button type="button" className="session-btn session-btn-complete" onClick={onMarkComplete} disabled={ending}>
            <IconCheck size={18} />
            <span>Mark complete</span>
          </button>
        </div>
      </div>
    </main>
  )
}
