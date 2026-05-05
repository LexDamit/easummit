export const defaultRegistrationCatalog = {
  variants: [
    {
      id: 'local',
      pageLabel: 'Local',
      title: 'Local registration',
      description:
        'Conference access for participants registering from the local host environment.',
      baseItemName: 'Conference Access',
      price: 120,
    },
    {
      id: 'partners',
      pageLabel: 'Partners',
      title: 'Partners registration',
      description:
        'Conference access for partners, invited guests and affiliated organisations.',
      baseItemName: 'Conference Access',
      price: 220,
    },
    {
      id: 'international',
      pageLabel: 'International',
      title: 'International registration',
      description:
        'Conference access for international delegates, guests and travelling participants.',
      baseItemName: 'Conference Access',
      price: 320,
    },
  ],
  addons: [
    { id: 'networking-dinner', name: 'Networking Dinner', price: 75 },
    {
      id: 'single-10-11',
      name: 'Accommodation Single 10-11.10.2026',
      price: 160,
    },
    {
      id: 'single-11-12',
      name: 'Accommodation Single 11-12.10.2026',
      price: 160,
    },
    {
      id: 'double-10-11',
      name: 'Accommodation Double 10-11.10.2026',
      price: 115,
    },
    {
      id: 'double-11-12',
      name: 'Accommodation Double 11-12.10.2026',
      price: 115,
    },
  ],
}
