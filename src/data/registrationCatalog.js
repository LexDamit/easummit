export const defaultRegistrationCatalog = {
  variants: [
    {
      id: 'local',
      pageLabel: 'Local',
      title: 'Local participants',
      description:
        'The packages below are reserved for participants from Luxembourg who hold an FLA or INAPS licence. Conference access is included and Lunches & Coffee Breaks can be added as an option.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription: 'Includes full conference access.',
          price: 0,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription: 'Includes full conference access for 2 participants.',
          price: 0,
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
  addonsByVariant: {
    local: {
      single: [
        { id: 'lunches-coffee-breaks', name: 'Lunches & Coffee Breaks', price: 62 },
      ],
      double: [
        { id: 'lunches-coffee-breaks', name: 'Lunches & Coffee Breaks', price: 124 },
      ],
    },
  },
}

const ensureAddon = (addons = [], addon) => {
  if (addons.some((item) => item.id === addon.id)) {
    return addons
  }

  return [...addons, addon]
}

export const normalizeRegistrationCatalog = (catalog) => {
  const source = catalog || defaultRegistrationCatalog
  const variants = (source.variants || defaultRegistrationCatalog.variants).map((variant) => {
    if (variant.id !== 'local') {
      return variant
    }

    return {
      ...variant,
      description:
        variant.description ||
        'The packages below are reserved for participants from Luxembourg who hold an FLA or INAPS licence. Conference access is included and Lunches & Coffee Breaks can be added as an option.',
      packageOptions: (variant.packageOptions || []).map((option) => ({
        ...option,
        price: 0,
        baseDescription:
          option.id === 'double'
            ? 'Includes full conference access for 2 participants.'
            : 'Includes full conference access.',
      })),
    }
  })

  const globalAddons = source.addonsByPackage || defaultRegistrationCatalog.addonsByPackage
  const variantAddons = source.addonsByVariant || {}

  return {
    ...source,
    variants,
    addonsByPackage: globalAddons,
    addonsByVariant: {
      ...variantAddons,
      local: {
        ...(variantAddons.local || {}),
        single: ensureAddon(variantAddons.local?.single || [], {
          id: 'lunches-coffee-breaks',
          name: 'Lunches & Coffee Breaks',
          price: 62,
        }),
        double: ensureAddon(variantAddons.local?.double || [], {
          id: 'lunches-coffee-breaks',
          name: 'Lunches & Coffee Breaks',
          price: 124,
        }),
      },
    },
  }
}
