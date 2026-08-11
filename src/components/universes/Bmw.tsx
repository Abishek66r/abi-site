import { Universe, UniverseHead } from '../shell/Universe'
import { BMW } from '../../data/profile'

export default function Bmw() {
  return (
    <Universe id="bmw" tone="bmw" bleed>
      <div className="bmw__stage" aria-label="BMW M3 feature video" role="img">
        <video
          className="bmw__video"
          preload="auto"
          muted
          autoPlay
          loop
          playsInline
          poster="/bmw-m3-poster.jpg"
        >
          <source src="/bmw-m3.mp4" type="video/mp4" />
          Your browser does not support the BMW video.
        </video>
      </div>

      <div className="u__inner bmw__copy">
        <UniverseHead index="05" title="BMW" sub="A feeling built around motion and headlights." />

        <div className="bmw__card">
          <p className="bmw__badge">{BMW.badge}</p>
          <h3 className="bmw__word">{BMW.word}</h3>
          <p className="bmw__quote">“{BMW.quote}”</p>
          <p className="bmw__body">{BMW.body}</p>
          <div className="bmw__meta">
            {BMW.meta.map(([label, value]) => (
              <div key={label}>
                <b>{label}</b>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Universe>
  )
}
