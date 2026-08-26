const CIRC = 1005.3

export default function BreakScreen({ running, timeText, progress, nextTitle, onToggleRun, onSkip }) {
  const ringOffset = CIRC - CIRC * progress
  const runLabel = running ? 'Pause' : (progress === 0 ? 'Start break' : 'Resume')

  return (
    <main className="session-field break">
      <div className="session-field-inner">
        <div className="session-top-row centered">
          <span className="eyebrow" style={{ color: 'var(--break-accent)' }}>Break</span>
          <button type="button" className="session-btn session-btn-outline" onClick={onSkip}>Skip break</button>
        </div>

        <div className="session-center">
          <div className="timer-ring-wrap break">
            <svg viewBox="0 0 340 340" width="300" height="300" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="170" cy="170" r="160" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
              <circle
                cx="170" cy="170" r="160" fill="none" stroke="var(--break-accent)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="timer-ring-face">
              <span className="tnum timer-time" style={{ fontSize: 'var(--timer-lg)' }}>{timeText}</span>
              <span className="eyebrow" style={{ color: 'var(--break-accent)' }}>Break</span>
            </div>
          </div>
          {!running && (
            <button type="button" className="session-run-btn" onClick={onToggleRun}>{runLabel}</button>
          )}
          <p className="break-copy">Step away. Fused will pick things back up.</p>
        </div>

        {nextTitle && (
          <div className="break-next">
            <span className="eyebrow" style={{ color: 'var(--break-accent)' }}>Next up</span>
            <span style={{ fontSize: 'var(--text-lg)' }}>{nextTitle}</span>
          </div>
        )}
      </div>
    </main>
  )
}
