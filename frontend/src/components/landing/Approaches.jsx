import { Boxes, Combine, Tags, Target, UserPlus, Users } from "lucide-react";
import { APPROACHES } from "../../data/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const ICONS = { content: Tags, collab: Users, coldstart: UserPlus, supervised: Target, unsupervised: Boxes };

function Card({ icon: Icon, title, text, delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="h-full rounded-2xl border border-white/10 bg-ink-900/70 p-6 transition-colors duration-200 hover:border-white/20">
        <Icon className="size-6 text-rose-300" aria-hidden="true" />
        <h3 className="mt-4 font-heading text-lg font-semibold">{title}</h3>
        <p className="mt-2 leading-relaxed text-slate-400">{text}</p>
      </article>
    </Reveal>
  );
}

export default function Approaches() {
  const { hybrid, items } = APPROACHES;
  return (
    <section id="modeles" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <SectionHeading eyebrow="Modèles" title="Plusieurs approches, une seule recommandation.">
        Chaque modèle expose la même interface, <code className="text-slate-300">get_scores(user_id, movie_ids)</code>,
        avec des scores entre 0 et 1. On peut donc les comparer et les combiner.
      </SectionHeading>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <Reveal className="md:col-span-2 md:row-span-2">
          <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-indigo-deep/80 via-ink-900 to-ink-900 p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.25),transparent_65%)]"
            />
            <div className="relative">
              <Combine className="size-7 text-rose-300" aria-hidden="true" />
              <h3 className="mt-5 font-heading text-2xl font-semibold sm:text-3xl">{hybrid.title}</h3>
              <p className="mt-3 max-w-lg text-lg leading-relaxed text-slate-300">{hybrid.text}</p>
            </div>
            <p className="relative mt-10 rounded-xl border border-white/10 bg-ink-950/60 px-5 py-4 font-heading text-base text-slate-200 sm:text-lg">
              score = <span className="text-rose-300">α</span> × collaboratif + (1 − <span className="text-rose-300">α</span>)
              × contenu
            </p>
          </article>
        </Reveal>

        {items.map((item, i) => (
          <Card key={item.title} icon={ICONS[item.icon]} title={item.title} text={item.text} delay={(i % 3) * 70} />
        ))}
      </div>
    </section>
  );
}
