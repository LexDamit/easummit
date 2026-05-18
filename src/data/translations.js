const uiTranslations = {
  en: {
    languageLabel: 'Language',
    french: 'FR',
    english: 'EN',
    headerEyebrow: '',
    headerTitle: 'EA European Athletics Coaching Summit 2026 Registration',
    headerSubtitle: '',
    currentPage: 'Current page',
    currentPageAdmin: 'Admin',
    currentPageSuccess: 'Confirmation',
    currentPageCancel: 'Payment cancelled',
    footerText: 'Conference registration, add-ons, tickets and live admin tracking.',
    adminLogin: 'Admin login',
    notices: {
      offline:
        'Firebase catalog unavailable right now. The app is using local fallback prices until the connection is restored.',
      unavailable:
        'Firebase catalog could not be loaded. The app is using local fallback prices.',
    },
    checkout: {
      packageSelection: 'Package selection',
      packageIntroLabel: 'Registration package',
      packageSelectionHelp:
        'Choose whether you want to complete one registration for 1 participant or one registration for 2 participants together.',
      participantsIncluded: '{count} participant included',
      participantsIncludedPlural: '{count} participants included',
      packageHeroPrefix: 'Package Coaching Summit: ',
      conditionsLabel: 'Conditions',
      eligibilityLabel: 'Eligibility',
      includesLabel: 'Included in all packages',
      addons: 'Add-ons',
      participantInformation: 'Participant information',
      participantInformationIndexed: 'Participant {index} information',
      firstName: 'First Name',
      lastName: 'Name',
      email: 'Email',
      country: 'Country',
      memberFederation: 'Member Federation',
      role: 'Role',
      gender: 'Gender',
      select: 'Select',
      selectCountry: 'Select a country',
      selectFederation: 'Select a federation',
      selectRole: 'Select a role',
      female: 'Female',
      male: 'Male',
      nonBinary: 'Non-binary',
      preferNotToSay: 'Prefer not to say',
      orderSummary: 'Order summary',
      orderSummaryEyebrow: 'Live total',
      total: 'Total',
      participantCount: '{count} participant',
      participantCountPlural: '{count} participants',
      continueToPayment: 'Continue to payment',
      preparingPayment: 'Preparing payment...',
      optionalAddon: 'Optional add-on',
      dinnerSingle: 'Includes 1 dinner place.',
      dinnerDouble: 'Includes 2 dinner places for both participants.',
      hotelSingle: 'Includes a single room for 1 participant.',
      hotelDouble: 'Includes a double room for both participants.',
      errors: {
        firstNameRequired: 'First name is required.',
        lastNameRequired: 'Name is required.',
        emailRequired: 'Email is required.',
        emailInvalid: 'Please enter a valid email.',
        countryRequired: 'Country is required.',
        federationRequired: 'Member Federation is required.',
        roleRequired: 'Role is required.',
        genderRequired: 'Gender is required.',
        function404:
          'Netlify Functions are not available on this dev server. Run the app with `netlify dev` instead of plain `vite`.',
        checkoutFailed: 'Unable to create checkout.',
      },
      conditionsByVariant: {
        local: [
          'Reserved for participants from Luxembourg.',
          'Valid for FLA or INAPS licence holders.',
        ],
        partners: ['Reserved for FFA, GEFA or Swiss Athletics licence holders.'],
        international: [],
      },
      includesByVariant: {
        local:
          'All packages include full conference access, coffee breaks and lunch on Saturday.',
        partners:
          'All packages include full conference access, coffee breaks and lunch on Saturday.',
        international:
          'All packages include full conference access, coffee breaks and lunch on Saturday.',
      },
    },
    success: {
      missingReference: 'Missing booking reference.',
      loading: 'Loading order summary...',
      loadFailed: 'Unable to load registration.',
      chip: 'Order summary',
      title: 'Your registration has been created.',
      copy:
        'Payment return received. Final payment confirmation has been received.',
      emailSent:
        'Your official confirmation and ticket have been sent to your email address.',
      pendingCopy:
        'Your registration has been created, but it only becomes valid once the payment is confirmed.',
      reference: 'Reference',
      participant: 'Participant',
      category: 'Category',
      package: 'Package',
      total: 'Total',
      paymentStatus: 'Payment status',
      paymentConfirmed: 'Confirmed',
      paymentPending: 'Pending confirmation',
      ticketChip: 'Official ticket',
      pendingChip: 'Awaiting payment confirmation',
      pendingTicketNotice:
        'The official ticket and QR code will become available once the payment has been confirmed.',
      showQr: 'Show this QR code on arrival.',
      participants: 'Participants',
      addons: 'Add-ons',
      newRegistration: 'New registration',
    },
    cancel: {
      chip: 'Payment cancelled',
      title: 'The payment was not completed.',
      copy:
        'The registration is still incomplete. You can return to one of the registration pages and try again.',
      back: 'Back to registrations',
    },
    admin: {
      firebaseMissingTitle: 'Firebase is not configured.',
      firebaseMissingCopy:
        'Add the Firebase frontend and server environment variables to activate the live admin area.',
      signInTitle: 'Admin sign in',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      signOut: 'Sign out',
      loginError: 'Unable to sign in.',
      liveAdmin: 'Live admin',
      registrationsAndPricing: 'Registrations and pricing',
      signedInAs: 'Signed in as {email}',
      pricingCatalog: 'Pricing catalog',
      savePrices: 'Save prices',
      catalogSaved: 'Catalog saved.',
      catalogSaveFailed: 'Unable to save catalog.',
      basePages: 'Base pages',
      pageLabel: 'Page label',
      title: 'Title',
      description: 'Description',
      packageName: 'Package name',
      conferencePrice: 'Conference access price',
      packageDescription: 'Package description',
      addons: 'Add-ons',
      basePackageSingle: 'Base package 1 person',
      basePackageDouble: 'Base package 2 people',
      name: 'Name',
      price: 'Price',
      liveRegistrations: 'Live registrations',
      records: '{count} records',
      totalPrefix: 'Total: EUR {amount}',
      referencePrefix: 'Reference: {reference}',
      packagePrefix: 'Package: {name}',
      participants: 'Participants',
      participantIndexed: 'Participant {index}',
      hotelRoom: 'Hotel room',
      adminNotes: 'Admin notes',
      noRegistrations: 'No registrations yet.',
      pending: 'pending',
    },
  },
  fr: {
    languageLabel: 'Langue',
    french: 'FR',
    english: 'EN',
    headerEyebrow: '',
    headerTitle: 'EA European Athletics Coaching Summit 2026 Registration',
    headerSubtitle: '',
    currentPage: 'Page active',
    currentPageAdmin: 'Admin',
    currentPageSuccess: 'Confirmation',
    currentPageCancel: 'Paiement annulé',
    footerText:
      "Inscription conference, options, billets et suivi administratif en direct.",
    adminLogin: 'Connexion admin',
    notices: {
      offline:
        "Le catalogue Firebase est indisponible pour le moment. L'application utilise les tarifs locaux de secours jusqu'au retour de la connexion.",
      unavailable:
        "Le catalogue Firebase n'a pas pu être chargé. L'application utilise les tarifs locaux de secours.",
    },
    checkout: {
      packageSelection: 'Choix du package',
      packageIntroLabel: "Package d'inscription",
      packageSelectionHelp:
        'Choisissez si vous souhaitez finaliser une inscription pour 1 participant ou une inscription commune pour 2 participants.',
      participantsIncluded: '{count} participant inclus',
      participantsIncludedPlural: '{count} participants inclus',
      packageHeroPrefix: 'Package Coaching Summit : ',
      conditionsLabel: 'Conditions',
      eligibilityLabel: 'Éligibilité',
      includesLabel: 'Inclus dans tous les packages',
      addons: 'Options',
      participantInformation: 'Informations du participant',
      participantInformationIndexed: 'Informations du participant {index}',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      country: 'Pays',
      memberFederation: 'Fédération membre',
      role: 'Rôle',
      gender: 'Genre',
      select: 'Sélectionner',
      selectCountry: 'Sélectionner un pays',
      selectFederation: 'Sélectionner une fédération',
      selectRole: 'Sélectionner un rôle',
      female: 'Femme',
      male: 'Homme',
      nonBinary: 'Non-binaire',
      preferNotToSay: 'Préfère ne pas répondre',
      orderSummary: 'Récapitulatif',
      orderSummaryEyebrow: 'Total en direct',
      total: 'Total',
      participantCount: '{count} participant',
      participantCountPlural: '{count} participants',
      continueToPayment: 'Continuer vers le paiement',
      preparingPayment: 'Préparation du paiement...',
      optionalAddon: 'Option supplémentaire',
      dinnerSingle: 'Comprend 1 place pour le dîner.',
      dinnerDouble: 'Comprend 2 places pour le dîner pour les deux participants.',
      hotelSingle: 'Comprend une chambre simple pour 1 participant.',
      hotelDouble: 'Comprend une chambre double pour les deux participants.',
      errors: {
        firstNameRequired: 'Le prénom est requis.',
        lastNameRequired: 'Le nom est requis.',
        emailRequired: "L'email est requis.",
        emailInvalid: 'Veuillez saisir un email valide.',
        countryRequired: 'Le pays est requis.',
        federationRequired: 'La fédération membre est requise.',
        roleRequired: 'Le rôle est requis.',
        genderRequired: 'Le genre est requis.',
        function404:
          "Les fonctions Netlify ne sont pas disponibles sur ce serveur de développement. Lancez l'application avec `netlify dev` au lieu de `vite`.",
        checkoutFailed: 'Impossible de créer le paiement.',
      },
      conditionsByVariant: {
        local: [
          'Réservé aux participants du Luxembourg.',
          'Valable pour les titulaires d’une licence FLA ou INAPS.',
        ],
        partners: ['Réservé aux licenciés de la FFA, de la GEFA ou de Swiss Athletics.'],
        international: [],
      },
      includesByVariant: {
        local:
          'Tous les packages incluent l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
        partners:
          'Tous les packages incluent l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
        international:
          'Tous les packages incluent l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
      },
    },
    success: {
      missingReference: 'Référence de réservation manquante.',
      loading: 'Chargement du récapitulatif...',
      loadFailed: "Impossible de charger l'inscription.",
      chip: 'Récapitulatif',
      title: 'Votre inscription a été créée.',
      copy:
        "Le retour de paiement a été reçu. La confirmation finale du paiement a bien été reçue.",
      emailSent:
        'Votre confirmation officielle et votre billet ont été envoyés par email.',
      pendingCopy:
        "Votre inscription a bien été créée, mais elle ne sera valide qu'une fois le paiement confirmé.",
      reference: 'Référence',
      participant: 'Participant',
      category: 'Catégorie',
      package: 'Package',
      total: 'Total',
      paymentStatus: 'Statut du paiement',
      paymentConfirmed: 'Confirmé',
      paymentPending: 'En attente de confirmation',
      ticketChip: 'Billet officiel',
      pendingChip: 'En attente de confirmation du paiement',
      pendingTicketNotice:
        'Le billet officiel et le QR code seront disponibles une fois le paiement confirmé.',
      showQr: "Présentez ce QR code à l'arrivée.",
      participants: 'Participants',
      addons: 'Options',
      newRegistration: 'Nouvelle inscription',
    },
    cancel: {
      chip: 'Paiement annulé',
      title: "Le paiement n'a pas été finalisé.",
      copy:
        "L'inscription est encore incomplète. Vous pouvez revenir sur l'une des pages d'inscription et réessayer.",
      back: 'Retour aux inscriptions',
    },
    admin: {
      firebaseMissingTitle: "Firebase n'est pas configuré.",
      firebaseMissingCopy:
        "Ajoutez les variables d'environnement Firebase front-end et serveur pour activer l'espace admin en direct.",
      signInTitle: 'Connexion admin',
      email: 'Email',
      password: 'Mot de passe',
      signIn: 'Se connecter',
      signOut: 'Se déconnecter',
      loginError: 'Connexion impossible.',
      liveAdmin: 'Admin en direct',
      registrationsAndPricing: 'Inscriptions et tarifs',
      signedInAs: 'Connecté en tant que {email}',
      pricingCatalog: 'Catalogue tarifaire',
      savePrices: 'Enregistrer les tarifs',
      catalogSaved: 'Catalogue enregistré.',
      catalogSaveFailed: "Impossible d'enregistrer le catalogue.",
      basePages: 'Pages de base',
      pageLabel: 'Libellé de page',
      title: 'Titre',
      description: 'Description',
      packageName: 'Nom du package',
      conferencePrice: "Prix d'accès conférence",
      packageDescription: 'Description du package',
      addons: 'Options',
      basePackageSingle: 'Package de base 1 personne',
      basePackageDouble: 'Package de base 2 personnes',
      name: 'Nom',
      price: 'Prix',
      liveRegistrations: 'Inscriptions en direct',
      records: '{count} dossiers',
      totalPrefix: 'Total : EUR {amount}',
      referencePrefix: 'Référence : {reference}',
      packagePrefix: 'Package : {name}',
      participants: 'Participants',
      participantIndexed: 'Participant {index}',
      hotelRoom: 'Chambre',
      adminNotes: 'Notes admin',
      noRegistrations: "Aucune inscription pour l'instant.",
      pending: 'en attente',
    },
  },
}

const catalogTranslations = {
  en: {
    variants: {
      local: {
        pageLabel: 'Local',
        title: 'Local participants',
        description:
          'The packages below are reserved for participants from Luxembourg who hold an FLA or INAPS licence. All packages include full conference access, coffee breaks and lunch on Saturday.',
      },
      partners: {
        pageLabel: 'Partners',
        title: 'Partners',
        description:
          'Packages for partner delegates. All packages include full conference access, coffee breaks and lunch on Saturday.',
      },
      international: {
        pageLabel: 'International',
        title: 'International',
        description:
          'Packages for international participants. All packages include full conference access, coffee breaks and lunch on Saturday.',
      },
    },
    packageOptions: {
      single: {
        name: 'Base package 1 person',
        baseItemName: 'Conference Access',
        baseDescription:
          'Includes full conference access, coffee breaks and lunch on Saturday.',
      },
      double: {
        name: 'Base package 2 people',
        baseItemName: 'Conference Access',
        baseDescription:
          'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
      },
    },
    addons: {
      'networking-dinner': 'Networking dinner (Saturday evening)',
      'hotel-09-10': 'Hotel stay 1 night (09-10 October)',
      'hotel-10-11': 'Hotel stay 1 night (10-11 October)',
      'hotel-09-11': 'Hotel stay 2 nights (09-11 October)',
    },
  },
  fr: {
    variants: {
      local: {
        pageLabel: 'Local',
        title: 'Participants locaux',
        description:
          'Les packages ci-dessous sont réservés aux participants du Luxembourg titulaires d’une licence FLA ou INAPS. Tous les packages incluent l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
      },
      partners: {
        pageLabel: 'Partenaires',
        title: 'Partenaires',
        description:
          'Packages pour les délégués partenaires. Tous les packages incluent l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
      },
      international: {
        pageLabel: 'International',
        title: 'International',
        description:
          'Packages pour les participants internationaux. Tous les packages incluent l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
      },
    },
    packageOptions: {
      single: {
        name: 'Package de base 1 personne',
        baseItemName: 'Accès conférence',
        baseDescription:
          'Inclut l’accès complet à la conférence, les pauses café et le déjeuner du samedi.',
      },
      double: {
        name: 'Package de base 2 personnes',
        baseItemName: 'Accès conférence',
        baseDescription:
          'Inclut l’accès complet à la conférence, les pauses café et le déjeuner du samedi pour 2 participants.',
      },
    },
    addons: {
      'networking-dinner': 'Dîner networking (samedi soir)',
      'hotel-09-10': 'Séjour hôtel 1 nuit (09-10 octobre)',
      'hotel-10-11': 'Séjour hôtel 1 nuit (10-11 octobre)',
      'hotel-09-11': 'Séjour hôtel 2 nuits (09-11 octobre)',
    },
  },
}

export const getUiTranslations = (language) =>
  uiTranslations[language] ?? uiTranslations.en

export const localizeCatalog = (catalog, language) => {
  const copy = catalogTranslations[language] ?? catalogTranslations.en

  return {
    ...catalog,
    variants: catalog.variants.map((variant) => ({
      ...variant,
      ...(copy.variants[variant.id] ?? {}),
      packageOptions: variant.packageOptions.map((option) => ({
        ...option,
        ...(copy.packageOptions[option.id] ?? {}),
      })),
    })),
    addonsByPackage: Object.fromEntries(
      Object.entries(catalog.addonsByPackage ?? {}).map(([packageType, addons]) => [
        packageType,
        addons.map((addon) => ({
          ...addon,
          name: copy.addons[addon.id] ?? addon.name,
        })),
      ]),
    ),
  }
}
