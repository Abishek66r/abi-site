import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { SECTIONS } from '../../data/profile'

/** [background, foreground, bottom border] for the fixed bar. */
type Tint = readonly [bg: string, fg: string, border: string]

/** Every universe that is NOT in `LIGHT` falls back to this. */
const DARK: Tint = ['rgba(8,8,11,.55)', '#ffffff', 'rgba(255,255,255,.07)']

/** Universes with a pale background need a pale, dark-text bar. Keyed by
 *  the `u--<tone>` class the section carries. */
const LIGHT: Record<string, Tint> = {
  'u--philosophy': ['rgba(251,250,247,.72)', '#14130f', 'rgba(0,0,0,.1)'],
  'u--machines': ['rgba(240,242,245,.72)', '#12151a', 'rgba(0,0,0,.1)'],
  'u--career': ['rgba(250,250,247,.72)', '#0a0a0a', 'rgba(0,0,0,.12)'],
  'u--roots': ['rgba(244,239,230,.72)', '#2b2419', 'rgba(43,36,25,.12)'],
  'u--drift': ['rgba(228,234,238,.72)', '#1d2a33', 'rgba(29,42,51,.12)'],
}

const MENU_ID = 'nav-menu'

/** Pulls the `u--<tone>` class off a universe section. */
function toneOf(el: Element): string {
  for (const cls of Array.from(el.classList)) {
    if (cls.startsWith('u--')) return cls
  }
  return ''
}

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState('')

  /* Re-tint the bar to match whichever universe is currently sitting
     underneath it. The thin band (60px from the top down to 15vh) means
     exactly one section usually qualifies. */
  const visible = useRef<Set<Element>>(new Set())

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.u'))
    if (!sections.length || typeof IntersectionObserver === 'undefined') return

    const seen = visible.current

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target)
          else seen.delete(entry.target)
        }
        /* The section under the bar is the highest one still in the band. */
        let best: Element | null = null
        let bestTop = Number.POSITIVE_INFINITY
        for (const el of seen) {
          const top = el.getBoundingClientRect().top
          if (top < bestTop) {
            bestTop = top
            best = el
          }
        }
        setTone(best ? toneOf(best) : '')
      },
      { rootMargin: '-60px 0px -85% 0px' },
    )

    for (const section of sections) io.observe(section)

    return () => {
      io.disconnect()
      seen.clear()
    }
  }, [])

  /* Escape closes the mobile sheet. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const [bg, fg, border] = LIGHT[tone] ?? DARK
  const style: CSSProperties = {
    background: bg,
    color: fg,
    borderBottomColor: border,
  }

  return (
    <nav className="nav" style={style} aria-label="Sections">
      <a className="nav__brand" href="#hero" onClick={() => setOpen(false)}>
        ABI
      </a>

      <button
        type="button"
        className="nav__toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <ul id={MENU_ID} className={open ? 'nav__list open' : 'nav__list'}>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} onClick={() => setOpen(false)}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
