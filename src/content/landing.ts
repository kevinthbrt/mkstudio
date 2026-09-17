/**
 * Tous les textes de la landing page sont regroupés ici.
 * Un seul endroit à modifier pour ajuster la communication publique.
 *
 * Règle de rédaction : pas de tiret cadratin sur cette page.
 */

export const landingNav = {
  links: [
    { label: "Coaching", href: "#coaching" },
    { label: "Ostéopathie", href: "#osteopathie" },
    { label: "Massages", href: "#massages" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "Accès", href: "#acces" },
  ],
  login: "Mon espace",
  cta: "Créer mon compte",
};

export const hero = {
  eyebrow: "Le Vigan en Quercy",
  title: "S'entraîner encadré, récupérer sur place.",
  subtitle:
    "MK Studio, c'est du coaching avec un programme construit pour vous, seul ou en duo, et des cours collectifs à huit personnes maximum. Sur place également : ostéopathie, massages et drainage lymphatique.",
  primaryCta: "Créer mon compte",
  secondaryCta: "Voir les prestations",
  points: [
    "Coach présent à chaque séance",
    "8 personnes maximum en collectif",
    "Réservation en ligne",
  ],
};

export const highlights = [
  {
    value: "8",
    label: "personnes maximum",
    detail: "En cours collectif",
  },
  {
    value: "12 €",
    label: "le cours collectif",
    detail: "100 € le carnet de 10 séances",
  },
  {
    value: "-15 %",
    label: "sur les massages",
    detail: "Pour les adhérents avec séances en cours",
  },
];

export const coaching = {
  eyebrow: "Coaching",
  title: "Deux façons de s'entraîner",
  intro:
    "Dans les deux cas, le coach est dans la salle. L'accès aux machines se fait en sa présence, jamais seul.",
  individualise: {
    name: "Coaching individualisé",
    tag: "Seul ou en duo",
    description:
      "Le programme est construit pour vous : votre niveau, vos objectifs, vos contraintes. Deux façons de le suivre.",
    options: [
      {
        name: "Individuel",
        description:
          "Vous êtes seul dans la salle avec le coach. Son attention est entièrement sur vous, du début à la fin de la séance.",
      },
      {
        name: "En duo",
        description:
          "Chacun suit son propre programme, mais vous partagez la salle. Le suivi reste individualisé et le coût par personne baisse.",
      },
    ],
  },
  collectif: {
    name: "Cours collectifs",
    tag: "8 personnes maximum",
    description:
      "Un programme commun, huit personnes maximum, et un coach qui circule pour corriger les postures. À ce nombre-là, personne ne passe inaperçu et l'ambiance reste familiale.",
    bullets: [
      "8 personnes maximum par cours",
      "Le coach corrige pendant la séance",
      "Cours adaptés à tous les niveaux",
      "Réservation simple, en ligne",
    ],
  },
  planning: {
    title: "Le planning des cours collectifs",
    intro: "Il est fixe d'une semaine à l'autre. La réservation est nécessaire pour participer.",
    jours: [
      {
        day: "Lundi",
        cours: [
          { time: "18h30", name: "Cross training" },
          { time: "19h30", name: "Renfo / abdos" },
        ],
      },
      {
        day: "Mardi",
        cours: [
          { time: "17h40", name: "Pilates" },
          { time: "18h40", name: "Pilates" },
        ],
      },
      {
        day: "Mercredi",
        cours: [
          { time: "10h30", name: "Pilates" },
          { time: "19h00", name: "Cross training" },
        ],
      },
      {
        day: "Jeudi",
        cours: [
          { time: "09h45", name: "Seniors", detail: "Équilibre, mobilité et souplesse" },
          { time: "17h30", name: "Fessiers / abdos", detail: "45 min" },
        ],
      },
      {
        day: "Vendredi",
        cours: [{ time: "12h15", name: "Cross training", detail: "45 min" }],
      },
      {
        day: "Samedi",
        cours: [{ time: "10h30", name: "Renfo / abdos / stretching" }],
      },
    ],
  },
};

export const osteopathie = {
  eyebrow: "Ostéopathie",
  title: "Un cabinet d'ostéopathie dans la salle",
  paragraphs: [
    "L'ostéopathie à MK Studio, c'est Kevin Thubert. Le cabinet est dans les mêmes murs que la salle, sur rendez-vous.",
    "La consultation s'adresse à tout le monde, pas seulement aux sportifs. Elle porte principalement sur les troubles musculo-squelettiques, douleurs aiguës comme chroniques, et sur les troubles d'ordre viscéral.",
  ],
  pourQui: {
    title: "Pour qui",
    items: ["Sportifs", "Femmes enceintes", "Personnes âgées", "Nourrissons"],
  },
  pourQuoi: {
    title: "Pour quoi",
    items: [
      "Douleurs aiguës ou chroniques",
      "Troubles musculo-squelettiques",
      "Troubles viscéraux",
      "Suivi de reprise après blessure",
    ],
  },
  cta: "Prendre rendez-vous",
  ctaHref: "https://www.doctolib.fr/osteopathe/le-vigan/kevin-thubert",
  ctaNote: "Prise de rendez-vous sur Doctolib, ou par téléphone au 06 75 25 99 93.",
  practitioner: {
    name: "Kevin Thubert",
    role: "Ostéopathe D.O.",
  },
};

export const massages = {
  eyebrow: "Massages & drainage",
  title: "Récupération et bien-être",
  intro:
    "Les massages sont assurés par Manon Delmas, dans la salle. Les adhérents avec des séances en cours bénéficient de 15 % de réduction.",
  prestations: [
    {
      name: "Massage californien",
      photo: "massage-californien",
      duration: "30 min, 1 h ou 1 h 30",
      price: "à partir de 40 €",
      description:
        "Des mouvements longs et enveloppants sur l'ensemble du corps. C'est le massage à choisir pour relâcher les tensions et se poser, sans travail en profondeur.",
    },
    {
      name: "Massage ayurvédique",
      photo: "massage-ayurvedique",
      duration: "30 min, 1 h ou 1 h 30",
      price: "à partir de 40 €",
      description:
        "Un massage à l'huile chaude, issu de la tradition indienne. Le rythme est plus soutenu et le travail plus appuyé sur les points de tension.",
    },
    {
      name: "Drainage lymphatique",
      photo: "drainage-lymphatique",
      duration: "Séance ou pack de 6",
      price: "75 €",
      description:
        "Des manœuvres lentes et légères qui suivent le trajet de la lymphe. Utilisé pour les jambes lourdes, les sensations de gonflement et la rétention d'eau.",
    },
  ],
  note: "Réduction adhérent de 15 % appliquée automatiquement à la réservation.",
};

export const tarifs = {
  eyebrow: "Tarifs",
  title: "Des séances, pas d'abonnement contraignant",
  intro:
    "Vous achetez des séances, vous les utilisez quand vous voulez. Le solde reste visible à tout moment dans votre espace.",
  groupes: [
    {
      title: "Cours collectifs",
      lignes: [
        { name: "À la séance", price: "12 €" },
        { name: "Carnet de 10 séances", price: "100 €" },
        { name: "Carnet de 20 séances", price: "185 €" },
      ],
    },
    {
      title: "Coaching individualisé",
      lignes: [
        { name: "Individuel, à l'unité", price: "32 €" },
        { name: "Individuel, pack de 10", price: "260 €" },
        { name: "En duo, à l'unité", price: "25 €" },
        { name: "En duo, pack de 10", price: "220 €" },
      ],
      note: "Réduction famille : 15 % sur le 2e membre.",
    },
    {
      title: "Massages",
      lignes: [
        { name: "Californien ou ayurvédique, 30 min", price: "40 €" },
        { name: "Californien ou ayurvédique, 1 h", price: "60 €" },
        { name: "Californien ou ayurvédique, 1 h 30", price: "80 €" },
        { name: "Drainage lymphatique, la séance", price: "75 €" },
        { name: "Drainage lymphatique, pack de 6", price: "420 €" },
      ],
      note: "15 % de réduction pour les adhérents ayant des séances en cours.",
    },
    {
      title: "Ostéopathie",
      lignes: [
        { name: "Adulte", price: "60 €" },
        { name: "Enfant de moins de 10 ans", price: "55 €" },
      ],
    },
  ],
};

export const equipe = {
  eyebrow: "L'équipe",
  title: "Vous ne croiserez que deux personnes",
  intro:
    "MK Studio, c'est une équipe de deux. Vous savez toujours qui vous allez avoir en face de vous.",
  membres: [
    {
      name: "Manon Delmas",
      photo: "portrait-manon",
      role: "Coach sportive & masseuse",
    },
    {
      name: "Kevin Thubert",
      photo: "portrait-kevin",
      role: "Ostéopathe D.O.",
    },
  ],
};

export const avis = {
  eyebrow: "Avis",
  title: "Ce qu'en disent les adhérents",
  /** En attente des avis Google réels : la section reste masquée tant que le tableau est vide. */
  items: [] as { quote: string; author: string; context: string }[],
};

export const faq = {
  eyebrow: "Questions fréquentes",
  title: "Ce qu'on nous demande le plus souvent",
  items: [
    {
      q: "Faut-il un niveau particulier pour commencer ?",
      a: "Non. En coaching individualisé, le programme part de votre niveau. En cours collectif, le coach adapte les exercices pendant la séance.",
    },
    {
      q: "Quelle différence entre le duo et le cours collectif ?",
      a: "En duo, chacun suit son propre programme : le suivi reste individualisé, vous partagez seulement la salle, ce qui réduit le coût par personne. En cours collectif, le programme est commun au groupe, jusqu'à huit personnes.",
    },
    {
      q: "Comment je réserve ?",
      a: "Depuis votre espace adhérent, en ligne. Vous voyez le planning, les places restantes et votre solde de séances.",
    },
    {
      q: "Et si j'ai un empêchement ?",
      a: "L'annulation se fait depuis votre espace, au minimum 24 h avant pour les séances individuelles et en duo. Passé ce délai, la séance est décomptée.",
    },
    {
      q: "Que faut-il apporter ?",
      a: "Une tenue de sport, une paire de chaussures propres réservées à l'intérieur et une serviette. La serviette est obligatoire sur les machines et les tapis.",
    },
    {
      q: "Peut-on venir uniquement pour un massage ou l'ostéopathie ?",
      a: "Oui, ces prestations sont ouvertes à tout le monde, adhérent ou non. La réduction de 15 % sur les massages est réservée aux adhérents.",
    },
  ],
};

export const acces = {
  eyebrow: "Accès",
  title: "Venir à MK Studio",
  address: ["102 route de Gourdon", "46300 Le Vigan en Quercy"],
  rendezVous: {
    title: "Sur rendez-vous",
    text: "Coaching individualisé, ostéopathie et massages se réservent au créneau : il n'y a pas d'horaires d'ouverture au sens classique. Les cours collectifs suivent un planning fixe.",
  },
  contacts: [
    { label: "Coaching et massages", value: "07 87 02 05 65", href: "tel:0787020565" },
    { label: "Ostéopathie", value: "06 75 25 99 93", href: "tel:0675259993" },
  ],
  /** Laisser vide masque la ligne sur la page. */
  parking: "Parking devant la salle.",
};

export const finalCta = {
  title: "On commence quand vous voulez.",
  subtitle:
    "Créez votre compte, choisissez un créneau, venez. Le reste, on s'en occupe sur place.",
  primary: "Créer mon compte",
  secondary: "Nous contacter",
};

export const footer = {
  tagline: "Coaching encadré, ostéopathie et massages.",
  legal: "Tous droits réservés.",
};
