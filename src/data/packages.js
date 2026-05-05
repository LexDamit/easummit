export const defaultPackages = [
  {
    id: 'standard',
    name: 'Pass Standard',
    price: 49,
    description:
      'Une formule simple pour un participant individuel avec acces au programme principal et aux informations pratiques.',
    includes: [
      'Acces au programme officiel',
      'Confirmation d inscription par email',
      'Informations participants et documents utiles',
    ],
  },
  {
    id: 'experience',
    name: 'Pass Experience',
    price: 89,
    description:
      'Une formule enrichie pour les participants qui souhaitent davantage de confort et une experience plus complete.',
    includes: [
      'Tout le contenu du Pass Standard',
      'Accueil prioritaire',
      'Option ideale pour futurs extras configurables',
    ],
  },
  {
    id: 'delegation',
    name: 'Pass Delegation',
    price: 149,
    description:
      'Une formule orientee organisation, delegation ou institution avec un niveau de service plus encadre.',
    includes: [
      'Tout le contenu du Pass Experience',
      'Traitement dedie pour groupes et delegations',
      'Base compatible avec modules ou options admin',
    ],
  },
]

export const packageMap = Object.fromEntries(
  defaultPackages.map((item) => [item.id, item]),
)
