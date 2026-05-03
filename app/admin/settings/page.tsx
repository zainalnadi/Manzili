'use client'

import { useEffect, useState } from 'react'

interface Settings {
  platformFeePercent: number
  minListingPrice: number
  maxFeaturedListings: number
  defaultCancellationPolicy: string
  autoApproveTrustedHosts: boolean
  announcementBanner: string
  notifyAdminNewHost: boolean
  notifyAdminNewListing: boolean
  maintenanceMode: boolean
}

const defaultSettings: Settings = {
  platformFeePercent: 10,
  minListingPrice: 0,
  maxFeaturedListings: 12,
  defaultCancellationPolicy: 'FLEXIBLE',
  autoApproveTrustedHosts: false,
  announcementBanner: '',
  notifyAdminNewHost: true,
  notifyAdminNewListing: true,
  maintenanceMode: false,
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Josefin Sans', sans-serif",
  fontWeight: 100,
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  paddingBottom: 12,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  marginBottom: 16,
}

const inputStyle: React.CSSProperties = {
  height: 36,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '0 12px',
  color: 'rgba(255,255,255,0.8)',
  fontSize: 13,
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 300,
  outline: 'none',
  width: 120,
}

function SettingRow({ label, description, children, warning }: { label: string; description?: string; children: React.ReactNode; warning?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 20 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{label}</p>
        {description && <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>{description}</p>}
        {warning && <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: 11, color: '#C9973A', margin: '6px 0 0' }}>{warning}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 48,
        height: 26,
        borderRadius: 999,
        background: on ? 'rgba(143,166,139,0.3)' : 'rgba(255,255,255,0.08)',
        border: on ? '1px solid rgba(143,166,139,0.5)' : '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 150ms',
        padding: 0,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: on ? '#8FA68B' : 'rgba(255,255,255,0.3)',
        position: 'absolute',
        top: 3,
        left: on ? 27 : 3,
        transition: 'left 150ms',
      }} />
    </button>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings({ ...defaultSettings, ...d }))
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: '0 0 24px' }}>Settings</h1>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 18, color: '#fff', margin: '0 0 28px' }}>Settings</h1>

      {/* PLATFORM ECONOMICS */}
      <div style={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <p style={sectionHeading}>Platform Economics</p>

        <SettingRow label="Platform Fee %" description="Percentage taken from each booking total">
          <input
            type="number"
            min={0}
            max={30}
            value={settings.platformFeePercent}
            onChange={(e) => set('platformFeePercent', Number(e.target.value))}
            style={inputStyle}
          />
        </SettingRow>

        <SettingRow label="Minimum Listing Price" description="Minimum price hosts can set (EGP)">
          <input
            type="number"
            min={0}
            value={settings.minListingPrice}
            onChange={(e) => set('minListingPrice', Number(e.target.value))}
            style={inputStyle}
          />
        </SettingRow>

        <SettingRow label="Max Featured Listings" description="Number of listings shown in featured section">
          <input
            type="number"
            min={0}
            max={100}
            value={settings.maxFeaturedListings}
            onChange={(e) => set('maxFeaturedListings', Number(e.target.value))}
            style={inputStyle}
          />
        </SettingRow>
      </div>

      {/* CONTENT & HOSTS */}
      <div style={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <p style={sectionHeading}>Content &amp; Hosts</p>

        <SettingRow label="Default Cancellation Policy">
          <select
            value={settings.defaultCancellationPolicy}
            onChange={(e) => set('defaultCancellationPolicy', e.target.value)}
            style={{ ...inputStyle, width: 160, cursor: 'pointer' }}
          >
            <option value="FLEXIBLE">FLEXIBLE</option>
            <option value="MODERATE">MODERATE</option>
            <option value="STRICT">STRICT</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Auto-approve Trusted Hosts"
          description="Bypasses manual review for qualified hosts"
          warning={settings.autoApproveTrustedHosts ? 'Bypasses manual review for hosts with 3+ approved listings' : undefined}
        >
          <Toggle on={settings.autoApproveTrustedHosts} onToggle={() => set('autoApproveTrustedHosts', !settings.autoApproveTrustedHosts)} />
        </SettingRow>
      </div>

      {/* COMMUNICATIONS */}
      <div style={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <p style={sectionHeading}>Communications</p>

        <SettingRow label="Announcement Banner" description="Leave empty to hide banner on main site">
          <input
            type="text"
            value={settings.announcementBanner}
            onChange={(e) => set('announcementBanner', e.target.value)}
            placeholder="e.g. We are performing maintenance…"
            style={{ ...inputStyle, width: 240 }}
          />
        </SettingRow>

        <SettingRow label="Notify admin — new host">
          <Toggle on={settings.notifyAdminNewHost} onToggle={() => set('notifyAdminNewHost', !settings.notifyAdminNewHost)} />
        </SettingRow>

        <SettingRow label="Notify admin — new listing">
          <Toggle on={settings.notifyAdminNewListing} onToggle={() => set('notifyAdminNewListing', !settings.notifyAdminNewListing)} />
        </SettingRow>
      </div>

      {/* SYSTEM */}
      <div style={{ background: '#1E1814', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <p style={sectionHeading}>System</p>

        <SettingRow
          label="Maintenance Mode"
          warning={settings.maintenanceMode ? 'Redirects all non-admin visitors' : undefined}
        >
          <Toggle on={settings.maintenanceMode} onToggle={() => set('maintenanceMode', !settings.maintenanceMode)} />
        </SettingRow>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '10px 32px',
            background: saved ? 'rgba(143,166,139,0.12)' : '#C4582A',
            border: saved ? '1px solid rgba(143,166,139,0.3)' : 'none',
            borderRadius: 999,
            color: saved ? '#8FA68B' : '#fff',
            fontSize: 11,
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 100,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 200ms',
          }}
        >
          {saving ? 'Saving…' : saved ? 'SAVED ✓' : 'SAVE CHANGES'}
        </button>
      </div>
    </div>
  )
}
