import { IconCheckCircle, IconSpeaker } from '../icons'

export default function CelebrationScreen({
  completedTitle, remainingCount, showGif, playedSound, onTakeBreak, onNextTask,
}) {
  return (
    <main className="celebration-screen">
      <span className="celebration-badge">
        <IconCheckCircle size={30} />
        <span className="eyebrow" style={{ color: 'var(--progress)' }}>Task complete</span>
      </span>
      <h1 className="celebration-title">{completedTitle}</h1>

      {showGif && (
        <div className="celebration-gif-slot">Celebration gif</div>
      )}

      <p style={{ color: 'var(--text-secondary)' }}>
        {remainingCount > 0
          ? `${remainingCount} more in today's Top 3.`
          : "Today's Top 3 is clear."}
      </p>

      <div className="celebration-actions">
        <button type="button" className="btn btn-outline" onClick={onTakeBreak}>Take a break</button>
        <button type="button" className="btn btn-primary" onClick={onNextTask}>Next task</button>
      </div>

      {playedSound && (
        <span className="celebration-sound-note">
          <IconSpeaker size={16} />
          <span>Success chime played</span>
        </span>
      )}
    </main>
  )
}
