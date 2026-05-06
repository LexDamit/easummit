export const defaultRegistrationCatalog = {
  variants: [
    {
      id: 'local',
      pageLabel: 'Local',
      title: 'Local participants',
      description:
        'The packages below are reserved for participants from Luxembourg who hold an FLA or INAPS licence. All packages include full conference access, coffee breaks and lunch on Saturday.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday.',
          price: 62,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
          price: 124,
        },
      ],
    },
    {
      id: 'partners',
      pageLabel: 'Partners',
      title: 'Partners',
      description:
        'Packages for partner delegates. All packages include full conference access, coffee breaks and lunch on Saturday.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday.',
          price: 130,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
          price: 260,
        },
      ],
    },
    {
      id: 'international',
      pageLabel: 'International',
      title: 'International',
      description:
        'Packages for international participants. All packages include full conference access, coffee breaks and lunch on Saturday.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday.',
          price: 240,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
          price: 480,
        },
      ],
    },
  ],
  addonsByPackage: {
    single: [
      { id: 'networking-dinner', name: 'Networking dinner (Saturday evening)', price: 60 },
      { id: 'hotel-09-10', name: 'Hotel stay 1 night (09-10 October)', price: 130 },
      { id: 'hotel-10-11', name: 'Hotel stay 1 night (10-11 October)', price: 130 },
      { id: 'hotel-09-11', name: 'Hotel stay 2 nights (09-11 October)', price: 260 },
    ],
    double: [
      { id: 'networking-dinner', name: 'Networking dinner (Saturday evening)', price: 120 },
      { id: 'hotel-09-10', name: 'Hotel stay 1 night (09-10 October)', price: 150 },
      { id: 'hotel-10-11', name: 'Hotel stay 1 night (10-11 October)', price: 150 },
      { id: 'hotel-09-11', name: 'Hotel stay 2 nights (09-11 October)', price: 300 },
    ],
  },
}
