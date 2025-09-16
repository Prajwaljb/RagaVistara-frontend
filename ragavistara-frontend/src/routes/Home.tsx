export default function Home() {
  return (
    <section className="relative overflow-hidden">
      <div className="px-6 md:px-10 py-10 md:py-14">
        <div className="hero-grid">
          <div className="panel">
            <h2 className="text-2xl md:text-3xl font-bold">Audio Analyser</h2>
            <p className="text-sm text-neutral-300 mt-2 max-w-xl">
              Upload the audio of a Carnatic/Hindustani excerpt to get raga ID, tonic, pitch contour, tempo, separation, karaoke, and notation hints.
            </p>
            <div className="row mt-6">
              <a href="/analyze" className="btn-brand">Upload Audio</a>
              <a href="/analyze" className="btn-outline">Record Audio</a>
            </div>
            <div className="grid3 mt-6 text-sm">
              <input placeholder="Raga Name" className="field" aria-label="Raga" />
              <input placeholder="Pitch" className="field" aria-label="Pitch" />
              <input placeholder="Tempo" className="field" aria-label="Tempo" />
            </div>
            <div className="mt-6 text-sm row">
              <span className="chip">Vocals</span>
              <span className="chip">Karaoke</span>
              <span className="chip">Notations</span>
            </div>
          </div>
          <div className="panel">
            <h2 className="text-2xl md:text-3xl font-bold">Audio Generator</h2>
            <p className="text-sm text-neutral-300 mt-2 max-w-xl">Generate a short melody in the selected raga.</p>
            <div className="mt-6 grid gap-3 max-w-sm">
              <input placeholder="Enter Raga Name" className="rounded-xl bg-white/5 px-3 py-2 border border-white/10" aria-label="Generator Raga" />
              <div className="flex gap-3">
                <button className="btn-brand">Generate</button>
                <button className="btn-outline">Play</button>
                <button className="btn-outline">Download</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


