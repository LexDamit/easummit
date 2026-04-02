export const packages = [
  {
    id: 'coach',
    name: 'Coach Pass',
    price: 149,
    description:
      'A focused registration option for individual coaches who want access to the summit core programme and networking spaces.',
    includes: [
      'Full two-day summit access',
      'Keynotes, coaching labs, and networking sessions',
      'Digital programme guide and session notes',
    ],
  },
  {
    id: 'performance',
    name: 'Performance Pass',
    price: 249,
    description:
      'Built for practitioners who want deeper access, premium hospitality, and additional performance-focused session formats.',
    includes: [
      'Everything in Coach Pass',
      'Priority seating in featured sessions',
      'Performance roundtable access and hosted lunch',
      'Post-event insights deck',
    ],
  },
  {
    id: 'federation',
    name: 'Federation Pass',
    price: 499,
    description:
      'A senior-level package for federation leaders, pathway directors, and heads of performance attending with strategic intent.',
    includes: [
      'Everything in Performance Pass',
      'Invitation-only leadership breakfast',
      'Federation strategy forum access',
      'Concierge registration support',
    ],
  },
]

export const packageMap = Object.fromEntries(packages.map((item) => [item.id, item]))
