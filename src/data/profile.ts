/* ============================================================
   SINGLE SOURCE OF TRUTH — everything Abishek actually said.
   Do not invent facts. If it is not here, it was not said.
   ============================================================ */

export const IDENTITY = {
  name: 'Abishek',
  alias: 'Abi',
  age: 22,
  role: 'IT Employee',
  company: 'IT',
  education: 'Computer Science / IT',
  zodiac: 'Taurus',
  favouriteColour: 'White',
  tagline: 'I read people before I trust them. It usually takes a while.',
}

/* Social links — Abishek will supply these. Fill `url` when he does. */
export const SOCIALS: { label: string; url: string | null }[] = [
  { label: 'Instagram', url: 'https://instagram.com/abishek.rar' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/abishek-c7' },
  { label: 'X', url: 'https://x.com/abishek_c7' },
  { label: 'GitHub', url: 'https://github.com/Abishek66r' },
  { label: 'Phone', url: 'tel:+919944887623' },
]

/* ---------- Weighted distributions ----------
   [label, minWeight, maxWeight]. Never rendered as a number —
   weight drives size / density / motion / position only.
------------------------------------------------------------- */
export type Weighted = [label: string, lo: number, hi: number]

export type PanelSpec = {
  id: string
  title: string
  note: string
  hint: string
  /** which visual mechanic renders this panel */
  viz: 'orbit' | 'mosaic' | 'constellation' | 'liquid' | 'dial' | 'swarm' | 'strata' | 'pulse'
  options: Weighted[]
}

export const LAB_PANELS: PanelSpec[] = [
  {
    id: 'music',
    title: 'Music, by language',
    note: 'I genuinely listen to everything. Whatever is playing is the favourite.',
    hint: 'No language has ever been off the table.',
    viz: 'orbit',
    options: [
      ['Tamil', 22, 34],
      ['Hindi', 14, 24],
      ['English', 16, 27],
      ['Telugu', 9, 17],
      ['Malayalam', 6, 13],
      ['Kannada', 5, 12],
    ],
  },
  {
    id: 'film',
    title: 'Film genre tonight',
    note: 'Also all of them. It comes down entirely to what mood I walked in with.',
    hint: 'Psychological thrillers win slightly more often than I admit.',
    viz: 'mosaic',
    options: [
      ['Psychological thriller / crime', 22, 33],
      ['Action / mass entertainer', 20, 30],
      ['Emotional drama', 13, 23],
      ['Comedy / light watch', 13, 22],
      ['Something completely random', 5, 12],
    ],
  },
  {
    id: 'social',
    title: 'How social I am today',
    note: 'Ambivert is not a midpoint. It is a switch that flips without warning.',
    hint: 'Same person, different day, opposite answer.',
    viz: 'dial',
    options: [
      ['Fully social, on, talking', 22, 36],
      ['Selective — a few people', 26, 40],
      ['Present but silent', 14, 24],
      ['Completely off, alone', 10, 22],
    ],
  },
  {
    id: 'style',
    title: 'What I wore',
    note: 'Casual, sharp or all-black. I care about it more than I let on.',
    hint: 'All-black is the safe default when I cannot decide.',
    viz: 'strata',
    options: [
      ['Casual & simple', 28, 42],
      ['Sharp & stylish', 22, 34],
      ['All-black minimal', 20, 33],
      ['Zero effort, honestly', 4, 11],
    ],
  },
  {
    id: 'belief',
    title: 'What I believe, today',
    note: 'God and fate. Energy and the universe. Cold logic. Quiet respect. All four are true — never at the same strength.',
    hint: 'This is the panel that moves the most.',
    viz: 'constellation',
    options: [
      ['Spiritual — god & fate', 22, 36],
      ['Energy / the universe', 18, 30],
      ['Logical, sceptical', 18, 32],
      ['Respect it, do not practise', 12, 24],
    ],
  },
  {
    id: 'drink',
    title: 'What I am drinking',
    note: 'Tea, coffee, cold, fizzy, energy. Total absence of loyalty.',
    hint: 'The only category where I have no preference at all.',
    viz: 'liquid',
    options: [
      ['Coffee', 20, 32],
      ['Tea', 18, 30],
      ['Cold drink / juice', 16, 28],
      ['Energy drink', 10, 20],
      ['Just water', 8, 18],
    ],
  },
  {
    id: 'power',
    title: 'Superpower, if forced to choose',
    note: 'I refused to pick one, so here is the spread. Notice what they all have in common.',
    hint: 'Every option is more information and less exposure.',
    viz: 'swarm',
    options: [
      ['Mind reading', 24, 36],
      ['Super intelligence', 20, 32],
      ['Time control', 18, 30],
      ['Invisibility', 14, 26],
    ],
  },
  {
    id: 'badday',
    title: 'How I handle a bad day',
    note: 'There is no method. There is just whichever one happens.',
    hint: 'I almost never hand it to someone else to carry.',
    viz: 'pulse',
    options: [
      ['Do nothing at all', 24, 38],
      ['Divert — noise, screen, else', 22, 34],
      ['Accept the pain, stay calm', 22, 36],
      ['Analyse it apart', 8, 18],
    ],
  },
]

/* ---------- HER — no numbers, no bars, no percentages ----------
   Rendered as a gravity/constellation field. `pull` is relative
   attraction strength only, used for size + orbit, never shown.
------------------------------------------------------------- */
export type Pull = { label: string; pull: number; note: string }

export const HER_LOOK: Pull[] = [
  { label: 'Curly hair', pull: 0.95, note: 'Never loses. The first thing I notice.' },
  { label: 'Pretty, with specs', pull: 0.92, note: 'Something about it undoes the whole analysis.' },
  { label: 'Chubby / soft build', pull: 0.85, note: 'Softness reads as warmth to me.' },
  { label: 'Dusky, brown skin', pull: 0.83, note: 'My eye goes there before I decide to.' },
  { label: 'Whoever she is', pull: 0.99, note: 'No type, no filter. If any girl comes, I accept her completely.' },
]

export const HER_PERSON: Pull[] = [
  { label: 'Smart, deep thinker', pull: 0.97, note: 'The one I cannot fake interest in.' },
  { label: 'Bold & independent', pull: 0.86, note: 'Knowing what she wants does something to me.' },
  { label: 'Cute, warm, caring', pull: 0.82, note: 'The part of me that is not analytical at all.' },
  { label: 'Stylish & put together', pull: 0.68, note: 'It matters. I will not pretend it does not.' },
]

export const HER_BEHAVIOUR: Pull[] = [
  { label: 'Straightforward, direct', pull: 0.9, note: 'Blunt before I am charming.' },
  { label: 'Depends on mood & person', pull: 0.95, note: 'Mood decides this more than I do.' },
  { label: 'Flirty, once comfortable', pull: 0.84, note: 'It only switches on after the guard drops.' },
]

/* The aperture — how far in someone actually gets. Ordered
   outermost → innermost. `reach` is 0..1 for ring radius. */
export const HER_APERTURE = [
  { label: 'Quietly tested first', reach: 1.0, note: 'You never know you are taking it.' },
  { label: 'Slow to open, then loyal', reach: 0.72, note: 'Once you are in, I do not leave.' },
  { label: 'Some distance always kept', reach: 0.44, note: 'The truest line on this page.' },
  { label: 'Fully, no walls', reach: 0.1, note: 'Almost nobody. Maybe nobody.' },
]

export const HER_TRUTHS = [
  {
    title: 'The honest part',
    body: [
      'I open up slowly. Once you are actually in, I am loyal in a way I do not think I could switch off.',
      'But even then, I keep a distance. Some part of me stays back, watching, holding something in reserve. That is the most true thing on this page, and it is the part I am still working on.',
    ],
  },
  {
    title: 'On marriage',
    body: [
      'No plan. No timeline. No strong opinion.',
      'Same as everything else: if it is meant to happen, it will happen. I am not chasing it and I am not avoiding it.',
    ],
  },
]

/* ---------- MIND ---------- */
export const MIND_READOUT = [
  ['social_mode', 'ambivert', 'the ratio changes with the room'],
  ['trust_default', 'closed', 'not granted, earned — slowly'],
  ['signature_skill', 'reading people', 'fast, usually accurate'],
  ['origin', 'observation', "no single incident. I've just seen many people."],
]

export const MIND_CARDS = [
  {
    title: 'The habit, not the trick',
    body: [
      'I can usually work out where someone stands within a few minutes — what they want, what they are protecting, which version of themselves they are showing me.',
      'It is not a gift I was handed. I grew up watching people closely, and pattern recognition is just what happens when you watch long enough.',
    ],
  },
  {
    title: 'Why the door stays shut',
    body: [
      'Nobody betrayed me into this. It came from noticing how often people’s words and behaviour do not line up.',
      'So I let people in slowly, and I test them without announcing it. If you are still here after a while, it means you passed something you never knew you were taking.',
    ],
  },
  {
    title: 'When it hurts',
    body: [
      'I do not have a coping system. Mostly I do nothing.',
      'Sometimes I divert — noise, screen, something else to look at. Sometimes I just accept the pain and stay calm with it. I rarely fight it, and I almost never hand it to someone else to hold.',
    ],
  },
]

export const FEARS = [
  { n: '01', title: 'Betrayal', note: 'Trusting the wrong person and paying for it.' },
  { n: '02', title: 'Wasted potential', note: 'Not becoming who I could have been.' },
  { n: '03', title: 'Losing my people', note: 'The few I actually let in.' },
  { n: '04', title: 'Being financially stuck', note: 'No room, no options, no exit.' },
]

/* ---------- MACHINES ---------- */
export const MACHINE_TILES = [
  {
    n: '01',
    title: 'Tech & gadgets',
    body: 'The thing I am most attached to. Phones, gear, anything well-made and well-thought-out. It is the closest I get to a comfort object.',
  },
  {
    n: '02',
    title: 'Dogs',
    body: 'Second, and not by much. Loyalty with nothing calculated behind it — the exact thing I spend most of my time analysing in people is just free with them.',
  },
  {
    n: '03',
    title: 'White',
    body: 'My favourite colour. Clean, quiet, nothing to decode. Which is funny, coming from someone whose whole personality is decoding things.',
  },
  {
    n: '04',
    title: 'Anything drinkable',
    body: 'Tea, coffee, cold, fizzy, energy — I genuinely drink all of it. No loyalty here whatsoever.',
  },
]

export const BMW = {
  badge: 'all-time',
  word: 'BMW',
  quote: 'My all-time girlfriend kind of feeling.',
  body:
    'I admire it more than I want to admit. Not just as a car — as an idea of how performance should feel. This white M3 is the one piece of engineering that feels like a permanent corner of my taste.',
  meta: [
    ['relationship status', 'admiration, permanent'],
    ['competition', 'every other machine'],
    ['also loves', 'every other car'],
  ],
}

/* ---------- DUALITY ---------- */
export const SHADOW = [
  { title: 'I overthink', note: 'I run situations and people through my head far past the point of usefulness.' },
  { title: 'I am emotionally distant', note: 'Even with people I love. There is always a part of me held back.' },
  { title: 'I am too guarded', note: 'Sometimes I suspect people who genuinely never earned it. That is on me, not them.' },
]

export const LIGHT = [
  { title: 'I read people', note: 'Quickly and usually correctly. It is the thing about me I would least like to lose.' },
  { title: 'I am self-made', note: 'What I have, I built. Nobody carried me here.' },
  { title: 'I am loyal', note: 'Hard to get in. Once you are in, I do not leave.' },
]

/* ---------- ROOTS ---------- */
export const ROOTS = [
  {
    tag: 'Zodiac',
    title: 'Taurus',
    body:
      'I usually do not put weight on astrology, but this one lands. Grounded, wants security, stubborn once decided, slow to move and slower to move on, loyal past the point of reason. It reads like someone described me and then filed it under a sign.',
    wide: true,
  },
  {
    tag: 'Family',
    title: 'Close, but independent',
    body: 'Good bond. Real bond. And also my own space, my own decisions, my own room to move. Both at once, no conflict.',
    wide: false,
  },
  {
    tag: 'Belief',
    title: 'All four at once',
    body:
      'I believe in god and fate. I believe in energy and the universe. I am logical and sceptical. And there are parts I respect without practising. All of it is true depending on the day.',
    wide: false,
  },
  {
    tag: 'The defining thing',
    title: 'Not one moment. Many people.',
    body:
      'There is no single story that made me this way — no one betrayal, no one achievement, no one hard night. It was all of it, and mostly it was volume. I have watched a lot of people. You learn what humans do when they think nobody is reading them, and after a while you cannot unsee it.',
    wide: true,
  },
]

/* ---------- ALTER EGOS ---------- */
export const EGOS = [
  {
    k: 'I',
    name: 'Batman',
    why: 'The watcher who keeps every angle covered. Suspicious, patient, and quietly in control until the moment is right.',
  },
  {
    k: 'II',
    name: 'The Professor',
    why: 'The strategist who plans three moves ahead. Calm, precise, and always ready with a solution others never saw coming.',
  },
  {
    k: 'III',
    name: 'The crowd magnet',
    why: 'The visible force. Charismatic, composed, and suddenly all-in when it is time to protect the people who matter.',
  },
]

export const POWERS = [
  ['Mind reading', 'the ability I already practise, turned all the way up'],
  ['Time control', 'fate, but with a rewind'],
  ['Invisibility', 'observe everything and remain unseen'],
  ['Super intelligence', 'finally finish the money-and-psychology homework'],
]

/* ---------- CAREER ---------- */
export const CV = [
  ['now', 'IT Employee', '· working in IT'],
  ['before', 'Computer Science / IT', '· degree'],
  ['age', '22', '· early, and aware of it'],
]

export const TRACKS = [
  {
    tag: 'Track A',
    title: 'Climb',
    body:
      'Go up inside tech. Bigger roles, bigger scope, better money. I am not romantic about corporate life, but I am not pretending it is not the fastest ladder in front of me either.',
  },
  {
    tag: 'Track B',
    title: 'Build my own',
    body:
      'Start something that is mine. This is where the money-and-psychology obsession stops being a hobby and starts being a toolkit — reading a market is just reading people at scale.',
  },
]

/* ---------- SECTION REGISTRY (nav + numbering) ---------- */
export const SECTIONS = [
  { id: 'mind', label: 'Mind', index: '01' },
  { id: 'philosophy', label: 'Philosophy', index: '02' },
  { id: 'lab', label: 'Possibility', index: '03' },
  { id: 'her', label: 'Her', index: '04' },
  { id: 'bmw', label: 'BMW', index: '05' },
  { id: 'machines', label: 'Machines', index: '06' },
  { id: 'career', label: 'Work', index: '07' },
  { id: 'duality', label: 'Light & Shadow', index: '08' },
  { id: 'roots', label: 'Roots', index: '09' },
  { id: 'egos', label: 'Alter Egos', index: '10' },
  { id: 'drift', label: 'Drift', index: '11' },
] as const

export const TOTAL = 'twelve'
