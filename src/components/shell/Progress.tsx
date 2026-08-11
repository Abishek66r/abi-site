import { useEffect, useRef } from 'react'

/** Hairline scroll-progress bar pinned to the very top of the viewport.
 *  Writes straight to the DOM node so scrolling never triggers a React
 *  render, and coalesces every scroll event into one frame. */
export default function Progress() {
  const bar = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    let raf = 0

    const paint = () => {
      raf = 0
      const el = bar.current
      if (!el) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? window.scrollY / max : 0
      const pct = Math.min(100, Math.max(0, ratio * 100))
      el.style.width = `${pct}%`
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div className="progress" aria-hidden="true">
      <span ref={bar} />
    </div>
  )
}
