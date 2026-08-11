import { useCallback, useState } from 'react'
import type { Weighted } from '../data/profile'

/** One sampled option. `share` is 0..1 — used for size/density/motion.
 *  It is deliberately NOT a percentage for display. Never render it as text. */
export type Sample = {
  label: string
  /** normalised 0..1 share of the distribution */
  share: number
  /** rank, 0 = strongest this roll */
  rank: number
  /** stable index into the original options array (for consistent colour) */
  key: number
}

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

/** Sample inside each option's weight range and normalise to sum 1. */
export function roll(options: Weighted[]): Sample[] {
  const raw = options.map(([, lo, hi]) => rand(lo, hi))
  const total = raw.reduce((a, b) => a + b, 0) || 1
  return options
    .map(([label], i) => ({ label, share: raw[i] / total, key: i, rank: 0 }))
    .sort((a, b) => b.share - a.share)
    .map((s, i) => ({ ...s, rank: i }))
}

/** Rolls once on mount, and again whenever `reroll()` is called.
 *  `nonce` increments each roll so consumers can key animations off it. */
export function useRoll(options: Weighted[]) {
  const [state, setState] = useState(() => ({ samples: roll(options), nonce: 0 }))
  const reroll = useCallback(() => {
    setState((s) => ({ samples: roll(options), nonce: s.nonce + 1 }))
  }, [options])
  return { samples: state.samples, nonce: state.nonce, reroll }
}

/* ---------- a tiny global re-roll bus ----------
   Lets the "re-roll the whole day" button reach every panel
   without threading callbacks through the tree. */
type Listener = () => void
const listeners = new Set<Listener>()

export function onGlobalReroll(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function fireGlobalReroll() {
  ;[...listeners].forEach((fn, i) => setTimeout(fn, i * 55))
}
