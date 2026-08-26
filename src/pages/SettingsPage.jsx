import { useSettings } from '../hooks/useSettings'
import TimerSettingsSection from '../components/settings/TimerSettingsSection'
import CelebrationSettingsSection from '../components/settings/CelebrationSettingsSection'
import SessionBackgroundUpload from '../components/settings/SessionBackgroundUpload'

export default function SettingsPage({ session, signOut }) {
  const { settings, loading, error, updateSettings } = useSettings(session)

  return (
    <main className="screen">
      <div className="settings-page">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Preferences</div>
        <h1 className="screen-title" style={{ marginBottom: 48 }}>Settings</h1>

        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <TimerSettingsSection settings={settings} updateSettings={updateSettings} />
            <CelebrationSettingsSection settings={settings} updateSettings={updateSettings} />

            <h2 className="eyebrow settings-section-label spaced">Session</h2>
            <SessionBackgroundUpload session={session} settings={settings} updateSettings={updateSettings} />

            <h2 className="eyebrow settings-section-label spaced">Account</h2>
            <div className="settings-row">
              <span>{session.user.email}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={signOut}>Sign out</button>
            </div>

            <p className="settings-footer">Fused 0.2</p>
          </>
        )}
      </div>
    </main>
  )
}
