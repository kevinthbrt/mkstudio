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
  eyebrow: "Salle de sport à taille humaine",
  title: "S'entraîner encadré, récupérer sur place.",
  subtitle:
    "MK Studio, c'est du coaching en petit groupe, en duo ou en solo, toujours avec un coach dans la salle. Et quand le corps a besoin d'autre chose : ostéopathie, massages et drainage lymphatique, au même endroit.",
  primaryCta: "Créer mon compte",
  secondaryCta: "Voir les prestations",
  points: [
    "Coach présent à chaque séance",
    "Groupes limités",
    "Réservation en ligne",
  ],
};

export const highlights = [
  {
    value: "3",
    label: "formats de cours",
    detail: "Collectif, duo, solo",
  },
  {
    value: "—",
    label: "personnes max par cours",
    detail: "À compléter",
  },
  {
    value: "-15 %",
    label: "sur les massages",
    detail: "Pour les adhérents avec séances en cours",
  },
];

export const coaching = {
  eyebrow: "Coaching",
  title: "Trois façons de s'entraîner",
  intro:
    "Tous les cours sont encadrés. L'accès aux machines se fait en présence du coach, jamais seul.",
  formats: [
    {
      name: "Cours collectif",
      duration: "—",
      description:
        "En petit groupe, avec un coach qui corrige et adapte les exercices. Le nombre de places est limité pour que chacun soit suivi.",
      bullets: ["Places limitées", "Liste d'attente automatique", "Réservation depuis votre espace"],
    },
    {
      name: "Duo",
      duration: "—",
      description:
        "À deux, avec un coach rien que pour vous. Le bon compromis entre l'émulation du collectif et l'attention du suivi individuel.",
      bullets: ["Deux participants", "Programme adapté au binôme", "Annulation jusqu'à 24 h avant"],
    },
    {
      name: "Individuel",
      duration: "—",
      description:
        "Un coach, une personne. Le contenu de la séance est construit sur vos objectifs, votre niveau et vos contraintes.",
      bullets: ["Suivi personnalisé", "Rythme libre", "Annulation jusqu'à 24 h avant"],
    },
  ],
};

export const osteopathie = {
  eyebrow: "Ostéopathie",
  title: "Un ostéopathe dans la salle",
  paragraphs: [
    "Un ostéopathe consulte directement à MK Studio. Pas besoin d'aller ailleurs : la séance se fait dans le même lieu que vos entraînements.",
    "Douleurs de dos, épaule bloquée, tensions liées au travail ou à la reprise du sport : la consultation part de ce que vous ressentez et de ce que vous faites en salle.",
  ],
  motifs: [
    "Douleurs lombaires et cervicales",
    "Tensions musculaires et raideurs",
    "Suivi de reprise après blessure",
    "Gêne articulaire à l'entraînement",
  ],
  cta: "Prendre rendez-vous",
  practitioner: {
    name: "—",
    role: "Ostéopathe D.O.",
    bio: "À compléter",
  },
};

export const massages = {
  eyebrow: "Massages & drainage",
  title: "Récupération et bien-être",
  intro:
    "Les séances se réservent en ligne, comme les cours. Les adhérents avec des séances en cours bénéficient de 15 % de réduction.",
  prestations: [
    {
      name: "Massage sportif",
      duration: "—",
      price: "—",
      description:
        "Travail en profondeur sur les zones sollicitées à l'entraînement. Pour dénouer, relancer la circulation et récupérer plus vite.",
    },
    {
      name: "Massage détente",
      duration: "—",
      price: "—",
      description:
        "Pression modérée sur l'ensemble du corps. Pour relâcher les tensions accumulées et faire retomber la pression.",
    },
    {
      name: "Drainage lymphatique",
      duration: "—",
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
    "Vous achetez des séances, vous les utilisez quand vous voulez. Le solde est visible à tout moment dans votre espace.",
  plans: [
    { name: "Séance à l'unité", price: "—", detail: "À compléter", featured: false },
    { name: "Carte 10 séances", price: "—", detail: "À compléter", featured: true },
    { name: "Séance d'essai", price: "—", detail: "À compléter", featured: false },
  ],
  footnote: "Tarifs détaillés et moyens de paiement disponibles à l'accueil.",
};

export const equipe = {
  eyebrow: "L'équipe",
  title: "Les personnes que vous allez croiser",
  intro: "À compléter",
  membres: [
    { name: "—", role: "Coach", bio: "À compléter" },
    { name: "—", role: "Ostéopathe D.O.", bio: "À compléter" },
    { name: "—", role: "Praticien massage", bio: "À compléter" },
  ],
};

export const avis = {
  eyebrow: "Avis",
  title: "Ce qu'en disent les adhérents",
  items: [
    { quote: "À compléter", author: "—", context: "—" },
    { quote: "À compléter", author: "—", context: "—" },
    { quote: "À compléter", author: "—", context: "—" },
  ],
};

export const faq = {
  eyebrow: "Questions fréquentes",
  title: "Ce qu'on nous demande le plus souvent",
  items: [
    {
      q: "Faut-il un niveau particulier pour commencer ?",
      a: "Non. Les exercices sont adaptés à chacun pendant la séance, y compris en cours collectif.",
    },
    {
      q: "Comment je réserve un cours ?",
      a: "Depuis votre espace adhérent, en ligne. Vous voyez le planning, les places restantes et votre solde de séances.",
    },
    {
      q: "Et si j'ai un empêchement ?",
      a: "L'annulation se fait depuis votre espace, au minimum 24 h avant pour les cours solo et duo. Passé ce délai, la séance est décomptée.",
    },
    {
      q: "Que faut-il apporter ?",
      a: "Une tenue de sport, une paire de chaussures propres réservées à l'intérieur et une serviette. La serviette est obligatoire sur les machines et les tapis.",
    },
    {
      q: "Peut-on venir uniquement pour un massage ou l'ostéopathie ?",
      a: "Oui. Ces prestations sont ouvertes aux personnes non adhérentes. La réduction de 15 % sur les massages est réservée aux adhérents.",
    },
  ],
};

export const acces = {
  eyebrow: "Accès",
  title: "Venir à MK Studio",
  address: ["—", "—"],
  hours: [
    { day: "Lundi – Vendredi", value: "—" },
    { day: "Samedi", value: "—" },
    { day: "Dimanche", value: "—" },
  ],
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
