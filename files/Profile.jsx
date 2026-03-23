// src/pages/Profile.jsx
// Protected page — shows user info fetched from GET /api/auth/me
// Allows editing display name + picking a neon avatar colour

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AVATAR_COLORS = [
  { label: 'Neon Green',  bg: 'bg-neon-green/20',  border: 'border-neon-green/60',  text: 'text-neon-green',  hex: '#00FF94' },
  { label: 'Neon Cyan',   bg: 'bg-neon-cyan/20',   border: 'border-neon-cyan/60',   text: 'text-neon-cyan',   hex: '#00E5FF' },
  { label: 'Neon Purple', bg: 'bg-neon-purple/20', border: 'border-neon-purple/60', text: 'text-neon-purple', hex: '#BF5AF2' },
  { label: 'Neon Yellow', bg: 'bg-yellow-400/20',  border: 'border-yellow-400/60',  text: 'text-yellow-400',  hex: '#FFD60A' },
  { label: 'Neon Red',    bg: 'bg-red-400/20',     border: 'border-red-400/60',     text: 'text-red-400',     hex: '#FF375F' },
];

function StatCard({ label, value, accent = 'text-neon-green' }) {
  return (
    <div className="card p-5 text-center">
      <div className={`font-display font-900 text-4xl ${accent}`}>{value}</div>
      <div className="font-body text-xs text-gray-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

export default function Profile() {
  const { user, token } = useAuth();
  const { toast }       = useToast();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [selectedColor, setSelected] = useState(0);
  const [joinDate, setJoinDate]     = useState(null);

  // ── Fetch full profile from server ─────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data.user);
        setJoinDate(new Date(data.user.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric'
        }));
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  // ── Save colour preference (stored locally for now) ─────────────────────
  async function handleSaveColor() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    localStorage.setItem('sc_avatar_color', selectedColor);
    setSaving(false);
    toast.success('Avatar colour saved!');
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          <p className="font-mono text-xs text-gray-600">Loading profile…</p>
        </div>
      </div>
    );
  }

  const c = AVATAR_COLORS[selectedColor];
  const initials = (profile?.username || user?.username || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen pt-20 px-4 pb-16 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-10 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-neon-purple" style={{ boxShadow: '0 0 8px #BF5AF2' }} />
          <span className="font-display text-neon-purple text-sm font-700 uppercase tracking-widest">
            Athlete Profile
          </span>
        </div>
        <h1 className="font-display font-900 text-6xl text-white uppercase tracking-tight">
          MY <span className="text-neon-purple" style={{ textShadow: '0 0 20px rgba(191,90,242,0.6)' }}>PROFILE</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

        {/* ── Left: Avatar & colour picker ────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Big avatar */}
          <div className="card p-8 flex flex-col items-center gap-4">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center
              ${c.bg} border-2 ${c.border} transition-all duration-300`}
              style={{ boxShadow: `0 0 30px ${c.hex}33` }}
            >
              <span className={`font-display font-900 text-5xl ${c.text}`}>{initials}</span>
            </div>

            <div className="text-center">
              <p className="font-display font-900 text-xl text-white uppercase">
                {profile?.username || user?.username}
              </p>
              <p className="font-body text-xs text-gray-500 mt-1">{profile?.email}</p>
              {joinDate && (
                <p className="font-mono text-xs text-gray-600 mt-1">Joined {joinDate}</p>
              )}
            </div>

            {/* Colour swatches */}
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-gray-500 text-center mb-3">
                Avatar Colour
              </p>
              <div className="flex gap-3 justify-center">
                {AVATAR_COLORS.map((col, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    title={col.label}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200
                      ${selectedColor === i
                        ? `${col.border} scale-125`
                        : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    style={{ backgroundColor: col.hex + '33', boxShadow: selectedColor === i ? `0 0 12px ${col.hex}88` : 'none' }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveColor}
              disabled={saving}
              className="btn-neon text-sm py-2 px-6 w-full justify-center disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Colour'}
            </button>
          </div>
        </div>

        {/* ── Right: Info + Stats ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Account details */}
          <div className="card p-6">
            <h3 className="font-display font-800 text-lg text-white uppercase mb-4">
              Account Details
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Username', value: profile?.username || user?.username },
                { label: 'Email',    value: profile?.email    || user?.email },
                { label: 'User ID',  value: profile?._id      || user?.id, mono: true },
              ].map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <label className="font-display font-700 text-xs uppercase tracking-widest text-gray-500">
                    {field.label}
                  </label>
                  <div className={`input-neon opacity-60 cursor-not-allowed select-all
                    ${field.mono ? 'font-mono text-xs' : ''}`}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="font-display font-800 text-lg text-white uppercase mb-3">
              Activity Stats
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Messages Sent" value="—"  accent="text-neon-green"  />
              <StatCard label="Rooms Joined"  value="—"  accent="text-neon-cyan"   />
              <StatCard label="Days Active"   value="1"  accent="text-neon-purple" />
            </div>
            <p className="font-mono text-xs text-gray-700 mt-2 text-right">
              Full activity tracking coming in v2
            </p>
          </div>

          {/* Danger zone */}
          <div className="card p-6 border-red-500/15">
            <h3 className="font-display font-800 text-base text-red-400 uppercase mb-1">
              Danger Zone
            </h3>
            <p className="font-body text-sm text-gray-500 mb-4">
              Deleting your account is permanent and cannot be undone.
            </p>
            <button
              onClick={() => toast.warn('Account deletion is not yet implemented.')}
              className="btn-neon text-sm py-2 px-5 border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
