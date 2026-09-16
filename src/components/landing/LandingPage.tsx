import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  MapPin,
  Phone,
  Quote,
  Sparkles,
  Users,
} from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { Placeholder } from "@/components/landing/Placeholder";
import {
  acces,
  avis,
  coaching,
  equipe,
  faq,
  finalCta,
  footer,
  hero,
  highlights,
  massages,
  osteopathie,
  tarifs,
} from "@/content/landing";

function SectionHeader({
  eyebrow,
  title,
  intro,
  center,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A227]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#14131A] sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-[#55524A]">{intro}</p>}
    </div>
  );
}

export function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="landing-light min-h-screen bg-white text-[#14131A]">
      <LandingNav />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-[#ECEAE3] bg-[#FBFAF7]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E7E1CE] bg-white px-3 py-1.5 text-xs font-semibold text-[#8A7A34]">
              <Sparkles size={13} />
              {hero.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-[#14131A] sm:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#55524A]">{hero.subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#14131A] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A2823]"
              >
                {hero.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#coaching"
                className="inline-flex items-center gap-2 rounded-xl border border-[#DCD8CC] bg-white px-6 py-3.5 text-sm font-semibold text-[#14131A] transition-colors hover:border-[#C9A227] hover:text-[#8A7A34]"
              >
                {hero.secondaryCta}
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {hero.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-[#55524A]">
                  <Check size={15} className="text-[#C9A227]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            <Placeholder
              ratio="4/3"
              label="Photo principale : vue d'ensemble de la salle, lumière naturelle"
            />
            <div className="grid grid-cols-2 gap-4">
              <Placeholder ratio="1/1" compact label="Coach pendant un cours collectif" />
              <Placeholder ratio="1/1" compact label="Espace massage / table de soin" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Chiffres */}
      <section className="border-b border-[#ECEAE3] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight text-[#14131A]">{item.value}</span>
              <span className="mt-1 text-sm font-semibold text-[#14131A]">{item.label}</span>
              <span className="mt-0.5 text-sm text-[#8A8470]">{item.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Coaching */}
      <section id="coaching" className="scroll-mt-20 border-b border-[#ECEAE3] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeader eyebrow={coaching.eyebrow} title={coaching.title} intro={coaching.intro} />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {coaching.formats.map((format) => (
              <article
                key={format.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#ECEAE3] bg-white transition-shadow hover:shadow-[0_12px_40px_rgba(20,19,26,0.07)]"
              >
                <Placeholder
                  ratio="16/10"
                  compact
                  className="rounded-none border-0 border-b border-dashed"
                  label={`Illustration — ${format.name}`}
                />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-bold text-[#14131A]">{format.name}</h3>
                    <span className="flex items-center gap-1 text-xs font-medium text-[#8A8470]">
                      <Clock size={12} />
                      {format.duration}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#55524A]">{format.description}</p>
                  <ul className="mt-5 space-y-2 border-t border-[#F3F1EB] pt-5">
                    {format.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-[#55524A]">
                        <Check size={15} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Ostéopathie */}
      <section id="osteopathie" className="scroll-mt-20 border-b border-[#ECEAE3] bg-[#FBFAF7]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <Placeholder ratio="4/3" label="Cabinet d'ostéopathie : table de consultation, ambiance calme" />
          <div>
            <SectionHeader eyebrow={osteopathie.eyebrow} title={osteopathie.title} />
            <div className="mt-5 space-y-4">
              {osteopathie.paragraphs.map((p) => (
                <p key={p} className="text-base leading-relaxed text-[#55524A]">
                  {p}
                </p>
              ))}
            </div>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {osteopathie.motifs.map((motif) => (
                <li key={motif} className="flex items-start gap-2 text-sm text-[#55524A]">
                  <Check size={15} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                  {motif}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[#ECEAE3] bg-white p-4">
              <Placeholder
                ratio="1/1"
                compact
                className="h-16 w-16 flex-shrink-0 rounded-full"
                label="Portrait"
              />
              <div>
                <p className="text-sm font-bold text-[#14131A]">{osteopathie.practitioner.name}</p>
                <p className="text-xs text-[#8A8470]">{osteopathie.practitioner.role}</p>
                <p className="mt-1 text-sm text-[#55524A]">{osteopathie.practitioner.bio}</p>
              </div>
            </div>

            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#14131A] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A2823]"
            >
              {osteopathie.cta}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Massages */}
      <section id="massages" className="scroll-mt-20 border-b border-[#ECEAE3] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeader
            eyebrow={massages.eyebrow}
            title={massages.title}
            intro={massages.intro}
            center
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {massages.prestations.map((p) => (
              <article
                key={p.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#ECEAE3] bg-white transition-shadow hover:shadow-[0_12px_40px_rgba(20,19,26,0.07)]"
              >
                <Placeholder
                  ratio="16/10"
                  compact
                  className="rounded-none border-0 border-b border-dashed"
                  label={`Illustration — ${p.name}`}
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-[#14131A]">{p.name}</h3>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-[#8A8470]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {p.duration}
                    </span>
                    <span className="font-semibold text-[#8A7A34]">{p.price}</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#55524A]">{p.description}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-[#8A8470]">
            <Sparkles size={14} className="text-[#C9A227]" />
            {massages.note}
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- Tarifs */}
      <section id="tarifs" className="scroll-mt-20 border-b border-[#ECEAE3] bg-[#FBFAF7]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeader eyebrow={tarifs.eyebrow} title={tarifs.title} intro={tarifs.intro} center />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {tarifs.plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.featured
                    ? "rounded-2xl border-2 border-[#C9A227] bg-white p-7 shadow-[0_12px_40px_rgba(201,162,39,0.14)]"
                    : "rounded-2xl border border-[#ECEAE3] bg-white p-7"
                }
              >
                {plan.featured && (
                  <span className="mb-3 inline-block rounded-full bg-[#FBF4DE] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8A7A34]">
                    Le plus choisi
                  </span>
                )}
                <h3 className="text-base font-bold text-[#14131A]">{plan.name}</h3>
                <p className="mt-3 text-3xl font-bold tracking-tight text-[#14131A]">{plan.price}</p>
                <p className="mt-2 text-sm text-[#55524A]">{plan.detail}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-[#8A8470]">{tarifs.footnote}</p>
        </div>
      </section>

      {/* -------------------------------------------------------------- Équipe */}
      <section id="equipe" className="scroll-mt-20 border-b border-[#ECEAE3] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeader eyebrow={equipe.eyebrow} title={equipe.title} intro={equipe.intro} />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipe.membres.map((m, i) => (
              <div key={`${m.role}-${i}`} className="rounded-2xl border border-[#ECEAE3] bg-white p-5">
                <Placeholder ratio="1/1" compact label="Portrait" className="mb-4" />
                <p className="text-base font-bold text-[#14131A]">{m.name}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-[#C9A227]">{m.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#55524A]">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Avis */}
      <section className="border-b border-[#ECEAE3] bg-[#FBFAF7]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeader eyebrow={avis.eyebrow} title={avis.title} center />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {avis.items.map((item, i) => (
              <figure key={i} className="rounded-2xl border border-[#ECEAE3] bg-white p-6">
                <Quote size={20} className="text-[#C9A227]" />
                <blockquote className="mt-4 text-sm leading-relaxed text-[#3A3830]">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-[#F3F1EB] pt-4">
                  <Placeholder ratio="1/1" compact className="h-10 w-10 rounded-full" label="" />
                  <div>
                    <p className="text-sm font-semibold text-[#14131A]">{item.author}</p>
                    <p className="text-xs text-[#8A8470]">{item.context}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-[#ECEAE3] bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <SectionHeader eyebrow={faq.eyebrow} title={faq.title} center />

          <div className="mt-10 divide-y divide-[#F3F1EB] border-y border-[#F3F1EB]">
            {faq.items.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-[#14131A]">
                  {item.q}
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#E2DFD5] text-[#8A8470] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#55524A]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Accès */}
      <section id="acces" className="scroll-mt-20 border-b border-[#ECEAE3] bg-[#FBFAF7]">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow={acces.eyebrow} title={acces.title} />

            <div className="mt-8 space-y-6">
              <div className="flex gap-3">
                <MapPin size={18} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                <div className="text-sm text-[#55524A]">
                  {acces.address.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  <p className="mt-1 text-[#8A8470]">{acces.parking}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock size={18} className="mt-0.5 flex-shrink-0 text-[#C9A227]" />
                <div className="w-full max-w-sm text-sm text-[#55524A]">
                  {acces.hours.map((h) => (
                    <div key={h.day} className="flex justify-between gap-4 border-b border-[#EFEDE5] py-1.5 last:border-0">
                      <span>{h.day}</span>
                      <span className="font-medium text-[#14131A]">{h.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <a href={`tel:${acces.phone}`} className="flex items-center gap-2 text-sm font-medium text-[#14131A]">
                  <Phone size={16} className="text-[#C9A227]" />
                  {acces.phone}
                </a>
                <a href={`mailto:${acces.email}`} className="flex items-center gap-2 text-sm font-medium text-[#14131A]">
                  <Mail size={16} className="text-[#C9A227]" />
                  {acces.email}
                </a>
              </div>
            </div>
          </div>

          <Placeholder ratio="4/3" label="Carte ou photo de la façade / entrée de la salle" />
        </div>
      </section>

      {/* ----------------------------------------------------------- CTA final */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#14131A] px-8 py-14 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {finalCta.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#B9B5AA]">
                {finalCta.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A227] via-[#E8C84A] to-[#C9A227] px-6 py-3.5 text-sm font-bold text-[#14131A]"
                >
                  {finalCta.primary}
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#acces"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
                >
                  {finalCta.secondary}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Footer */}
      <footer className="border-t border-[#ECEAE3] bg-[#FBFAF7]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8C84A] via-[#D4AF37] to-[#B8941E] text-sm font-black text-[#14131A]">
              MK
            </span>
            <div>
              <p className="text-sm font-bold text-[#14131A]">MK Studio</p>
              <p className="text-xs text-[#8A8470]">{footer.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm text-[#55524A]">
            <Link href="/login" className="transition-colors hover:text-[#14131A]">
              Mon espace
            </Link>
            <Link href="/register" className="flex items-center gap-1.5 transition-colors hover:text-[#14131A]">
              <Users size={14} />
              Inscription
            </Link>
          </div>

          <p className="text-xs text-[#8A8470]">
            © {year} MK Studio. {footer.legal}
          </p>
        </div>
      </footer>
    </div>
  );
}
