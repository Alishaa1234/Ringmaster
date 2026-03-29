# 🎪 Ringmaster's Round Table

Multi-agent circus-themed trip planner — React + Vite + Tailwind CSS.

---

## Quick Start

```bash
# 1. Enter the project folder
cd ringmaster

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Project Structure

```
ringmaster/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx              ← React entry point
    ├── App.jsx               ← Root component + orchestration state
    ├── index.css             ← Tailwind + global styles
    ├── data/
    │   └── mockData.js       ← Mock data (replace with real APIs later)
    └── components/
        ├── AgentCard.jsx     ← Sky Gazer / Trailblazer / Quartermaster cards
        ├── PlanInput.jsx     ← Destination + date + duration input
        ├── TabBar.jsx        ← Tab navigation
        └── tabs/
            ├── SummaryTab.jsx
            ├── WeatherTab.jsx
            ├── RouteTab.jsx
            ├── EventsTab.jsx
            ├── BudgetTab.jsx
            └── ItineraryTab.jsx
```

---

## What's Wired (Phase 1 — Dashboard)

- [x] Full circus-themed UI (dark parchment + gold)
- [x] Three agent cards with animated states
- [x] Destination / date / duration input
- [x] 6-tab results panel (Summary, Weather, Route, Events, Budget, Itinerary)
- [x] Collapsible day-by-day itinerary
- [x] 3-tier budget table (Budget / Mid / Luxury)
- [x] Mock data for all agents

---

## Coming Next (Phase 2 — Real APIs)

- [ ] OpenWeatherMap API → WeatherTab real data
- [ ] Leaflet.js map → RouteTab interactive map
- [ ] Claude API → replace mock with live agent responses
- [ ] Comparison mode (Goa vs Pondicherry)

---

## API Keys (add when ready)

Create a `.env` file in the project root:

```
VITE_OPENWEATHER_KEY=your_key_here
VITE_ANTHROPIC_KEY=your_key_here
```

Access in code: `import.meta.env.VITE_OPENWEATHER_KEY`