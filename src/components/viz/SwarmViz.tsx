import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useMeasure, useReducedMotion } from '../../lib/hooks'
import type { Sample } from '../../lib/probability'
import { colorOf } from './types'
import type { VizProps } from './types'

/* ============================================================
   SWARM — one cluster of drifting particles per option.
   share -> POPULATION of the cluster (round(share * 90), min 3)
   and a little halo intensity. Dots wander with brownian motion
   inside their own zone; on a re-roll the surplus fades out and
   new dots are born at the centre, so the crowd re-forms rather
   than snapping. Nothing numeric is ever drawn.
   ============================================================ */

const H = 250
const MAX_DOTS = 90

type Zone = {
  key: number
  label: string
  cx: number
  cy: number
  r: number
  rel: number
  count: number
  cellW: number
}

type Dot = {
  x: number
  y: number
  vx: number
  vy: number
  a: number
  dying: boolean
  phase: number
}

function zonesOf(samples: Sample[], w: number, h: number): Zone[] {
  const ordered = [...samples].sort((a, b) => a.key - b.key)
  const n = ordered.length
  if (n === 0 || w <= 0) return []

  const cols = n <= 3 ? n : n === 4 ? 2 : 3
  const rows = Math.ceil(n / cols)
  const cellW = w / cols
  const cellH = h / rows
  const maxShare = Math.max(...ordered.map((s) => s.share)) || 1

  return ordered.map((s, i) => {
    const row = Math.floor(i / cols)
    const col = i - row * cols
    const inRow = Math.min(cols, n - row * cols)
    const pad = ((cols - inRow) * cellW) / 2
    return {
      key: s.key,
      label: s.label,
      cx: pad + (col + 0.5) * cellW,
      cy: (row + 0.5) * cellH - 10,
      r: Math.max(14, Math.min(cellW * 0.4, cellH * 0.3)),
      rel: s.share / maxShare,
      count: Math.max(3, Math.round(s.share * MAX_DOTS)),
      cellW,
    }
  })
}

function newDot(z: Zone, atCentre: boolean): Dot {
  const ang = Math.random() * Math.PI * 2
  const rad = atCentre ? z.r * 0.12 * Math.random() : z.r * Math.sqrt(Math.random())
  return {
    x: z.cx + Math.cos(ang) * rad,
    y: z.cy + Math.sin(ang) * rad,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.5) * 14,
    a: atCentre ? 0 : 1,
    dying: false,
    phase: Math.random() * Math.PI * 2,
  }
}

/** Deterministic sunflower packing, used for the reduced-motion frame. */
function staticDots(z: Zone): Dot[] {
  const out: Dot[] = []
  for (let i = 0; i < z.count; i++) {
    const rad = z.r * Math.sqrt((i + 0.6) / z.count)
    const ang = i * 2.39996323
    out.push({
      x: z.cx + Math.cos(ang) * rad,
      y: z.cy + Math.sin(ang) * rad,
      vx: 0,
      vy: 0,
      a: 1,
      dying: false,
      phase: 0,
    })
  }
  return out
}

function reconcile(pool: Map<number, Dot[]>, zones: Zone[], reduced: boolean) {
  const live = new Set<number>()
  for (const z of zones) {
    live.add(z.key)
    if (reduced) {
      pool.set(z.key, staticDots(z))
      continue
    }
    const arr = pool.get(z.key) ?? []
    const alive = arr.filter((d) => !d.dying)
    const diff = z.count - alive.length
    if (diff > 0) {
      for (let i = 0; i < diff; i++) arr.push(newDot(z, arr.length > 0))
    } else if (diff < 0) {
      for (let i = 0; i < -diff; i++) alive[alive.length - 1 - i].dying = true
    }
    pool.set(z.key, arr)
  }
  for (const key of [...pool.keys()]) if (!live.has(key)) pool.delete(key)
}

/** A re-roll stirs every cluster so the change is felt, not just seen. */
function stir(pool: Map<number, Dot[]>) {
  for (const arr of pool.values()) {
    for (const d of arr) {
      d.vx += (Math.random() - 0.5) * 90
      d.vy += (Math.random() - 0.5) * 90
    }
  }
}

export default function SwarmViz({ samples, nonce }: VizProps) {
  const { ref: stageRef, size } = useMeasure<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = useReducedMotion()

  const zones = useMemo(() => zonesOf(samples, size.w, H), [samples, size.w])

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const poolRef = useRef<Map<number, Dot[]>>(new Map())
  const zonesRef = useRef<Zone[]>([])
  const widthRef = useRef(0)
  const nonceRef = useRef(-1)

  const draw = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || widthRef.current <= 0) return
    ctx.clearRect(0, 0, widthRef.current, H)

    /* zone halos — glow strength tracks the same share as the count */
    for (const z of zonesRef.current) {
      const g = ctx.createRadialGradient(z.cx, z.cy, 0, z.cx, z.cy, z.r * 1.5)
      g.addColorStop(0, colorOf(z.key, 62, 82, 0.1 + 0.16 * z.rel))
      g.addColorStop(1, colorOf(z.key, 62, 82, 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(z.cx, z.cy, z.r * 1.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.setLineDash([2, 6])
      ctx.lineWidth = 1
      ctx.strokeStyle = colorOf(z.key, 72, 60, 0.16)
      ctx.beginPath()
      ctx.arc(z.cx, z.cy, z.r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    /* particles, additive so overlap reads as density */
    ctx.globalCompositeOperation = 'lighter'
    for (const z of zonesRef.current) {
      const arr = poolRef.current.get(z.key)
      if (!arr) continue
      const soft = colorOf(z.key, 60, 90)
      const core = colorOf(z.key, 84, 92)
      for (const d of arr) {
        ctx.globalAlpha = 0.1 * d.a
        ctx.fillStyle = soft
        ctx.beginPath()
        ctx.arc(d.x, d.y, 4.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 0.9 * d.a
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }, [])

  const step = useCallback((dt: number, t: number) => {
    const damp = Math.pow(0.9, dt * 60)
    for (const z of zonesRef.current) {
      const arr = poolRef.current.get(z.key)
      if (!arr) continue
      for (let i = arr.length - 1; i >= 0; i--) {
        const d = arr[i]
        d.a += ((d.dying ? 0 : 1) - d.a) * Math.min(1, dt * 3.4)
        if (d.dying && d.a < 0.02) {
          arr.splice(i, 1)
          continue
        }
        d.vx += (Math.random() - 0.5) * 46 * dt
        d.vy += (Math.random() - 0.5) * 46 * dt

        const dx = d.x - z.cx
        const dy = d.y - z.cy
        const dist = Math.hypot(dx, dy) || 0.0001
        /* gentle tangential drift keeps the cluster alive */
        d.vx += (-dy / dist) * 5 * dt * Math.sin(t * 0.3 + d.phase)
        d.vy += (dx / dist) * 5 * dt * Math.sin(t * 0.3 + d.phase)
        /* soft containment inside the zone */
        const edge = z.r * 0.88
        if (dist > edge) {
          const pull = (dist - edge) * 9 * dt
          d.vx -= (dx / dist) * pull
          d.vy -= (dy / dist) * pull
        }
        d.vx *= damp
        d.vy *= damp
        d.x += d.vx * dt
        d.y += d.vy * dt
      }
    }
  }, [])

  useLayoutEffect(() => {
    const cv = canvasRef.current
    if (!cv || size.w <= 0) return
    const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
    cv.width = Math.round(size.w * dpr)
    cv.height = Math.round(H * dpr)
    cv.style.width = `${size.w}px`
    cv.style.height = `${H}px`
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    widthRef.current = size.w

    zonesRef.current = zones
    reconcile(poolRef.current, zones, reduced)
    if (nonce !== nonceRef.current) {
      const first = nonceRef.current < 0
      nonceRef.current = nonce
      if (!reduced && !first) stir(poolRef.current)
    }
    draw()
  }, [zones, reduced, nonce, size.w, draw])

  useEffect(() => {
    if (reduced) return
    let raf = 0
    let prev = performance.now()
    let clock = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      clock += dt
      step(dt, clock)
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, draw, step])

  const zoneByKey = useMemo(() => {
    const m = new Map<number, Zone>()
    zones.forEach((z) => m.set(z.key, z))
    return m
  }, [zones])

  return (
    <div className="viz" ref={stageRef} style={{ height: H }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />
      {/* labels: real DOM text over the canvas, rank order for screen readers */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {samples.map((s) => {
          const z = zoneByKey.get(s.key)
          if (!z) return null
          return (
            <span
              key={s.key}
              style={{
                position: 'absolute',
                left: z.cx,
                top: z.cy + z.r + 9,
                width: Math.max(70, z.cellW - 10),
                marginLeft: -Math.max(70, z.cellW - 10) / 2,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                lineHeight: 1.35,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colorOf(s.key, 88, 62),
                opacity: 0.92,
              }}
            >
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
