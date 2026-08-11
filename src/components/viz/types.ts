import type { Sample } from '../../lib/probability'

/** Every probability visualisation receives exactly this.
 *  RULE: never render `share` as a number or a percentage.
 *  Encode it as size, area, density, radius, opacity or motion only. */
export type VizProps = {
  samples: Sample[]
  /** increments on every re-roll — key transitions off this */
  nonce: number
}

/** Stable hue per option index, so a given option keeps its colour
 *  across re-rolls even though its rank changes. */
export const HUES = [265, 172, 320, 205, 45, 150, 15, 290]

export const hueOf = (key: number) => HUES[key % HUES.length]

export const colorOf = (key: number, l = 62, s = 78, a = 1) =>
  `hsl(${hueOf(key)} ${s}% ${l}% / ${a})`
