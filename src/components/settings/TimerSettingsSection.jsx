import Switch from './Switch'

const WORK_OPTIONS = [5, 10, 15, 20, 25, 30]
const BREAK_OPTIONS = [5, 10, 15]

// Work sprint / break duration + both auto-start toggles, all nested under
// and disabled alongside the pomodoro_enabled master toggle (spec A3a —
// none of these mean anything in stopwatch mode).
export default function TimerSettingsSection({ settings, updateSettings }) {
  const pomodoroOn = settings.pomodoro_enabled

  return (
    <>
      <h2 className="eyebrow settings-section-label">Sprints</h2>
      <div className="settings-row">
        <span className="settings-row-label-group">
          <span className="settings-row-title">Pomodoro sprints</span>
          <span className="settings-row-desc">Run work in fixed sprints with breaks between.</span>
        </span>
        <Switch checked={pomodoroOn} onChange={(v) => updateSettings({ pomodoro_enabled: v })} />
      </div>

      <div className={pomodoroOn ? 'settings-nested' : 'settings-nested disabled'}>
        <div className="settings-row">
          <span>Work sprint</span>
          <select
            className="select"
            value={settings.default_session_minutes}
            onChange={(e) => updateSettings({ default_session_minutes: Number(e.target.value) })}
            disabled={!pomodoroOn}
          >
            {WORK_OPTIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <div className="settings-row">
          <span>Break</span>
          <select
            className="select"
            value={settings.default_break_minutes}
            onChange={(e) => updateSettings({ default_break_minutes: Number(e.target.value) })}
            disabled={!pomodoroOn}
          >
            {BREAK_OPTIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <div className="settings-row">
          <span>Start breaks automatically</span>
          <Switch checked={settings.auto_start_breaks} onChange={(v) => updateSettings({ auto_start_breaks: v })} disabled={!pomodoroOn} />
        </div>
        <div className="settings-row">
          <span>Start work sprints automatically</span>
          <Switch checked={settings.auto_start_next_sprint} onChange={(v) => updateSettings({ auto_start_next_sprint: v })} disabled={!pomodoroOn} />
        </div>
      </div>
    </>
  )
}
