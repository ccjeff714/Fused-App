import Switch from './Switch'

// success screen / gif / sound toggles. Gif nests under "show success
// screen"; success_sound_effect is a sibling, not nested, matching the
// mockup's layout exactly.
export default function CelebrationSettingsSection({ settings, updateSettings }) {
  return (
    <>
      <h2 className="eyebrow settings-section-label spaced">Celebrate completion</h2>
      <div className="settings-row">
        <span className="settings-row-title">Show success screen</span>
        <Switch checked={settings.show_success_screen} onChange={(v) => updateSettings({ show_success_screen: v })} />
      </div>
      <div className={settings.show_success_screen ? 'settings-nested' : 'settings-nested disabled'}>
        <div className="settings-row">
          <span>Gif on success screen</span>
          <Switch checked={settings.success_screen_gif} onChange={(v) => updateSettings({ success_screen_gif: v })} />
        </div>
      </div>
      <div className="settings-row">
        <span className="settings-row-title">Success sound effect</span>
        <Switch checked={settings.success_sound_effect} onChange={(v) => updateSettings({ success_sound_effect: v })} />
      </div>
    </>
  )
}
