// src/components/tabs/RouteTab.jsx
import { useEffect, useRef, useState } from 'react'

const STARS = [1, 2, 3, 4, 5]

// Tile layer configs
const TILE_LAYERS = {
  osm: {
    label: '🗺 Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attrib: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  },
  carto: {
    label: '🌙 Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attrib: '© <a href="https://carto.com">CartoDB</a>',
    maxZoom: 19,
  },
  topo: {
    label: '⛰ Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attrib: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  satellite: {
    label: '🛰 Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attrib: '© <a href="https://esri.com">Esri</a>',
    maxZoom: 18,
  },
  humanitarian: {
    label: '🏙 City',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attrib: '© OpenStreetMap HOT',
    maxZoom: 19,
  },
}

export default function RouteTab({ route }) {
  if (!route) return <Placeholder />
  return (
    <div className="animate-fade-up space-y-5">
      <PanelTitle />
      <RouteHeader route={route} />
      <LeafletMap route={route} />
      <TransportOptions route={route} />
      <ScenicNote route={route} />
    </div>
  )
}

function RouteHeader({ route }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-center min-w-[80px]">
          <div className="font-display font-bold text-xl text-parchment">{route.from}</div>
          <div className="font-mono text-[9px] text-silver uppercase tracking-widest mt-1">Origin</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1 min-w-[100px]">
          <div className="w-full h-px bg-gradient-to-r from-gold/10 via-gold to-gold/10" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gold">~{route.distanceKm} km</span>
            <span className="text-silver/40 text-[10px]">·</span>
            <span className="font-mono text-[10px] text-silver">
              {route.transportOptions?.find(o => o.recommended)?.duration || '—'}
            </span>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-gold/10 via-gold to-gold/10" />
        </div>
        <div className="text-center min-w-[80px]">
          <div className="font-display font-bold text-xl text-parchment">{route.to}</div>
          <div className="font-mono text-[9px] text-silver uppercase tracking-widest mt-1">Destination</div>
        </div>
      </div>
    </div>
  )
}

function LeafletMap({ route }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const tileRef     = useRef(null)
  const layersRef   = useRef([])
  const [mapReady,  setMapReady]  = useState(false)
  const [tileStyle, setTileStyle] = useState('osm')
  const [showWp,    setShowWp]    = useState(true)
  const [activeWp,  setActiveWp]  = useState(null)
  const [zoom,      setZoom]      = useState(6)

  const hasCoords = route.originCoords && route.destinationCoords

  useEffect(() => {
    if (!hasCoords || mapInstance.current) return
    loadLeaflet().then(initMap)
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [hasCoords])

  async function loadLeaflet() {
    if (!document.getElementById('leaflet-css')) {
      const link = Object.assign(document.createElement('link'), {
        id: 'leaflet-css', rel: 'stylesheet',
        href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      })
      document.head.appendChild(link)
    }
    if (!window.L) {
      await new Promise((resolve, reject) => {
        const s = Object.assign(document.createElement('script'), {
          src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
          onload: resolve, onerror: reject,
        })
        document.head.appendChild(s)
      })
    }
  }

  function initMap() {
    const L = window.L
    if (!mapRef.current || mapInstance.current) return

    const { lat: olat, lng: olng } = route.originCoords
    const { lat: dlat, lng: dlng } = route.destinationCoords
    const centerLat = (olat + dlat) / 2
    const centerLng = (olng + dlng) / 2

    const map = L.map(mapRef.current, {
      center:        [centerLat, centerLng],
      zoom:          6,
      zoomControl:   false,
      attributionControl: false,
    })
    mapInstance.current = map

    // Custom zoom control position
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

    // Track zoom level
    map.on('zoom', () => setZoom(map.getZoom()))

    // Default tile
    const cfg = TILE_LAYERS['osm']
    tileRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attrib,
      maxZoom: cfg.maxZoom,
    }).addTo(map)

    renderLayers(map, route, true)
    setMapReady(true)

    // Fit bounds with padding
    const allPoints = [
      [olat, olng], [dlat, dlng],
      ...(route.waypoints?.map(w => [w.lat, w.lng]) || []),
    ]
    map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] })
  }

  function renderLayers(map, route, showWaypoints) {
    const L = window.L
    layersRef.current.forEach(l => { try { map.removeLayer(l) } catch {} })
    layersRef.current = []

    // ── Route polyline ──────────────────────────────────────────────────
    if (route.routePolyline?.length > 1) {
      // Shadow/glow underneath
      const shadow = L.polyline(route.routePolyline, {
        color: '#000', weight: 7, opacity: 0.3,
      }).addTo(map)

      // Main route line
      const main = L.polyline(route.routePolyline, {
        color: '#2563eb', weight: 5, opacity: 0.85,
        lineJoin: 'round', lineCap: 'round',
      }).addTo(map)

      // Animated travel direction arrows
      const arrows = L.polyline(route.routePolyline, {
        color:     '#60a5fa',
        weight:    3,
        opacity:   0.6,
        dashArray: '1 12',
        dashOffset:'0',
      }).addTo(map)

      layersRef.current.push(shadow, main, arrows)
    }

    if (!showWaypoints || !route.waypoints?.length) return

    // ── Markers ─────────────────────────────────────────────────────────
    route.waypoints.forEach((wp, idx) => {
      const isOrigin = wp.type === 'origin'
      const isDest   = wp.type === 'destination'
      const isStop   = wp.type === 'waypoint'

      const icon = L.divIcon({
        className: '',
        html: isOrigin || isDest ? `
          <div style="position:relative">
            <div style="
              width:${isOrigin||isDest?40:28}px;
              height:${isOrigin||isDest?40:28}px;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              background:${isOrigin?'#1d4ed8':isDest?'#15803d':'#92400e'};
              border:3px solid #fff;
              box-shadow:0 3px 12px rgba(0,0,0,0.4);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="transform:rotate(45deg);color:#fff;font-size:14px;font-weight:bold;">
                ${isOrigin?'A':isDest?'B':idx}
              </span>
            </div>
            <div style="
              position:absolute;
              bottom:-22px;left:50%;
              transform:translateX(-50%);
              white-space:nowrap;
              font-size:10px;
              font-family:monospace;
              font-weight:bold;
              color:#1e293b;
              background:rgba(255,255,255,0.95);
              padding:1px 5px;
              border-radius:3px;
              box-shadow:0 1px 4px rgba(0,0,0,0.3);
            ">${wp.name}</div>
          </div>
        ` : `
          <div style="position:relative">
            <div style="
              width:22px;height:22px;
              border-radius:50%;
              background:#f59e0b;
              border:2px solid #fff;
              box-shadow:0 2px 8px rgba(0,0,0,0.35);
            "></div>
            <div style="
              position:absolute;bottom:-18px;left:50%;
              transform:translateX(-50%);
              white-space:nowrap;font-size:9px;
              font-family:monospace;color:#1e293b;
              background:rgba(255,255,255,0.9);
              padding:1px 4px;border-radius:2px;
            ">${wp.name}</div>
          </div>
        `,
        iconSize:   [isOrigin||isDest?40:22, isOrigin||isDest?40:22],
        iconAnchor: [isOrigin||isDest?20:11, isOrigin||isDest?40:22],
        popupAnchor:[0, -(isOrigin||isDest?44:26)],
      })

      const popup = L.popup({ maxWidth: 220, className: '' }).setContent(`
        <div style="font-family:sans-serif;padding:4px">
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:4px">${wp.name}</div>
          <div style="font-size:12px;color:#475569">${wp.description || ''}</div>
          <div style="margin-top:4px;display:inline-block;font-size:10px;font-weight:600;
            padding:2px 6px;border-radius:10px;
            background:${isOrigin?'#dbeafe':isDest?'#dcfce7':'#fef3c7'};
            color:${isOrigin?'#1d4ed8':isDest?'#15803d':'#92400e'}">
            ${isOrigin?'Origin':isDest?'Destination':'Stop'}
          </div>
        </div>
      `)

      const marker = L.marker([wp.lat, wp.lng], { icon })
        .bindPopup(popup)
        .on('click', () => setActiveWp(wp.name))
        .addTo(map)

      layersRef.current.push(marker)
    })

    // ── Distance label at midpoint ───────────────────────────────────────
    if (route.routePolyline?.length > 1) {
      const mid = route.routePolyline[Math.floor(route.routePolyline.length / 2)]
      const distLabel = L.marker(mid, {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              background:rgba(255,255,255,0.96);
              border:1.5px solid #2563eb;
              border-radius:6px;
              padding:3px 8px;
              font-family:monospace;
              font-size:11px;
              font-weight:700;
              color:#1d4ed8;
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.2);
            ">~${route.distanceKm} km</div>
          `,
          iconAnchor: [35, 12],
        }),
        interactive: false,
      }).addTo(map)
      layersRef.current.push(distLabel)
    }
  }

  function switchTile(key) {
    setTileStyle(key)
    const map = mapInstance.current
    const L   = window.L
    if (!map || !L) return
    if (tileRef.current) map.removeLayer(tileRef.current)
    const cfg = TILE_LAYERS[key]
    tileRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attrib,
      maxZoom: cfg.maxZoom,
    }).addTo(map)
    map.attributionControl.setPrefix(cfg.attrib)
  }

  function toggleWaypoints() {
    const next = !showWp
    setShowWp(next)
    if (mapInstance.current) {
      renderLayers(mapInstance.current, route, next)
    }
  }

  function recenter() {
    const map = mapInstance.current
    const L   = window.L
    if (!map || !L || !hasCoords) return
    const { lat: olat, lng: olng } = route.originCoords
    const { lat: dlat, lng: dlng } = route.destinationCoords
    const allPoints = [
      [olat, olng], [dlat, dlng],
      ...(route.waypoints?.map(w => [w.lat, w.lng]) || []),
    ]
    map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60], animate: true })
  }

  if (!hasCoords) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[280px] border-dashed border-gold/20">
        <div className="text-4xl mb-3 opacity-30">🗺</div>
        <p className="font-mono text-xs text-silver tracking-wider">Map unavailable — city not in database</p>
        <p className="font-mono text-[10px] text-silver/40 mt-1">{route.from} → {route.to}</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">

      {/* ── Controls bar ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gold/20 overflow-x-auto">
        <div className="flex gap-1 shrink-0">
          {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
            <button key={key} onClick={() => switchTile(key)}
              className={`font-mono text-[9px] tracking-wide uppercase px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                tileStyle === key
                  ? 'text-gold border-gold/50 bg-gold/10'
                  : 'text-silver border-silver/20 hover:border-gold/30 hover:text-parchment'
              }`}>
              {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={toggleWaypoints}
          className={`font-mono text-[9px] tracking-wide uppercase px-2.5 py-1 rounded-full border transition-all whitespace-nowrap shrink-0 ${
            showWp ? 'text-blue-400 border-blue-400/40 bg-blue-400/10' : 'text-silver border-silver/20'
          }`}>
          {showWp ? '● Stops' : '○ Stops'}
        </button>
        <button onClick={recenter}
          className="font-mono text-[9px] tracking-wide uppercase px-2.5 py-1 rounded-full border border-silver/20 text-silver hover:border-gold/30 hover:text-parchment transition-all shrink-0">
          ⊕ Fit
        </button>
      </div>

      {/* ── Map ── */}
      <div style={{ position: 'relative' }}>
        <div ref={mapRef} style={{ height: '480px', width: '100%' }} />

        {/* Zoom indicator */}
        {mapReady && (
          <div style={{
            position: 'absolute', bottom: '40px', left: '12px', zIndex: 1000,
            background: 'rgba(15,10,5,0.8)', border: '1px solid rgba(200,146,42,0.3)',
            borderRadius: '4px', padding: '2px 8px',
            fontFamily: 'monospace', fontSize: '10px', color: '#e8b84b',
          }}>
            Z{zoom}
          </div>
        )}

        {/* Loading overlay */}
        {!mapReady && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#0f0a05',
          }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full mx-auto mb-2"
                style={{animation:'spin 1s linear infinite'}} />
              <p className="font-mono text-[10px] text-silver tracking-wider">Loading map…</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Waypoints legend ── */}
      {route.waypoints?.length > 0 && (
        <div className="px-4 py-3 border-t border-gold/20 flex flex-wrap gap-3 items-center">
          <span className="font-mono text-[9px] text-silver/50 uppercase tracking-wider">Stops:</span>
          {route.waypoints.map((wp, i) => (
            <button key={i}
              onClick={() => {
                setActiveWp(wp.name)
                const map = mapInstance.current
                if (map) map.setView([wp.lat, wp.lng], 12, { animate: true })
              }}
              className={`flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                activeWp === wp.name
                  ? 'border-gold/50 text-gold bg-gold/10'
                  : 'border-silver/20 text-silver hover:border-gold/30 hover:text-parchment'
              }`}>
              <div className={`w-2 h-2 rounded-full ${
                wp.type === 'origin' ? 'bg-blue-500' :
                wp.type === 'destination' ? 'bg-green-500' : 'bg-amber-400'
              }`} />
              {wp.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TransportOptions({ route }) {
  return (
    <div className="glass-card p-5">
      <SectionTitle>Transport options</SectionTitle>
      <div className="space-y-3">
        {route.transportOptions?.map((opt, i) => (
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
  )
}

function ScenicNote({ route }) {
  return (
    <div className="glass-card p-5 border-[#6abf6a]/30">
      <SectionTitle>🌿 Route highlights</SectionTitle>
      <p className="text-cream text-base leading-relaxed">{route.scenicNote}</p>
      <p className="font-mono text-[9px] text-silver/40 mt-3 tracking-wider">{route.source}</p>
    </div>
  )
}

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
        <h2 className="font-display text-xl font-bold text-parchment">Route & map</h2>
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