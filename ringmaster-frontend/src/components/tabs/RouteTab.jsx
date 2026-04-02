// src/components/tabs/RouteTab.jsx
import { useEffect, useRef, useState } from 'react'

const STARS = [1, 2, 3, 4, 5]

export default function RouteTab({ route }) {
  if (!route) return <Placeholder />

  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle />

      {/* Route header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="font-display font-bold text-xl text-parchment">{route.from}</div>
            <div className="font-mono text-[10px] text-silver uppercase tracking-wider mt-1">Origin</div>
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-px bg-gradient-to-r from-gold/20 via-gold/60 to-gold/20" />
            <div className="font-mono text-[10px] text-gold whitespace-nowrap">~{route.distanceKm} km</div>
            <div className="flex-1 h-px bg-gradient-to-r from-gold/20 via-gold/60 to-gold/20" />
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-xl text-parchment">{route.to}</div>
            <div className="font-mono text-[10px] text-silver uppercase tracking-wider mt-1">Destination</div>
          </div>
        </div>
      </div>

      {/* ── LEAFLET MAP ── */}
      <LeafletMap route={route} />

      {/* Transport options */}
      <div className="glass-card p-5">
        <SectionTitle>Transport options</SectionTitle>
        <div className="space-y-3">
          {route.transportOptions.map((opt, i) => (
            <div key={i}
              className={`flex flex-wrap items-center gap-4 p-4 rounded-lg border transition-all ${
                opt.recommended
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-white/[0.02] border-gold/10 hover:border-gold/25'
              }`}>
              <div className="font-body text-parchment text-base w-28">{opt.mode}</div>
              <div className="flex-1 min-w-[80px]">
                <div className="font-mono text-[10px] text-silver">Duration</div>
                <div className="font-body text-cream text-sm">{opt.duration}</div>
              </div>
              <div className="flex-1 min-w-[80px]">
                <div className="font-mono text-[10px] text-silver">Cost</div>
                <div className="font-body text-cream text-sm">{opt.cost}</div>
              </div>
              <div className="min-w-[80px]">
                <div className="font-mono text-[10px] text-silver mb-1">Comfort</div>
                <div className="flex gap-0.5">
                  {STARS.map(s => (
                    <span key={s} className={`text-sm ${s <= opt.comfort ? 'text-gold' : 'text-silver/30'}`}>★</span>
                  ))}
                </div>
              </div>
              {opt.recommended && (
                <span className="font-mono text-[10px] tracking-wider uppercase text-gold bg-gold/10 border border-gold/30 px-2 py-1 rounded-full">
                  Recommended
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scenic note */}
      <div className="glass-card p-5 border-[#6abf6a]/30">
        <SectionTitle>🌿 Scenic highlights</SectionTitle>
        <p className="text-cream text-base leading-relaxed">{route.scenicNote}</p>
      </div>

      {/* Source */}
      <p className="font-mono text-[9px] text-silver/40 tracking-wider text-right">{route.source}</p>
    </div>
  )
}

// ── LEAFLET MAP COMPONENT ──────────────────────────────────────────────────

function LeafletMap({ route }) {
  const mapRef       = useRef(null)
  const mapInstance  = useRef(null)
  const [mapReady,   setMapReady]   = useState(false)
  const [mapStyle,   setMapStyle]   = useState('street') // street | satellite | terrain
  const [showWaypoints, setShowWaypoints] = useState(true)
  const layersRef    = useRef([])

  const hasCoords = route.originCoords && route.destinationCoords

  useEffect(() => {
    if (!hasCoords || mapInstance.current) return

    // Dynamically load Leaflet CSS + JS
    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id  = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.onload  = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      initMap()
    }

    loadLeaflet().catch(console.error)
  }, [hasCoords])

  function getTileUrl(style) {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    }
  }

  function getTileAttrib(style) {
    switch (style) {
      case 'satellite': return '© Esri'
      case 'terrain':   return '© OpenTopoMap'
      default:          return '© CartoDB'
    }
  }

  function initMap() {
    const L = window.L
    if (!mapRef.current || mapInstance.current) return

    const { lat: olat, lng: olng } = route.originCoords
    const { lat: dlat, lng: dlng } = route.destinationCoords

    // Center on midpoint
    const centerLat = (olat + dlat) / 2
    const centerLng = (olng + dlng) / 2

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom:   6,
      zoomControl: true,
    })
    mapInstance.current = map

    // Dark tile layer
    L.tileLayer(getTileUrl('street'), {
      attribution: getTileAttrib('street'),
      maxZoom: 18,
    }).addTo(map)

    renderMapLayers(map, route)
    setMapReady(true)

    // Fit map to route bounds
    const bounds = L.latLngBounds([
      [olat, olng],
      [dlat, dlng],
      ...(route.waypoints?.map(w => [w.lat, w.lng]) || []),
    ])
    map.fitBounds(bounds, { padding: [50, 50] })
  }

  function renderMapLayers(map, route) {
    const L = window.L

    // Clear existing layers
    layersRef.current.forEach(layer => map.removeLayer(layer))
    layersRef.current = []

    // ── Route polyline ──
    if (route.routePolyline?.length > 1) {
      // Animated dashed route
      const polyline = L.polyline(route.routePolyline, {
        color:     '#c8922a',
        weight:    3,
        opacity:   0.8,
        dashArray: '8 4',
      }).addTo(map)

      // Glow effect underneath
      const glowLine = L.polyline(route.routePolyline, {
        color:   '#e8b84b',
        weight:  8,
        opacity: 0.15,
      }).addTo(map)

      layersRef.current.push(polyline, glowLine)
    } else if (route.originCoords && route.destinationCoords) {
      // Straight line fallback
      const { lat: olat, lng: olng } = route.originCoords
      const { lat: dlat, lng: dlng } = route.destinationCoords
      const line = L.polyline([[olat, olng], [dlat, dlng]], {
        color: '#c8922a', weight: 3, opacity: 0.8, dashArray: '8 4',
      }).addTo(map)
      layersRef.current.push(line)
    }

    // ── Custom SVG markers ──
    function makeIcon(type, label) {
      const colors = {
        origin:      { bg: '#8b1a1a', border: '#c42b2b', text: '#faf3e8' },
        destination: { bg: '#1a5f6a', border: '#2a8a99', text: '#faf3e8' },
        waypoint:    { bg: '#2d1b4e', border: '#c8922a', text: '#e8b84b' },
      }
      const c = colors[type] || colors.waypoint
      const size = type === 'waypoint' ? 28 : 36

      return L.divIcon({
        className: '',
        html: `
          <div style="
            width:${size}px; height:${size}px;
            background:${c.bg};
            border:2px solid ${c.border};
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-family:serif; font-size:${type==='waypoint'?9:11}px;
            font-weight:bold; color:${c.text};
            box-shadow:0 0 12px ${c.border}60;
            cursor:pointer;
          ">${type==='origin'?'A':type==='destination'?'B':'●'}</div>
          <div style="
            position:absolute; bottom:-20px; left:50%;
            transform:translateX(-50%);
            white-space:nowrap;
            font-size:9px; font-family:monospace;
            color:${c.border}; letter-spacing:0.05em;
            text-shadow:0 0 6px #000;
          ">${label}</div>
        `,
        iconSize:   [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor:[0, -size/2 - 10],
      })
    }

    // Add waypoint markers
    if (showWaypoints && route.waypoints?.length) {
      route.waypoints.forEach(wp => {
        const marker = L.marker([wp.lat, wp.lng], {
          icon: makeIcon(wp.type, wp.name),
        })
        .bindPopup(`
          <div style="font-family:serif; color:#1a1008; min-width:160px;">
            <strong style="font-size:14px;">${wp.name}</strong><br>
            <span style="font-size:12px; color:#6a5a50;">${wp.description || wp.type}</span>
          </div>
        `, { maxWidth: 200 })
        .addTo(map)

        layersRef.current.push(marker)
      })
    }

    // ── Distance marker at midpoint ──
    if (route.originCoords && route.destinationCoords) {
      const { lat: olat, lng: olng } = route.originCoords
      const { lat: dlat, lng: dlng } = route.destinationCoords
      const midLat = (olat + dlat) / 2
      const midLng = (olng + dlng) / 2

      const distMarker = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              background:#0f0a05cc;
              border:1px solid #c8922a60;
              border-radius:4px;
              padding:3px 8px;
              font-family:monospace;
              font-size:10px;
              color:#e8b84b;
              white-space:nowrap;
              letter-spacing:0.05em;
            ">~${route.distanceKm} km</div>
          `,
          iconAnchor: [30, 12],
        }),
      }).addTo(map)
      layersRef.current.push(distMarker)
    }
  }

  function switchMapStyle(style) {
    setMapStyle(style)
    const map = mapInstance.current
    if (!map || !window.L) return
    map.eachLayer(layer => {
      if (layer._url) map.removeLayer(layer)
    })
    window.L.tileLayer(getTileUrl(style), {
      attribution: getTileAttrib(style),
      maxZoom: 18,
    }).addTo(map)
  }

  function toggleWaypointsOnMap() {
    const next = !showWaypoints
    setShowWaypoints(next)
    if (mapInstance.current) {
      renderMapLayers(mapInstance.current, {
        ...route,
        waypoints: next ? route.waypoints : [],
      })
    }
  }

  if (!hasCoords) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[240px] border-dashed border-gold/20">
        <div className="text-3xl mb-3 opacity-30">🗺</div>
        <p className="font-mono text-xs text-silver tracking-wider text-center">
          Map unavailable — city coordinates not found
        </p>
        <p className="font-mono text-[10px] text-silver/40 mt-1">
          {route.from} → {route.to}
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Map controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gold/20 flex-wrap">
        <span className="font-mono text-[10px] text-gold opacity-60 tracking-wider uppercase mr-2">
          Map style
        </span>
        {['street', 'satellite', 'terrain'].map(style => (
          <button key={style} onClick={() => switchMapStyle(style)}
            className={`font-mono text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border transition-all ${
              mapStyle === style
                ? 'text-gold border-gold/50 bg-gold/10'
                : 'text-silver border-silver/20 hover:border-gold/30'
            }`}>
            {style}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={toggleWaypointsOnMap}
          className={`font-mono text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border transition-all ${
            showWaypoints
              ? 'text-teal-light border-teal-light/40 bg-teal/10'
              : 'text-silver border-silver/20'
          }`}>
          {showWaypoints ? '● Waypoints on' : '○ Waypoints off'}
        </button>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height: '420px', width: '100%', background: '#0f0a05' }}
      />

      {!mapReady && hasCoords && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f0a05]/80">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full mx-auto mb-2"
              style={{animation:'spin 1s linear infinite'}} />
            <p className="font-mono text-[10px] text-silver tracking-wider">Loading map…</p>
          </div>
        </div>
      )}

      {/* Waypoints legend */}
      {route.waypoints?.length > 0 && (
        <div className="px-4 py-3 border-t border-gold/20 flex flex-wrap gap-3">
          {route.waypoints.map((wp, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                wp.type === 'origin' ? 'bg-crimson-light' :
                wp.type === 'destination' ? 'bg-teal-light' : 'bg-gold'
              }`} />
              <span className="font-mono text-[10px] text-silver">{wp.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h3 className="font-display text-gold font-bold text-base mb-4 border-l-2 border-gold pl-3">
      {children}
    </h3>
  )
}

function PanelTitle() {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="text-2xl">🗺</span>
      <div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-[#6abf6a] opacity-80">Trailblazer</div>
        <h2 className="font-display text-xl font-bold text-parchment">Route & interactive map</h2>
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="text-center py-16 opacity-40">
      <div className="text-4xl mb-3">🗺</div>
      <p className="font-mono text-xs text-silver tracking-wider">No route data available</p>
    </div>
  )
}