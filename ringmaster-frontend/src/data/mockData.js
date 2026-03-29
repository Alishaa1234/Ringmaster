// ─────────────────────────────────────────────
//  MOCK DATA  —  replace each section with live
//  API responses as we wire up agents later.
// ─────────────────────────────────────────────

export const MOCK_PLAN = {
  destination: 'Goa',
  origin: 'Mumbai',
  duration: 7,
  travelDate: '2026-04-10',

  summary:
    'A golden week on Goa\'s sun-drenched coast awaits — where Portuguese spice routes meet Arabian Sea breezes, and every evening ends with the smell of feni and the sound of the tide.',

  // ── WEATHER AGENT (Sky Gazer) ──────────────
  weather: {
    condition: 'Partly Cloudy',
    tempHigh: 34,
    tempLow: 26,
    humidity: 72,
    forecast: [
      { day: 'Day 1', icon: '☀️', high: 34, low: 27, desc: 'Sunny & clear' },
      { day: 'Day 2', icon: '⛅', high: 33, low: 26, desc: 'Partly cloudy' },
      { day: 'Day 3', icon: '🌤',  high: 35, low: 27, desc: 'Mostly sunny' },
      { day: 'Day 4', icon: '☀️', high: 36, low: 28, desc: 'Hot & sunny' },
      { day: 'Day 5', icon: '⛅', high: 33, low: 26, desc: 'Sea breeze' },
      { day: 'Day 6', icon: '🌦',  high: 30, low: 25, desc: 'Light shower' },
      { day: 'Day 7', icon: '☀️', high: 34, low: 27, desc: 'Clear skies' },
    ],
    recommendation: 'Pack light cottons, sunscreen SPF 50+, and a light rain layer for Day 6.',
    alert: 'April in Goa is pre-monsoon — expect warm, humid days. Best beach hours are 7–10am and 5–7pm.',
  },

  // ── MAPS AGENT (Trailblazer) ───────────────
  route: {
    from: 'Mumbai',
    to: 'Goa',
    distanceKm: 597,
    transportOptions: [
      { mode: '✈ Flight',      duration: '1h 10m', cost: '₹3,500–8,000',  comfort: 5, recommended: true },
      { mode: '🚂 Train (Konkan)', duration: '8–12h',  cost: '₹600–2,500',   comfort: 4, recommended: false },
      { mode: '🚌 Sleeper Bus',  duration: '14h',    cost: '₹800–1,800',   comfort: 3, recommended: false },
      { mode: '🚗 Self Drive',   duration: '10–12h', cost: '₹3,000–5,000', comfort: 4, recommended: false },
    ],
    scenicNote:
      'The Konkan Railway route is one of India\'s most scenic — 91 tunnels and 2,000 bridges hugging the Western Ghats coast.',
    mapCenter: { lat: 15.2993, lng: 74.1240 },
  },

  // ── EVENTS (Orchestrator-sourced) ──────────
  events: {
    festivals: [
      'Shigmo Spring Festival — colourful processions across Panaji (Apr 12)',
      'Goa Heritage Festival — Old Goa churches and live music (Apr 14–16)',
      'Sunburn Arena — Electronic music by the beach (Apr 19)',
    ],
    highlights: [
      'Dudhsagar Waterfalls trek — best pre-monsoon access',
      'Spice plantation tour in Ponda — full sensory experience',
      'Old Goa UNESCO churches — Se Cathedral, Basilica of Bom Jesus',
      'Night market at Anjuna every Wednesday',
    ],
    tip: 'Book a sunrise boat trip from Panjim jetty — dolphins are common in April mornings.',
  },

  // ── BUDGET (Quartermaster) ─────────────────
  budget: {
    currency: 'INR',
    transport: { low: 1200, mid: 4500, high: 8000 },
    accommodationPerNight: { low: 800, mid: 2500, high: 8000 },
    foodPerDay: { low: 400, mid: 900, high: 2000 },
    activitiesTotal: { low: 500, mid: 2000, high: 6000 },
    totalEstimate: { low: 11400, mid: 29800, high: 78000 },
    savingTip:
      'Book Konkan Railway 2A class 60 days ahead for ₹1,200 — same arrival, far cheaper than flights, and arguably more scenic.',
    breakdown: [
      { label: 'Transport (round trip)', low: 1200,  mid: 4500,  high: 8000  },
      { label: 'Accommodation (7 nights)', low: 5600, mid: 17500, high: 56000 },
      { label: 'Food & drinks (7 days)',  low: 2800,  mid: 6300,  high: 14000 },
      { label: 'Activities & entry fees', low: 500,   mid: 2000,  high: 6000  },
      { label: 'Misc / local transport',  low: 1300,  mid: 3500,  high: 8000  },
    ],
  },

  // ── ITINERARY ──────────────────────────────
  itinerary: [
    {
      day: 1, title: 'Arrival & North Goa',
      morning:   'Land at Dabolim / Manohar airport. Check into hotel. Freshen up.',
      afternoon: 'Explore Calangute and Baga beaches. Rent a scooter (₹350/day).',
      evening:   'Sundowners at Tito\'s Lane, Baga. Dinner at a beach shack.',
      tip:       'Avoid registered taxis — apps like Goa Miles are cheaper.',
    },
    {
      day: 2, title: 'Heritage Trails',
      morning:   'Visit Old Goa — Se Cathedral and Basilica of Bom Jesus (UNESCO).',
      afternoon: 'Spice plantation tour in Ponda, traditional Goan thali lunch.',
      evening:   'Panjim riverfront walk, Fontainhas Latin Quarter.',
      tip:       'Old Goa is best before 10am — fewer crowds, golden light.',
    },
    {
      day: 3, title: 'Dudhsagar & Waterfalls',
      morning:   'Early start for Dudhsagar Falls trek (book jeep safari the night before).',
      afternoon: 'Return, rest at hotel, beach swim.',
      evening:   'Seafood dinner at Ritz Classic, Panaji.',
      tip:       'Carry water and wear closed shoes for the trail.',
    },
    {
      day: 4, title: 'South Goa Serenity',
      morning:   'Drive south — Colva, Benaulim, and Palolem beaches.',
      afternoon: 'Kayaking or dolphin-spotting boat trip from Palolem.',
      evening:   'Silent disco at Palolem beach (seasonal).',
      tip:       'South Goa is far less crowded — worth the drive.',
    },
    {
      day: 5, title: 'Free Day & Markets',
      morning:   'Lazy beach morning at your choice.',
      afternoon: 'Anjuna flea market (Wednesdays) or Mapusa Friday market.',
      evening:   'Shigmo Festival procession if dates align.',
      tip:       'Bargain firmly at Anjuna — first price is 3x the real price.',
    },
    {
      day: 6, title: 'Watersports & Spa',
      morning:   'Watersports at Calangute — parasailing, jet ski, banana boat.',
      afternoon: 'Ayurvedic spa session (light rain today — perfect timing).',
      evening:   'Farewell dinner at a rooftop restaurant in Assagao.',
      tip:       'Book spa in advance — Swastha Ayurveda and SwaSwara are excellent.',
    },
    {
      day: 7, title: 'Departure',
      morning:   'Last sunrise walk on the beach. Pack up.',
      afternoon: 'Head to airport/station. Grab bebinca sweet for the journey home.',
      evening:   'Depart — carry memories, leave only footprints.',
      tip:       'Goa airport is small but busy — arrive 2h early for flights.',
    },
  ],
}

// Agent definitions — used by AgentCard components
export const AGENTS = [
  {
    id: 'weather',
    name: 'Sky Gazer',
    title: 'Weather Agent',
    icon: '🌦',
    color: '#4a9eda',
    idleMsg: 'Awaiting mission…',
  },
  {
    id: 'maps',
    name: 'Trailblazer',
    title: 'Routes Agent',
    icon: '🗺',
    color: '#6abf6a',
    idleMsg: 'Awaiting mission…',
  },
  {
    id: 'budget',
    name: 'Quartermaster',
    title: 'Budget Agent',
    icon: '💰',
    color: '#c8922a',
    idleMsg: 'Awaiting mission…',
  },
]