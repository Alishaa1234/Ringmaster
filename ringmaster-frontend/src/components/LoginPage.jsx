// src/components/LoginPage.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage({ darkMode }) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: darkMode
          ? 'radial-gradient(ellipse at 30% 20%, rgba(139,26,26,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(26,95,106,0.2) 0%, transparent 60%), #0f0a05'
          : '#fdf6e8',
      }}>

      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#c8922a 0,#c8922a 1px,transparent 1px,transparent 60px)',
      }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎪</div>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold opacity-60 mb-2">
            ✦ The Grand Orchestrator's Platform ✦
          </p>
          <h1 className="font-display font-black gold-text leading-tight"
            style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>
            Ringmaster's Round Table
          </h1>
          <p className={`font-body italic mt-2 text-sm ${darkMode ? 'text-silver' : 'text-[#6a5a50]'}`}>
            Plan extraordinary journeys across India
          </p>
        </div>

        {/* Sign in card */}
        <div className="glass-card p-8 text-center">
          <div className="mb-6">
            <p className="font-mono text-[10px] tracking-widest uppercase text-gold opacity-60 mb-3">
              ◈ Welcome
            </p>
            <h2 className="font-display font-bold text-2xl text-parchment mb-2">
              Sign in to continue
            </h2>
            <p className={`font-body text-sm leading-relaxed ${darkMode ? 'text-silver' : 'text-[#6a5a50]'}`}>
              Save your trips, compare destinations, and plan your next adventure
            </p>
          </div>

          {/* Google sign in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mb-4"
            style={{
              background: 'white',
              borderColor: 'rgba(200,146,42,0.3)',
              color: '#1a1008',
            }}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full"
                style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <GoogleIcon />
            )}
            <span className="font-mono text-sm font-bold tracking-wide">
              {loading ? 'Signing in…' : 'Continue with Google'}
            </span>
          </button>

          {error && (
            <p className="font-mono text-[10px] text-red-400 mt-2">{error}</p>
          )}

          {/* Features list */}
          <div className="mt-6 pt-6 border-t border-gold/20 grid grid-cols-3 gap-3">
            {[
              { icon: '🗺', label: 'Plan trips' },
              { icon: '💾', label: 'Save plans' },
              { icon: '⚖', label: 'Compare' },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="font-mono text-[9px] text-silver tracking-wider uppercase">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center font-mono text-[9px] text-silver/30 mt-6 tracking-wider">
          By signing in you agree to use this platform responsibly
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}