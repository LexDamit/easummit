import Hero from '../components/Hero'

const reasons = [
  {
    title: 'Applied coaching insights',
    copy:
      'Translate current performance thinking into practical daily sessions for sprint, endurance, jumps, throws, and youth development environments.',
  },
  {
    title: 'Cross-discipline exchange',
    copy:
      'Benchmark your programme against peers from clubs, federations, institutes, and private performance settings across Europe.',
  },
  {
    title: 'Leadership and athlete care',
    copy:
      'Explore communication, staff alignment, travel rhythm, and recovery planning that support athletes beyond isolated sessions.',
  },
]

const speakers = [
  { name: 'Elena Markovic', role: 'High Performance Sprint Coach' },
  { name: 'Thomas Richter', role: 'Federation Endurance Lead' },
  { name: 'Sofia Almeida', role: 'Applied Biomechanics Consultant' },
  { name: 'Jonas van der Meer', role: 'Athlete Pathway Director' },
]

const agenda = [
  {
    time: '08:45',
    title: 'Opening performance briefing',
    copy:
      'A sharp editorial-style scene setter on the future demands of elite and emerging athletics coaching.',
  },
  {
    time: '10:15',
    title: 'Coaching lab blocks',
    copy:
      'Small-group sessions on speed mechanics, endurance decision-making, and event-group integration.',
  },
  {
    time: '14:00',
    title: 'Programme design forum',
    copy:
      'Case-study reviews covering championship preparation, multidisciplinary staffing, and athlete communication.',
  },
]

function Home({ navigate, onSelectPackage }) {
  return (
    <div className="page">
      <Hero navigate={navigate} onSelectPackage={onSelectPackage} />

      <section className="section">
        <div className="shell-section section-grid">
          <div className="content-panel">
            <span className="section-label">Summit overview</span>
            <h2 className="section-heading">A premium coaching environment built for modern track and field.</h2>
            <p className="section-copy">
              The European Athletics Coaching Summit is a fictional two-day registration event designed for coaches,
              technical leaders, and programme directors who want sharper conversations around performance, education,
              and athlete development. Expect practical sessions, strong curation, and a room full of ambitious practitioners.
            </p>
          </div>
          <div className="stats-grid">
            <article className="info-card">
              <span className="meta-chip">Format</span>
              <h3>2-day summit</h3>
              <p>Editorial keynotes, coaching labs, leadership forums, and structured networking.</p>
            </article>
            <article className="info-card">
              <span className="meta-chip">Audience</span>
              <h3>Club to federation</h3>
              <p>Built for coaches, pathway leads, technical directors, and support staff.</p>
            </article>
            <article className="info-card">
              <span className="meta-chip">Focus</span>
              <h3>Performance + education</h3>
              <p>High-value learning with immediate relevance to season planning and staff decision-making.</p>
            </article>
            <article className="info-card">
              <span className="meta-chip">Experience</span>
              <h3>Premium hospitality</h3>
              <p>Curated spaces, efficient pacing, and a polished event feel from arrival to closing session.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section section-stack">
          <div>
            <span className="section-label">Why attend</span>
            <h2 className="section-heading">High-level learning without the conference clutter.</h2>
            <p className="section-copy">
              Every block is designed to help you coach better, lead more clearly, and bring sharper ideas back into your environment.
            </p>
          </div>
          <div className="reasons-grid">
            {reasons.map((reason) => (
              <article className="info-card" key={reason.title}>
                <h3>{reason.title}</h3>
                <p>{reason.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section section-stack">
          <div>
            <span className="section-label">Speakers</span>
            <h2 className="section-heading">Placeholder faculty representing a modern European performance mix.</h2>
          </div>
          <div className="speaker-grid">
            {speakers.map((speaker) => (
              <article className="speaker-card" key={speaker.name}>
                <div className="speaker-card__image" aria-hidden="true" />
                <h3>{speaker.name}</h3>
                <p>{speaker.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section section-stack">
          <div>
            <span className="section-label">Programme highlights</span>
            <h2 className="section-heading">Sample agenda built around coaching transfer, not passive listening.</h2>
          </div>
          <div className="agenda-grid">
            {agenda.map((item) => (
              <article className="agenda-card" key={item.title}>
                <span className="agenda-card__time">{item.time}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section section-grid">
          <article className="venue-card">
            <span className="section-label">Venue</span>
            <h2 className="section-heading">Hosted in a fictional high-performance setting in Lausanne, Switzerland.</h2>
            <p className="section-copy">
              Expect light-filled plenary rooms, breakout studios for technical sessions, and easy access for travelling staff
              and federations arriving from across Europe.
            </p>
          </article>
          <article className="partner-strip">
            <span className="section-label">Partner placeholders</span>
            <div className="partner-grid">
              <span>Institute Partner</span>
              <span>Performance Brand</span>
              <span>Data Partner</span>
              <span>Education Partner</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="shell-section cta-banner">
          <span className="section-label">Registration</span>
          <h2 className="section-heading">Secure your place and move straight into hosted payment.</h2>
          <p className="section-copy">
            Choose the package that fits your role, complete your details, and continue to the external SumUp checkout flow.
          </p>
          <div className="cta-row">
            <button className="button button--primary" onClick={() => navigate('packages')}>
              View packages
            </button>
            <button className="button button--ghost" onClick={onSelectPackage}>
              Start registration
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
