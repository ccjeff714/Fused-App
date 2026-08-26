import Switch from './Switch'

// success screen / gif / sound toggles. Gif is fully hidden (not just
// grayed out) when show_success_screen is off, per manual-test feedback.
// success_sound_effect stays visible and independent regardless — it's a
// sibling toggle, not nested under show_success_screen.
export default function CelebrationSettingsSection({ settings, updateSettings }) {
  return (
    <>
      <h2 className="eyebrow settings-section-label spaced">Celebrate completion</h2>
      <div className="settings-row">
        <span className="settings-row-title">Show success screen</span>
        <Switch checked={settings.show_success_screen} onChange={(v) => updateSettings({ show_success_screen: v })} />
      </div>
      {settings.show_success_screen && (
        <div className="settings-nested">
          <div className="settings-row">
            <span>Gif on success screen</span>
            <Switch
              checked={settings.success_screen_gif}
              onChange={(v) => updateSettings({ success_screen_gif: v })}
            />
          </div>
        </div>
      )}
      <div className="settings-row">
        <span className="settings-row-title">Success sound effect</span>
        <Switch checked={settings.success_sound_effect} onChange={(v) => updateSettings({ success_sound_effect: v })} />
      </div>
    </>
  )
}
