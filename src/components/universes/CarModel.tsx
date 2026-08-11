import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '../../lib/hooks'

/* ============================================================
   A stylised low-slung performance coupé, built entirely from
   three.js primitives + one extruded side profile.
   Nothing here is a scan, a download or a licensed asset —
   it is proportion and silhouette only. No badges, no emblems.
   Units are roughly metres: 4.7 long, 2.0 wide, 1.38 tall.
   ============================================================ */

const AXLE_Y = 0.35 /* wheel centre height          */
const WHEEL_R = 0.35 /* tyre radius                  */
const ARCH_R = 0.42 /* wheel-arch cut radius        */
const FRONT_X = 1.45
const REAR_X = -1.45
const TRACK_Z = 0.8 /* half track                   */
const HALF_W = 0.83 /* half body width before bevel */
const BEVEL = 0.045

/* ---------- tiny geometry toolkit ---------- */

type Rect = { x0: number; x1: number; hz: number }

/** A flat-shaded box that may taper in both length and width between
 *  its bottom (y0) and top (y1) faces. 12 triangles, no index. */
function prism(y0: number, y1: number, bottom: Rect, top: Rect): THREE.BufferGeometry {
  const b: [number, number, number][] = [
    [bottom.x0, y0, bottom.hz],
    [bottom.x1, y0, bottom.hz],
    [bottom.x1, y0, -bottom.hz],
    [bottom.x0, y0, -bottom.hz],
  ]
  const t: [number, number, number][] = [
    [top.x0, y1, top.hz],
    [top.x1, y1, top.hz],
    [top.x1, y1, -top.hz],
    [top.x0, y1, -top.hz],
  ]
  const quads: [number, number, number][][] = [
    [t[0], t[1], t[2], t[3]], // top
    [b[3], b[2], b[1], b[0]], // bottom
    [b[0], b[1], t[1], t[0]], // +z flank
    [b[2], b[3], t[3], t[2]], // -z flank
    [b[1], b[2], t[2], t[1]], // +x end
    [b[3], b[0], t[0], t[3]], // -x end
  ]

  const pos: number[] = []
  for (const [p0, p1, p2, p3] of quads) {
    pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3)
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

/** Concatenates a handful of small geometries into one draw call.
 *  Consumes (and disposes) the parts. */
function mergeGeos(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = []
  const nor: number[] = []

  for (const part of parts) {
    const flat = part.index ? part.toNonIndexed() : part
    const p = flat.getAttribute('position')
    const n = flat.getAttribute('normal')
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i))
      nor.push(n.getX(i), n.getY(i), n.getZ(i))
    }
    if (flat !== part) flat.dispose()
    part.dispose()
  }

  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  return out
}

/** Averages normals of coincident vertices, but only across edges that are
 *  shallower than `limit` (a dot-product threshold). Gives the extruded body
 *  a smooth hood / roofline while keeping the creases crisp. */
function relaxNormals(g: THREE.BufferGeometry, limit = 0.86): void {
  const pos = g.getAttribute('position')
  const nor = g.getAttribute('normal')
  if (!pos || !nor) return

  const buckets = new Map<string, number[]>()
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * 1e4)}:${Math.round(pos.getY(i) * 1e4)}:${Math.round(
      pos.getZ(i) * 1e4,
    )}`
    const bucket = buckets.get(key)
    if (bucket) bucket.push(i)
    else buckets.set(key, [i])
  }

  const out = new Float32Array(nor.count * 3)
  const mine = new THREE.Vector3()
  const other = new THREE.Vector3()
  const acc = new THREE.Vector3()

  for (const idx of buckets.values()) {
    for (const i of idx) {
      mine.fromBufferAttribute(nor, i)
      acc.set(0, 0, 0)
      for (const j of idx) {
        other.fromBufferAttribute(nor, j)
        if (mine.dot(other) >= limit) acc.add(other)
      }
      if (acc.lengthSq() < 1e-8) acc.copy(mine)
      acc.normalize()
      out[i * 3] = acc.x
      out[i * 3 + 1] = acc.y
      out[i * 3 + 2] = acc.z
    }
  }

  g.setAttribute('normal', new THREE.Float32BufferAttribute(out, 3))
}

/* ---------- the main body: one extruded side profile ---------- */

function buildBody(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape()

  /* rear valance → forward along the underside */
  s.moveTo(-2.28, 0.38)
  s.lineTo(-2.06, 0.31)
  s.lineTo(-1.93, 0.29)
  s.absarc(REAR_X, AXLE_Y, ARCH_R, Math.PI, 0, true) /* rear arch */
  s.lineTo(-1.03, 0.275)
  s.lineTo(1.03, 0.275) /* rocker */
  s.absarc(FRONT_X, AXLE_Y, ARCH_R, Math.PI, 0, true) /* front arch */
  s.lineTo(1.93, 0.3)
  s.lineTo(2.16, 0.3)

  /* nose */
  s.lineTo(2.3, 0.42)
  s.lineTo(2.345, 0.58)
  s.lineTo(2.3, 0.74)
  s.lineTo(2.14, 0.845)

  /* long hood → cowl */
  s.lineTo(1.84, 0.9)
  s.lineTo(1.28, 0.95)
  s.lineTo(0.7, 0.99)
  s.lineTo(0.34, 1.02)

  /* beltline → rear deck */
  s.lineTo(-0.4, 1.05)
  s.lineTo(-1.14, 1.04)
  s.lineTo(-1.72, 1.0)
  s.lineTo(-2.04, 0.945)
  s.lineTo(-2.245, 0.865)

  /* tail */
  s.lineTo(-2.335, 0.7)
  s.lineTo(-2.335, 0.5)
  s.closePath()

  const g = new THREE.ExtrudeGeometry(s, {
    depth: HALF_W * 2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: BEVEL,
    bevelOffset: 0,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 16,
  })
  g.translate(0, 0, -HALF_W)
  relaxNormals(g)
  return g
}

/* ---------- geometry set ---------- */

function buildGeometries() {
  const spokeParts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const box = new THREE.BoxGeometry(0.06, 0.03, 0.235)
    box.applyMatrix4(
      new THREE.Matrix4().makeRotationY(a).multiply(new THREE.Matrix4().makeTranslation(0, 0.1, 0.125)),
    )
    spokeParts.push(box)
  }

  const lip = new THREE.RingGeometry(0.234, 0.266, 26)
  lip.rotateX(-Math.PI / 2)
  lip.translate(0, 0.134, 0)

  const well = new THREE.CylinderGeometry(0.25, 0.25, 0.012, 20)
  well.translate(0, -0.02, 0)

  const hub = new THREE.CylinderGeometry(0.058, 0.058, 0.03, 14)
  hub.translate(0, 0.118, 0)

  const exhaust = new THREE.CylinderGeometry(0.05, 0.052, 0.13, 16, 1, true)
  exhaust.rotateZ(Math.PI / 2)

  const exhaustCap = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 14)
  exhaustCap.rotateZ(Math.PI / 2)

  return {
    body: buildBody(),

    /* greenhouse: dark tinted canopy, tapered in plan and in length */
    canopy: prism(0.96, 1.345, { x0: -1.82, x1: 0.44, hz: 0.795 }, { x0: -1.24, x1: -0.24, hz: 0.6 }),
    roof: prism(1.33, 1.378, { x0: -1.28, x1: -0.2, hz: 0.617 }, { x0: -1.22, x1: -0.27, hz: 0.575 }),

    /* aero */
    splitter: prism(0.155, 0.305, { x0: 1.9, x1: 2.42, hz: 0.9 }, { x0: 1.94, x1: 2.3, hz: 0.84 }),
    diffuser: prism(0.155, 0.345, { x0: -2.42, x1: -1.9, hz: 0.87 }, { x0: -2.34, x1: -1.86, hz: 0.82 }),
    skirt: prism(0.19, 0.3, { x0: -1.24, x1: 1.24, hz: 0.9 }, { x0: -1.2, x1: 1.2, hz: 0.86 }),
    tray: prism(0.288, 0.33, { x0: -1.98, x1: 1.98, hz: 0.63 }, { x0: -1.94, x1: 1.94, hz: 0.62 }),
    ducktail: prism(0.86, 0.995, { x0: -2.33, x1: -2.02, hz: 0.82 }, { x0: -2.37, x1: -2.1, hz: 0.79 }),

    /* single wide lower intake — deliberately generic, one plain slot */
    intake: prism(0.36, 0.62, { x0: 2.18, x1: 2.37, hz: 0.6 }, { x0: 2.16, x1: 2.34, hz: 0.58 }),
    vent: prism(0.33, 0.53, { x0: 2.2, x1: 2.37, hz: 0.11 }, { x0: 2.18, x1: 2.34, hz: 0.1 }),

    fin: new THREE.BoxGeometry(0.32, 0.15, 0.03),
    flare: new THREE.TorusGeometry(0.437, 0.075, 6, 15, Math.PI),

    head: new THREE.BoxGeometry(0.06, 0.075, 0.4),
    tail: new THREE.BoxGeometry(0.05, 0.085, 0.42),

    mirrorArm: new THREE.BoxGeometry(0.06, 0.045, 0.13),
    mirrorPod: new THREE.BoxGeometry(0.19, 0.075, 0.1),

    exhaust,
    exhaustCap,

    tyre: new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.26, 30, 1, false),
    barrel: new THREE.CylinderGeometry(0.252, 0.252, 0.268, 22, 1, true),
    lip,
    well,
    hub,
    spokes: mergeGeos(spokeParts),
  }
}

type Geos = ReturnType<typeof buildGeometries>

/* ---------- material set ---------- */

function buildMaterials() {
  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: '#2b2f36',
      metalness: 0.9,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.35,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#0a0e14',
      metalness: 0.3,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.8,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: '#0c0e11',
      metalness: 0.4,
      roughness: 0.55,
      envMapIntensity: 0.7,
    }),
    fin: new THREE.MeshStandardMaterial({
      color: '#1b1f24',
      metalness: 0.65,
      roughness: 0.4,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: '#c2c8d0',
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 1.6,
    }),
    rim: new THREE.MeshStandardMaterial({
      color: '#40454d',
      metalness: 0.95,
      roughness: 0.28,
      envMapIntensity: 1.4,
    }),
    barrel: new THREE.MeshStandardMaterial({
      color: '#14171b',
      metalness: 0.75,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }),
    void: new THREE.MeshStandardMaterial({ color: '#050608', metalness: 0.2, roughness: 0.9 }),
    rubber: new THREE.MeshStandardMaterial({
      color: '#0e1013',
      metalness: 0.05,
      roughness: 0.86,
      envMapIntensity: 0.35,
    }),
    headlight: new THREE.MeshStandardMaterial({
      color: '#fef8ee',
      emissive: '#fff9d8',
      emissiveIntensity: 3.3,
      toneMapped: false,
    }),
    head: new THREE.MeshStandardMaterial({
      color: '#0b1016',
      emissive: '#dbe9ff',
      emissiveIntensity: 2.4,
      toneMapped: false,
    }),
    tail: new THREE.MeshStandardMaterial({
      color: '#180608',
      emissive: '#ff2d1e',
      emissiveIntensity: 2.1,
      toneMapped: false,
    }),
  }
}

type Mats = ReturnType<typeof buildMaterials>

/* ---------- one wheel ---------- */

function Wheel({
  x,
  side,
  geos,
  mats,
  spin,
}: {
  x: number
  side: 1 | -1
  geos: Geos
  mats: Mats
  spin: number
}) {
  const axle = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (spin === 0 || !axle.current) return
    axle.current.rotation.y -= side * spin * Math.min(dt, 0.05)
  })

  return (
    <group position={[x, AXLE_Y, side * TRACK_Z]} rotation={[(side * Math.PI) / 2, 0, 0]}>
      <group ref={axle}>
        <mesh geometry={geos.tyre} material={mats.rubber} />
        <mesh geometry={geos.barrel} material={mats.barrel} />
        <mesh geometry={geos.well} material={mats.void} />
        <mesh geometry={geos.spokes} material={mats.rim} />
        <mesh geometry={geos.lip} material={mats.rim} />
        <mesh geometry={geos.hub} material={mats.chrome} />
      </group>
    </group>
  )
}

/* ---------- the car ---------- */

export default function CarModel({ color = '#2b2f36' }: { color?: string }) {
  const reduced = useReducedMotion()
  const geos = useMemo(buildGeometries, [])
  const mats = useMemo(buildMaterials, [])

  useEffect(() => {
    mats.paint.color.set(color)
  }, [mats, color])

  useEffect(
    () => () => {
      for (const g of Object.values(geos)) g.dispose()
      for (const m of Object.values(mats)) m.dispose()
    },
    [geos, mats],
  )

  const spin = reduced ? 0 : 0.85
  const finZ = [-0.54, -0.18, 0.18, 0.54]

  return (
    <group position={[0, 0, 0]} rotation={[0, 0.08, 0]}>
      {/* shell */}
      <mesh geometry={geos.body} material={mats.paint} />
      <mesh geometry={geos.roof} material={mats.paint} />
      <mesh geometry={geos.ducktail} material={mats.paint} />
      <mesh geometry={geos.canopy} material={mats.glass} />

      {/* flared arches */}
      {([FRONT_X, REAR_X] as const).map((ax) =>
        ([1, -1] as const).map((side) => (
          <mesh
            key={`flare-${ax}-${side}`}
            geometry={geos.flare}
            material={mats.paint}
            position={[ax, AXLE_Y, side * 0.855]}
            scale={[1, 1, 1.7]}
          />
        )),
      )}

      {/* aero + underbody */}
      <mesh geometry={geos.splitter} material={mats.trim} />
      <mesh geometry={geos.diffuser} material={mats.trim} />
      <mesh geometry={geos.skirt} material={mats.trim} />
      <mesh geometry={geos.tray} material={mats.void} />
      <mesh geometry={geos.intake} material={mats.void} />
      {([1, -1] as const).map((side) => (
        <mesh
          key={`vent-${side}`}
          geometry={geos.vent}
          material={mats.void}
          position={[0, 0, side * 0.62]}
        />
      ))}
      {finZ.map((z) => (
        <mesh key={`fin-${z}`} geometry={geos.fin} material={mats.fin} position={[-2.15, 0.245, z]} />
      ))}

      {/* lamps — slim generic strips, no signature graphic */}
      {([1, -1] as const).map((side) => (
        <mesh
          key={`head-${side}`}
          geometry={geos.head}
          material={mats.head}
          position={[2.315, 0.665, side * 0.47]}
        />
      ))}
      {([1, -1] as const).map((side) => (
        <mesh
          key={`headlight-${side}`}
          geometry={geos.head}
          material={mats.headlight}
          position={[2.22, 0.63, side * 0.32]}
          scale={[1.1, 0.5, 0.18]}
        />
      ))}
      {([1, -1] as const).map((side) => (
        <mesh
          key={`tail-${side}`}
          geometry={geos.tail}
          material={mats.tail}
          position={[-2.355, 0.715, side * 0.45]}
        />
      ))}

      {/* quad tips */}
      {[-0.56, -0.4, 0.4, 0.56].map((z) => (
        <group key={`pipe-${z}`} position={[-2.315, 0.265, z]}>
          <mesh geometry={geos.exhaust} material={mats.chrome} />
          <mesh geometry={geos.exhaustCap} material={mats.void} position={[0.04, 0, 0]} />
        </group>
      ))}

      {/* mirrors */}
      {([1, -1] as const).map((side) => (
        <group key={`mirror-${side}`} position={[0.34, 1.045, side * 0.86]}>
          <mesh geometry={geos.mirrorArm} material={mats.trim} position={[0, 0, side * 0.07]} />
          <mesh
            geometry={geos.mirrorPod}
            material={mats.paint}
            position={[0.02, 0.03, side * 0.19]}
            rotation={[0, 0, -0.12]}
          />
        </group>
      ))}

      {/* wheels */}
      <Wheel x={FRONT_X} side={1} geos={geos} mats={mats} spin={spin} />
      <Wheel x={FRONT_X} side={-1} geos={geos} mats={mats} spin={spin} />
      <Wheel x={REAR_X} side={1} geos={geos} mats={mats} spin={spin} />
      <Wheel x={REAR_X} side={-1} geos={geos} mats={mats} spin={spin} />
    </group>
  )
}
