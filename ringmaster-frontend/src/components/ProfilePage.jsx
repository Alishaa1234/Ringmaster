// src/components/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { loadTrips, deleteTrip } from '../services/trips.js'

export default function ProfilePage({ darkMode, onLoadTrip }) {
  const { user, logout } = useAuth()
  const [trips,   setTrips]   = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (user) fetchTrips()
  }, [user])

  async function fetchTrips() {
    setLoading(true)
    try {
      const data = await loadTrips(user.uid)
      setTrips(data)
    } catch (err) {
      console.error('Failed to load trips:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(tripId) {
    setDeleting(tripId)
    try {
      await deleteTrip(tripId)
      setTrips(prev => prev.filter(t => t.id !== tripId))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  const totalDays        = trips.reduce((sum, t) => sum + (t.duration || 0), 0)
  const destinations     = [...new Set(trips.map(t => t.destination))]
  const mostVisited      = destinations[0] || '—'

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Profile header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar */}
          <div className="relative">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold/40" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold/40 glass-card flex items-center justify-center text-3xl">
                👤
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0f0a05]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-2xl text-parchment truncate">
              {user?.displayName || 'Traveller'}
            </h2>
            <p className="font-mono text-[11px] text-silver tracking-wider truncate">
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">
                ● Active
              </span>
              <span className="font-mono text-[9px] text-silver">
                via Google
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button onClick={logout}
            className="font-mono text-[10px] tracking-wider uppercase px-4 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="🗺" label="Trips planned" value={trips.length} />
        <StatCard icon="📅" label="Days planned"  value={totalDays} />
        <StatCard icon="📍" label="Destinations"  value={destinations.length} />
      </div>

      {/* Top destination */}
      {trips.length > 0 && (
        <div className="glass-card p-5 flex items-center gap-4">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-60 mb-1">
              Top destination
            </p>
            <p className="font-display font-bold text-xl text-parchment">{mostVisited}</p>
          </div>
        </div>
      )}

      {/* Saved trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-70">
            ◈ Saved trips
          </p>
          <span className="font-mono text-[10px] text-silver">
            {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full mx-auto mb-3"
              style={{ animation: 'spin 1s linear infinite' }} />
            <p className="font-mono text-[10px] text-silver tracking-wider">Loading your trips…</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="glass-card p-10 text-center border-dashed border-gold/20">
            <div className="text-4xl mb-3 opacity-40">🎪</div>
            <p className="font-body italic text-silver text-sm">
              No saved trips yet. Plan your first adventure!
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onLoad={() => onLoadTrip(trip.plan)}
                onDelete={() => handleDelete(trip.id)}
                deleting={deleting === trip.id}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip, onLoad, onDelete, deleting, darkMode }) {
  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">

      {/* Destination icon + info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-xl shrink-0"
          style={{ borderColor: 'rgba(200,146,42,0.4)' }}>
          🗺
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-lg text-parchment truncate">
            {trip.destination}
          </div>
          <div className="font-mono text-[10px] text-silver tracking-wider">
            {trip.origin} · {trip.duration} days · {trip.travelDate}
          </div>
          {trip.summary && (
            <p className="font-body italic text-silver text-xs mt-1 line-clamp-1 leading-relaxed">
              {trip.summary}
            </p>
          )}
        </div>
      </div>

      {/* Date saved + actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[9px] text-silver/50 hidden sm:block">
          {trip.savedAt}
        </span>
        <button onClick={onLoad}
          className="font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border border-gold/30 text-gold bg-gold/5 hover:bg-gold/15 transition-all">
          Load
        </button>
        <button onClick={onDelete} disabled={deleting}
          className="font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-display font-bold text-2xl gold-text">{value}</div>
      <div className="font-mono text-[9px] text-silver tracking-widest uppercase mt-1">{label}</div>
    </div>
  )
}