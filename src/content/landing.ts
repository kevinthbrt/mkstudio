/**
 * Tous les textes de la landing page sont regroupés ici.
 * Un seul endroit à modifier pour ajuster la communication publique.
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
  eyebrow: "Le Vigan-en-Quercy",
  title: "S'entraîner encadré, récupérer sur place.",
  subtitle:
    "MK Studio, c'est du coaching avec un programme construit pour vous, seul ou à deux ou trois, et des cours collectifs à neuf personnes maximum. Sur place, également : ostéopathie, massages et drainage lymphatique.",
  primaryCta: "Créer mon compte",
  secondaryCta: "Voir les prestations",
  points: [
    "Coach présent à chaque séance",
    "9 personnes maximum en collectif",
    "Réservation en ligne",
  ],
};

export const highlights = [
  {
    value: "9",
    label: "personnes maximum",
    detail: "En cours collectif",
  },
  {
    value: "1 à 3",
    label: "en coaching individualisé",
    detail: "Programme propre à chacun",
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
    description:
      "Le programme est construit pour vous : votre niveau, vos objectifs, vos contraintes. Deux façons de le suivre.",
    options: [
      {
        name: "Solo",
        description:
          "Vous êtes seul dans la salle avec le coach. Son attention est entièrement sur vous, du début à la fin de la séance.",
      },
      {
        name: "À deux ou trois",
        description:
          "Chacun suit son propre programme, mais vous partagez la salle. Le suivi reste individualisé, le coût par personne baisse.",
      },
    ],
  },
  collectif: {
    name: "Cours collectifs",
    description:
      "Un programme commun, neuf personnes maximum, et un coach qui circule pour corriger les postures. À ce nombre-là, personne ne passe inaperçu et l'ambiance reste familiale.",
    bullets: [
      "9 personnes maximum par cours",
      "Le coach corrige pendant la séance",
      "Planning fixe, réservation en ligne",
    ],
  },
};

export const osteopathie = {
  eyebrow: "Ostéopathie",
  title: "Un cabinet d'ostéopathie dans la salle",
  paragraphs: [
    "L'ostéopathie à MK Studio, c'est Kevin Thubert. Le cabinet est dans les mêmes murs que la salle, sur rendez-vous.",
    "La consultation s'adresse à tout le monde, pas seulement aux sportifs. Elle porte principalement sur les troubles musculo-squelettiques — douleurs aiguës comme chroniques — et sur les troubles d'ordre viscéral.",
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
  practitioner: {
    name: "Kevin Thubert",
    role: "Ostéopathe D.O.",
    bio: "À compléter",
  },
};

export const massages = {
  eyebrow: "Massages & drainage",
  title: "Récupération et bien-être",
  intro:
    "Les séances durent une heure ou une heure et demie et se réservent en ligne, comme les cours. Les adhérents avec des séances en cours bénéficient de 15 % de réduction.",
  durations: "1 h ou 1 h 30",
  prestations: [
    {
      name: "Massage sportif",
      price: "—",
      description:
        "Travail en profondeur sur les zones sollicitées à l'entraînement. Pour dénouer, relancer la circulation et récupérer plus vite.",
    },
    {
      name: "Massage détente",
      price: "—",
      description:
        "Pression modérée sur l'ensemble du corps. Pour relâcher les tensions accumulées et faire retomber la pression.",
    },
    {
      name: "Drainage lymphatique",
      price: "—",
      description:
        "Manœuvres lentes et légères qui suivent le trajet de la lymphe. Utilisé pour les jambes lourdes, les sensations de gonflement et la rétention d'eau.",
    },
  ],
  note: "Réduction adhérent de 15 % appliquée automatiquement à la réservation.",
};

export const tarifs = {
  eyebrow: "Tarifs",
  title: "Des séances, pas d'abonnement contraignant",
  intro:
    "Vous achetez des séances, vous les utilisez quand vous voulez. Le solde reste visible à tout moment dans votre espace.",
  lignes: [
    { name: "Cours collectif", detail: "9 personnes maximum", price: "—" },
    { name: "Coaching individualisé — solo", detail: "Seul avec le coach", price: "—" },
    { name: "Coaching individualisé — à deux ou trois", detail: "Par personne", price: "—" },
    { name: "Massage", detail: "1 h ou 1 h 30", price: "—" },
    { name: "Consultation d'ostéopathie", detail: "Sur rendez-vous", price: "—" },
  ],
  footnote: "Des cartes de séances sont disponibles. Détail et moyens de paiement à l'accueil.",
};

export const equipe = {
  eyebrow: "L'équipe",
  title: "Vous ne croiserez que deux personnes",
  intro:
    "MK Studio, c'est une équipe de deux. Vous savez toujours qui vous allez avoir en face de vous.",
  membres: [
    {
      name: "Manon Delmas",
      role: "Coach sportive & masseuse",
      bio: "À compléter",
    },
    {
      name: "Kevin Thubert",
      role: "Ostéopathe D.O.",
      bio: "À compléter",
    },
  ],
};

export const avis = {
  eyebrow: "Avis",
  title: "Ce qu'en disent les adhérents",
  /** En attente des avis Google réels — section masquée tant que le tableau est vide. */
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
      q: "Quelle différence entre le coaching à deux ou trois et le cours collectif ?",
      a: "En coaching à deux ou trois, chacun suit son propre programme : le suivi reste individualisé, vous partagez seulement la salle, ce qui réduit le coût. En cours collectif, le programme est commun au groupe, jusqu'à neuf personnes.",
    },
    {
      q: "Comment je réserve ?",
      a: "Depuis votre espace adhérent, en ligne. Vous voyez le planning, les places restantes et votre solde de séances.",
    },
    {
      q: "Et si j'ai un empêchement ?",
      a: "L'annulation se fait depuis votre espace, au minimum 24 h avant pour les séances individualisées. Passé ce délai, la séance est décomptée.",
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
  address: ["102 route de Gourdon", "46300 Le Vigan-en-Quercy"],
  rendezVous: {
    title: "Sur rendez-vous",
    text: "Coaching individualisé, ostéopathie et massages se réservent au créneau : il n'y a pas d'horaires d'ouverture au sens classique.",
  },
  planning: {
    title: "Cours collectifs",
    text: "Le planning est fixe d'une semaine à l'autre.",
    /** En attente du planning réel — le bloc est masqué tant que le tableau est vide. */
    creneaux: [] as { day: string; slots: string }[],
  },
  phone: "—",
  email: "—",
  parking: "À compléter",
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
