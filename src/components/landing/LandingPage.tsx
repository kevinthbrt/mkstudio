import Link from "next/link";
import {
  Users,
  Dumbbell,
  HeartHandshake,
  Sparkles,
  CalendarCheck,
  Trophy,
  Smartphone,
  MapPin,
  Clock,
  Mail,
  ArrowRight,
  Star,
  Check,
} from "lucide-react";

const seances = [
  {
    icon: Users,
    title: "Cours collectifs",
    description:
      "Des séances en petit groupe (8 personnes max) pour se dépasser ensemble dans une ambiance conviviale. Renfo, cardio, mobilité : il y en a pour tous les niveaux.",
  },
  {
    icon: Dumbbell,
    title: "Coaching individuel",
    description:
      "Un programme 100 % sur mesure, adapté à vos objectifs et votre rythme. Votre coach vous suit séance après séance pour des résultats durables.",
  },
  {
    icon: HeartHandshake,
    title: "Séances duo",
    description:
      "Entraînez-vous à deux — en couple, entre amis ou collègues. La motivation du binôme, l'attention d'un coaching personnalisé, le prix en plus doux.",
  },
  {
    icon: Sparkles,
    title: "Massages",
    description:
      "Récupération, détente ou préparation : des massages pour prendre soin de votre corps et compléter votre entraînement.",
  },
];

const atouts = [
  {
    icon: Users,
    title: "Un studio à taille humaine",
    description:
      "Pas de salle bondée ni d'anonymat : ici, votre coach connaît votre prénom, vos objectifs et vos progrès.",
  },
  {
    icon: Smartphone,
    title: "Réservation en ligne",
    description:
      "Consultez le planning, réservez ou annulez vos séances en quelques secondes depuis votre espace membre.",
  },
  {
    icon: Trophy,
    title: "Suivi de progression",
    description:
      "Badges, niveaux et historique de séances : suivez votre régularité et restez motivé sur la durée.",
  },
  {
    icon: CalendarCheck,
    title: "Des packs sans engagement",
    description:
      "Achetez un pack de séances et utilisez-le à votre rythme. Pas d'abonnement forcé, pas de mauvaise surprise.",
  },
];

const etapes = [
  {
    numero: "1",
    title: "Créez votre compte",
    description:
      "Inscrivez-vous en ligne en deux minutes et accédez à votre espace membre.",
  },
  {
    numero: "2",
    title: "Choisissez votre pack",
    description:
      "Séances collectives, coaching individuel ou duo : sélectionnez la formule qui vous ressemble.",
  },
  {
    numero: "3",
    title: "Réservez vos séances",
    description:
      "Le planning est en ligne : réservez votre place et venez transpirer, on s'occupe du reste.",
  },
];

const tarifs = [
  {
    title: "Cours collectifs",
    prix: "15 €",
    unite: "la séance",
    description: "En pack de 10 séances",
    points: ["Petits groupes de 8 max", "Tous niveaux", "Planning en ligne", "Validité 6 mois"],
    populaire: false,
  },
  {
    title: "Coaching individuel",
    prix: "55 €",
    unite: "la séance",
    description: "Dégressif en pack",
    points: [
      "Programme 100 % sur mesure",
      "Bilan personnalisé offert",
      "Suivi entre les séances",
      "Horaires flexibles",
    ],
    populaire: true,
  },
  {
    title: "Séances duo",
    prix: "35 €",
    unite: "par personne",
    description: "En pack de 10 séances",
    points: ["À deux, c'est plus motivant", "Coaching personnalisé", "Créneaux dédiés", "Validité 6 mois"],
    populaire: false,
  },
];

const temoignages = [
  {
    nom: "Sophie L.",
    texte:
      "J'ai retrouvé le plaisir de m'entraîner. Les cours en petit groupe changent tout : on est corrigé, encouragé, et on progresse vraiment.",
  },
  {
    nom: "Julien M.",
    texte:
      "Le coaching individuel m'a permis de reprendre le sport après une blessure, en toute confiance. Le suivi est sérieux et l'ambiance top.",
  },
  {
    nom: "Camille & Thomas",
    texte:
      "On a commencé les séances duo il y a six mois. C'est devenu notre rendez-vous de la semaine — et les résultats sont là !",
  },
];

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-2xl";
  const text = size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-3">
      <div className={`${box} bg-gradient-to-br from-[#E8C84A] via-[#D4AF37] to-[#B8941E] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.35)]`}>
        <span className={`text-black font-black ${text} tracking-tight`}>MK</span>
      </div>
      <span className="text-white font-black text-lg tracking-tight">MK Studio</span>
    </div>
  );
}

export function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.14) 0%, transparent 60%), linear-gradient(180deg, #0b0a12 0%, #0e0d14 100%)",
      }}
    >
      {/* ===== Navigation ===== */}
      <header className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: "rgba(11,10,18,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="MK Studio — Accueil">
            <Logo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#seances" className="hover:text-[#D4AF37] transition-colors">Nos séances</a>
            <a href="#studio" className="hover:text-[#D4AF37] transition-colors">Le studio</a>
            <a href="#tarifs" className="hover:text-[#D4AF37] transition-colors">Tarifs</a>
            <a href="#contact" className="hover:text-[#D4AF37] transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-300 rounded-xl border border-[#2d2b40] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-[#0a0a0a] rounded-xl bg-[linear-gradient(to_right,#C9A227,#E8C84A,#C9A227)] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] transition-all"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F5E06B] text-xs font-semibold mb-6">
            <Sparkles size={13} />
            Studio de coaching à taille humaine
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Votre corps mérite
            <br />
            <span className="text-gold-gradient">mieux qu&apos;une salle de sport</span>
          </h1>
          <p className="max-w-2xl mx-auto mt-6 text-gray-400 text-base sm:text-lg leading-relaxed">
            Cours collectifs en petit groupe, coaching individuel, séances duo et massages :
            chez MK Studio, chaque séance est encadrée, personnalisée et pensée pour vous faire progresser.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-[#0a0a0a] rounded-xl bg-[linear-gradient(to_right,#C9A227,#E8C84A,#C9A227)] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 transition-all"
            >
              Réserver une séance d&apos;essai
              <ArrowRight size={16} />
            </Link>
            <a
              href="#seances"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-gray-300 rounded-xl border border-[#2d2b40] hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all"
            >
              Découvrir le studio
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16">
            {[
              { valeur: "8 max", label: "par cours collectif" },
              { valeur: "100 %", label: "des séances encadrées" },
              { valeur: "6j/7", label: "de créneaux ouverts" },
            ].map((stat) => (
              <div key={stat.label} className="card-glass rounded-2xl px-3 py-4">
                <p className="text-xl sm:text-2xl font-black text-gold-gradient">{stat.valeur}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Nos séances ===== */}
      <section id="seances" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Nos séances</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Quatre façons de bouger, un seul objectif : que vous vous sentiez mieux dans votre corps.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {seances.map((s) => (
            <div key={s.title} className="card-glass rounded-3xl p-7 hover:border-[#D4AF37]/30 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5 group-hover:bg-[#D4AF37]/20 transition-colors">
                <s.icon size={22} className="text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-white">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mt-2">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Pourquoi MK Studio ===== */}
      <section id="studio" className="border-y border-white/5 scroll-mt-20"
        style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.03) 0%, transparent 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pourquoi <span className="text-gold-gradient">MK Studio</span> ?
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Parce que s&apos;entraîner régulièrement, c&apos;est plus facile quand on est bien accompagné.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {atouts.map((a) => (
              <div key={a.title} className="text-center px-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-4">
                  <a.icon size={22} className="text-[#D4AF37]" />
                </div>
                <h3 className="font-bold text-white text-sm">{a.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Comment ça marche ?</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {etapes.map((e) => (
            <div key={e.numero} className="card-glass rounded-3xl p-7 relative">
              <span className="absolute -top-4 left-7 w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8C84A] via-[#D4AF37] to-[#B8941E] flex items-center justify-center text-black font-black text-sm shadow-[0_4px_16px_rgba(212,175,55,0.4)]">
                {e.numero}
              </span>
              <h3 className="font-bold text-white mt-3">{e.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mt-2">{e.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Tarifs ===== */}
      <section id="tarifs" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Nos formules</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Des packs de séances sans engagement, à utiliser à votre rythme. Première séance d&apos;essai offerte.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 items-stretch">
          {tarifs.map((t) => (
            <div
              key={t.title}
              className={`rounded-3xl p-7 flex flex-col card-glass ${
                t.populaire ? "border !border-[#D4AF37]/40 glow-gold relative" : ""
              }`}
            >
              {t.populaire && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#C9A227] via-[#E8C84A] to-[#C9A227] text-black text-[11px] font-bold">
                  Le plus demandé
                </span>
              )}
              <h3 className="font-bold text-white">{t.title}</h3>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-gold-gradient">{t.prix}</span>
                <span className="text-sm text-gray-500">{t.unite}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t.description}</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {t.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <Check size={15} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-7 inline-flex items-center justify-center px-5 py-2.5 text-sm rounded-xl transition-all ${
                  t.populaire
                    ? "font-bold text-[#0a0a0a] bg-[linear-gradient(to_right,#C9A227,#E8C84A,#C9A227)] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)]"
                    : "font-semibold text-gray-300 border border-[#2d2b40] hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                }`}
              >
                Commencer
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">
          Massages et packs sur mesure : renseignez-vous directement au studio.
        </p>
      </section>

      {/* ===== Témoignages ===== */}
      <section className="border-y border-white/5"
        style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.03) 0%, transparent 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Ils s&apos;entraînent chez nous</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {temoignages.map((t) => (
              <div key={t.nom} className="card-glass rounded-3xl p-7">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">« {t.texte} »</p>
                <p className="text-xs font-semibold text-[#D4AF37] mt-4">{t.nom}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact / CTA final ===== */}
      <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <div className="card-glass rounded-3xl p-8 sm:p-12 glow-gold text-center relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)" }}
          />
          <h2 className="relative text-3xl sm:text-4xl font-black text-white tracking-tight">
            Prêt à vous <span className="text-gold-gradient">lancer</span> ?
          </h2>
          <p className="relative text-gray-400 mt-4 max-w-lg mx-auto">
            Venez essayer : la première séance est offerte, sans engagement.
            Créez votre compte et réservez votre créneau dès maintenant.
          </p>
          <div className="relative mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-[#0a0a0a] rounded-xl bg-[linear-gradient(to_right,#C9A227,#E8C84A,#C9A227)] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 transition-all"
            >
              Réserver ma séance d&apos;essai
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10 mt-10 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <MapPin size={15} className="text-[#D4AF37]" /> MK Studio — votre studio de proximité
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={15} className="text-[#D4AF37]" /> Lun–Sam · 7h00–20h30
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail size={15} className="text-[#D4AF37]" /> contact@mkstudio.fr
            </span>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <nav className="flex items-center gap-6 text-xs text-gray-500">
            <a href="#seances" className="hover:text-[#D4AF37] transition-colors">Nos séances</a>
            <a href="#tarifs" className="hover:text-[#D4AF37] transition-colors">Tarifs</a>
            <Link href="/login" className="hover:text-[#D4AF37] transition-colors">Espace membre</Link>
            <Link href="/register" className="hover:text-[#D4AF37] transition-colors">Inscription</Link>
          </nav>
          <p className="text-xs text-gray-600">MK Studio © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
