export const defaultSiteContent = {
  brand: {
    platformLabel: 'FLA event platform',
    organizationName: "Federation Luxembourgeoise d'Athletisme",
    contactEmail: 'events@fla.lu',
    footerNote:
      "Plateforme evenementielle FLA avec presentation publique, reservation separee et base evolutive pour un futur back office complet.",
  },
  hero: {
    label: 'Site evenementiel FLA',
    title: 'Une plateforme plus clean, plus lisible et facile a piloter.',
    description:
      "Le site presente l'evenement, valorise le programme, met en avant les partenaires et envoie les participants vers une page booking dediee.",
    primaryCta: 'Ouvrir les inscriptions',
    secondaryCta: 'Voir les formules',
    stats: [
      { label: 'Positionnement', value: 'Institutionnel et moderne' },
      { label: 'Parcours', value: 'One page + booking separe' },
      { label: 'Public', value: 'Participants, partenaires, equipes' },
      { label: 'Evolution', value: 'Pret pour Firebase et admin' },
    ],
  },
  home: {
    objectivesLabel: 'Objectifs',
    objectivesTitle: "Un site qui informe, engage et accompagne l'evenement du debut a la fin.",
    objectivesText:
      "L'objectif est de creer une porte d'entree digitale professionnelle pour les participants, les organisateurs et les partenaires.",
    highlights: [
      {
        label: 'Information',
        title: 'Toutes les informations essentielles, sans friction.',
        copy:
          'Concept, objectifs, public cible, horaires, lieu et contenus pratiques sont structures pour une lecture rapide.',
      },
      {
        label: 'Inscriptions',
        title: 'Un flux clair entre presentation et reservation.',
        copy:
          'Le site principal reste one-page tandis que la reservation vit sur une page dediee plus simple a faire evoluer.',
      },
      {
        label: 'Visibilite',
        title: 'Un ecrin moderne pour la communication FLA.',
        copy:
          'La plateforme valorise les partenaires, les actualites et les ressources dans une identite visuelle coherente.',
      },
    ],
    contentLabel: 'Contenus',
    contentTitle:
      'Une architecture simple pour mettre en valeur les informations essentielles.',
    contentBlocks: [
      {
        title: "Presentation de l'evenement",
        copy:
          "Le site agit comme hub central de communication avant, pendant et apres l'evenement.",
      },
      {
        title: 'Programme et intervenants',
        copy:
          'Le programme peut etre mis a jour facilement avec profils, horaires et contenus a telecharger.',
      },
      {
        title: 'Infos pratiques et logistiques',
        copy:
          'Lieu, transport, hebergement, acces et points participants restent regroupes dans une zone lisible.',
      },
    ],
    experienceLabel: 'Experience utilisateur',
    experienceTitle:
      'Navigation fluide, lecture rapide, image federale contemporaine.',
    experienceItems: [
      {
        title: 'Responsive par defaut',
        copy: 'Concu pour telephone, tablette et desktop sans multiplier les parcours.',
      },
      {
        title: 'Direction visuelle propre',
        copy: 'Typographie sans serif, palette FLA et mise en page plus sobre.',
      },
      {
        title: 'Base editable',
        copy: 'Les textes et formules peuvent etre modifies depuis un back office admin.',
      },
    ],
    timelineLabel: 'Cycle evenementiel',
    timelineTitle:
      'Avant, pendant et apres: la plateforme conserve sa valeur.',
    programme: [
      {
        time: "Avant l'evenement",
        title: 'Promotion et ouverture des inscriptions',
        copy: 'Le site centralise les annonces et guide vers la reservation.',
      },
      {
        time: "Pendant l'evenement",
        title: 'Actualites, infos live et ressources',
        copy: 'Documents, mises a jour et integrations peuvent etre ajoutes au fur et a mesure.',
      },
      {
        time: "Apres l'evenement",
        title: 'Heritage et valorisation des contenus',
        copy: 'Photos, videos, resultats et rapports peuvent prolonger la vie du projet.',
      },
    ],
    sponsorLabel: 'Partenaires et sponsors',
    sponsorTitle:
      'Une zone dediee pour les logos, packages de visibilite et contenus promotionnels.',
    sponsorText:
      'Le design prevoit deja des emplacements partenaires sobres et premium.',
    sponsorSlots: [
      'Partenaire titre',
      'Institution',
      'Sponsor technique',
      'Media partner',
    ],
    ctaLabel: 'Suite produit',
    ctaTitle: 'Le prochain niveau: comptes admins, contenus et offres configurables.',
    ctaText:
      'Le back office permet a terme de definir les formules, supplements et options comme repas, acces ou merchandising.',
    ctaPrimary: 'Tester la page booking',
    ctaSecondary: 'Voir les formules actuelles',
  },
  booking: {
    label: 'Booking',
    title:
      "Choisissez une formule d'inscription claire, puis continuez vers la reservation.",
    intro:
      "Cette page reste separee du site principal pour garder la communication propre tout en offrant un parcours d'inscription dedie.",
    backLabel: "Retour a l'accueil",
    summaryLabel: 'Resume',
  },
  checkout: {
    label: 'Checkout',
    title:
      'Completez les informations participant et poursuivez vers le paiement securise.',
    intro:
      'Les informations bancaires sont ensuite collectees sur la page de paiement hebergee par SumUp.',
    helper:
      'En continuant, vous quittez le site FLA pour terminer le paiement sur la page hebergee par SumUp.',
    submitLabel: 'Continuer vers le paiement',
    loadingLabel: 'Preparation du paiement...',
    changePackageLabel: 'Changer de formule',
  },
  success: {
    title: "Merci, votre demande d'inscription a bien ete transmise.",
    text:
      "Le flux de paiement a ete complete. La confirmation finale depend encore du traitement du paiement, et l'equipe organisatrice peut revenir vers vous si besoin.",
    buttonLabel: "Retour a l'accueil",
  },
  cancel: {
    title: "Le paiement n'a pas ete finalise.",
    text:
      "L'inscription n'est donc pas confirmee pour l'instant. Vous pouvez revenir a la page booking et relancer le paiement quand vous le souhaitez.",
    buttonLabel: 'Retour aux inscriptions',
  },
}
