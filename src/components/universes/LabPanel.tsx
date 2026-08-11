import type { ComponentType } from 'react'

import type { PanelSpec } from '../../data/profile'
import { useRoll } from '../../lib/probability'
import { useGlobalReroll } from '../../lib/hooks'
import { Reveal } from '../shell/Universe'
import type { VizProps } from '../viz/types'

import OrbitViz from '../viz/OrbitViz'
import MosaicViz from '../viz/MosaicViz'
import ConstellationViz from '../viz/ConstellationViz'
import DialViz from '../viz/DialViz'
import LiquidViz from '../viz/LiquidViz'
import SwarmViz from '../viz/SwarmViz'
import StrataViz from '../viz/StrataViz'
import PulseViz from '../viz/PulseViz'

/** spec.viz -> mechanic. Typed as a total Record over the union in
 *  PanelSpec, so adding a mechanic to the data file without wiring it
 *  up here (or wiring up one that does not exist) is a compile error. */
const MECHANICS: Record<PanelSpec['viz'], ComponentType<VizProps>> = {
  orbit: OrbitViz,
  mosaic: MosaicViz,
  constellation: ConstellationViz,
  dial: DialViz,
  liquid: LiquidViz,
  swarm: SwarmViz,
  strata: StrataViz,
  pulse: PulseViz,
}

export default function LabPanel({ spec, index }: { spec: PanelSpec; index: number }) {
  const { samples, nonce, reroll } = useRoll(spec.options)

  /* the "re-roll the whole day" button reaches every panel through this */
  useGlobalReroll(reroll)

  const Viz = MECHANICS[spec.viz]

  return (
    <Reveal as="article" className="panel" delay={(index % 3) * 0.06}>
      <div className="panel__head">
        <h3 className="panel__title">{spec.title}</h3>
        <button
          type="button"
          className="panel__reroll"
          onClick={reroll}
          aria-label={`Re-roll ${spec.title}`}
        >
          re-roll
        </button>
      </div>

      <p className="panel__note">{spec.note}</p>

      <div className="viz">
        <Viz samples={samples} nonce={nonce} />
      </div>

      <p className="panel__hint">{spec.hint}</p>
    </Reveal>
  )
}
