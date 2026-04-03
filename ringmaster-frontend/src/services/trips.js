// src/services/trips.js
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const COLLECTION = 'trips'

/**
 * Save a trip plan to Firestore under the user's ID.
 */
export async function saveTrip(userId, plan) {
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    destination:  plan.destination,
    origin:       plan.origin,
    travelDate:   plan.travelDate,
    duration:     plan.duration,
    summary:      plan.summary,
    savedAt:      serverTimestamp(),
    // Store full plan as JSON string to avoid nested object limits
    planJson:     JSON.stringify(plan),
  })
  return ref.id
}

/**
 * Load all saved trips for a user, newest first.
 */
export async function loadTrips(userId) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('savedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id:          d.id,
    destination: d.data().destination,
    origin:      d.data().origin,
    travelDate:  d.data().travelDate,
    duration:    d.data().duration,
    summary:     d.data().summary,
    savedAt:     d.data().savedAt?.toDate?.()?.toLocaleDateString() ?? '—',
    plan:        JSON.parse(d.data().planJson || '{}'),
  }))
}

/**
 * Delete a saved trip.
 */
export async function deleteTrip(tripId) {
  await deleteDoc(doc(db, COLLECTION, tripId))
}