import { TEAM } from "../../data/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

export default function Team() {
  return (
    <section id="equipe" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <SectionHeading eyebrow="Équipe" title="Quatre personnes, un même pipeline." align="center">
        Données, modèles, évaluation, API et interface : chacun porte une brique du projet.
      </SectionHeading>

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((member, i) => (
          <Reveal as="li" key={member.name} delay={i * 60}>
            <div className="h-full rounded-2xl border border-white/10 bg-ink-900/70 p-6 text-center">
              <div
                aria-hidden="true"
                className="mx-auto grid size-16 place-items-center rounded-full bg-linear-to-br from-rose-500 to-indigo-600 font-heading text-lg font-semibold text-white"
              >
                {initials(member.name)}
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{member.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{member.role}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
