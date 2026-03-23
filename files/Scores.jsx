// src/pages/Scores.jsx
// Fetches mock live scores + league standings from Express /api/sports/scores

import { useState, useEffect, useRef } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    LIVE:  { text: 'LIVE',  cls: 'text-neon-red bg-red-500/10 border-red-500/30 animate-pulse-neon' },
    FT:    { text: 'FT',    cls: 'text-gray-500 bg-pitch-700 border-gray-700' },
    NS:    { text: 'SOON',  cls: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30' },
  };
  const s = map[status] || map.FT;
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${s.cls}`}>{s.text}</span>
  );
}

function MatchCard({ match }) {
  const isLive = match.status === 'LIVE';
  return (
    <div className={`card p-4 transition-all ${isLive ? 'border-red-500/30 shadow-[0_0_20px_rgba(255,55,95,0.08)]' : ''}`}>
      {/* League & time */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-gray-600">{match.league}</span>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 text-right">
          <p className="font-display font-800 text-sm uppercase text-white leading-tight">
            {match.home}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 min-w-[72px] justify-center">
          {match.status !== 'NS' ? (
            <>
              <span className={`font-display font-900 text-2xl ${isLive ? 'text-white' : 'text-gray-400'}`}>
                {match.homeScore}
              </span>
              <span className="font-display font-900 text-xl text-gray-600 mx-1">:</span>
              <span className={`font-display font-900 text-2xl ${isLive ? 'text-white' : 'text-gray-400'}`}>
                {match.awayScore}
              </span>
            </>
          ) : (
            <span className="font-mono text-sm text-gray-600">{match.kickoff}</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1">
          <p className="font-display font-800 text-sm uppercase text-white leading-tight">
            {match.away}
          </p>
        </div>
      </div>

      {/* Live minute */}
      {isLive && (
        <div className="mt-2 text-center">
          <span className="font-mono text-xs text-neon-red">{match.minute}'</span>
        </div>
      )}
    </div>
  );
}

const STANDING_COLS = ['#', 'Club', 'P', 'W', 'D', 'L', 'GD', 'Pts'];

function StandingsTable({ standings }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neon-green/10">
            {STANDING_COLS.map((h) => (
              <th key={h}
                className={`font-display font-700 uppercase text-xs tracking-widest text-gray-500 py-3
                  ${h === 'Club' ? 'text-left pl-4 pr-2' : 'text-center px-2'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const zone =
              i < 4  ? 'border-l-2 border-neon-green'   :  // Champions League
              i < 6  ? 'border-l-2 border-neon-cyan'    :  // Europa League
              i >= standings.length - 3 ? 'border-l-2 border-red-500' :  // Relegation
              'border-l-2 border-transparent';

            return (
              <tr key={row.club}
                className={`border-b border-white/5 hover:bg-white/3 transition-colors ${zone}`}
              >
                <td className="text-center py-2.5 px-2 font-mono text-xs text-gray-500">{i + 1}</td>
                <td className="text-left pl-3 pr-2 font-display font-700 text-white uppercase text-xs py-2.5">
                  {row.club}
                </td>
                <td className="text-center px-2 font-mono text-xs text-gray-400">{row.p}</td>
                <td className="text-center px-2 font-mono text-xs text-gray-400">{row.w}</td>
                <td className="text-center px-2 font-mono text-xs text-gray-400">{row.d}</td>
                <td className="text-center px-2 font-mono text-xs text-gray-400">{row.l}</td>
                <td className={`text-center px-2 font-mono text-xs
                  ${row.gd > 0 ? 'text-neon-green' : row.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}
                >
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="text-center px-2 font-display font-900 text-sm text-white py-2.5">{row.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Zone legend */}
      <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-white/5">
        {[
          { color: 'bg-neon-green',  label: 'Champions League' },
          { color: 'bg-neon-cyan',   label: 'Europa League'    },
          { color: 'bg-red-500',     label: 'Relegation'       },
        ].map((z) => (
          <div key={z.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${z.color}`} />
            <span className="font-mono text-xs text-gray-600">{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Scores() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeLeague, setLeague] = useState('Premier League');
  const [lastUpdated, setUpdated] = useState(null);
  const intervalRef = useRef(null);

  async function fetchScores() {
    try {
      const res = await fetch('/api/sports/scores');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchScores();
    intervalRef.current = setInterval(fetchScores, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const leagues = data ? Object.keys(data.matches) : [];
  const matches  = data?.matches?.[activeLeague] || [];
  const standings = data?.standings?.[activeLeague] || [];
  const liveCount = Object.values(data?.matches || {})
    .flat()
    .filter((m) => m.status === 'LIVE').length;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-neon-red" style={{ boxShadow: '0 0 8px #FF375F' }} />
              <span className="font-display text-neon-red text-sm font-700 uppercase tracking-widest">
                {liveCount > 0 ? `${liveCount} live now` : 'Scores & Standings'}
              </span>
            </div>
            <h1 className="font-display font-900 uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            >
              <span className="text-white">LIVE </span>
              <span className="text-neon-red" style={{ textShadow: '0 0 20px rgba(255,55,95,0.5)' }}>SCORES</span>
            </h1>
          </div>

          {/* Refresh info */}
          <div className="flex flex-col items-end gap-1">
            {lastUpdated && (
              <p className="font-mono text-xs text-gray-600">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
            <button
              onClick={fetchScores}
              className="font-mono text-xs text-neon-cyan hover:text-white transition-colors border border-neon-cyan/20 px-3 py-1 rounded"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* League tabs */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2 mb-6">
          {leagues.map((l) => (
            <button
              key={l}
              onClick={() => setLeague(l)}
              className={`px-4 py-2 rounded font-display font-700 text-sm uppercase tracking-wide transition-all
                ${activeLeague === l
                  ? 'bg-neon-green/15 text-neon-green border border-neon-green/40'
                  : 'text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-300'
                }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-8 text-center">
          <p className="font-display text-3xl text-neon-red mb-2">⚡ FEED ERROR</p>
          <p className="font-body text-gray-500 text-sm">{error}</p>
          <p className="font-mono text-xs text-gray-700 mt-2">
            Ensure Express server is running on port 3000
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-24" />
          ))}
        </div>
      )}

      {/* Content: Matches + Standings side by side */}
      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Match results — 2 cols */}
          <div className="xl:col-span-2 space-y-3">
            <h2 className="font-display font-800 text-base uppercase text-gray-400 tracking-widest">
              Fixtures &amp; Results
            </h2>
            {matches.length === 0
              ? <p className="font-body text-gray-600 text-sm">No matches today.</p>
              : matches.map((m, i) => <MatchCard key={i} match={m} />)
            }
          </div>

          {/* Standings — 3 cols */}
          <div className="xl:col-span-3">
            <h2 className="font-display font-800 text-base uppercase text-gray-400 tracking-widest mb-3">
              Table
            </h2>
            {standings.length > 0
              ? <StandingsTable standings={standings} />
              : <p className="font-body text-gray-600 text-sm">Standings not available.</p>
            }
          </div>
        </div>
      )}
    </div>
  );
}
