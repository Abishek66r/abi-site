import { useEffect } from 'react'
import Lenis from 'lenis'

import Nav from './components/shell/Nav'
import Progress from './components/shell/Progress'
import BackToTop from './components/shell/BackToTop'

import Hero from './components/universes/Hero'
import Mind from './components/universes/Mind'
import Philosophy from './components/universes/Philosophy'
import Lab from './components/universes/Lab'
import Her from './components/universes/Her'
import Bmw from './components/universes/Bmw'
import Machines from './components/universes/Machines'
import Career from './components/universes/Career'
import Duality from './components/universes/Duality'
import Roots from './components/universes/Roots'
import Egos from './components/universes/Egos'
import Drift from './components/universes/Drift'
import End from './components/universes/End'

export default function App() {
  /* Smooth inertial scroll. Disabled when the user prefers reduced motion. */
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    /* let in-page anchors drive lenis instead of native jump */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const id = a.getAttribute('href')!.slice(1)
      const el = document.getElementById(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -56 })
    }
    document.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('click', onClick)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Nav />
      <Progress />
      <BackToTop />
      <main>
        <Hero />
        <Mind />
        <Philosophy />
        <Lab />
        <Her />
        <Bmw />
        <Machines />
        <Career />
        <Duality />
        <Roots />
        <Egos />
        <Drift />
        <End />
      </main>
    </>
  )
}
