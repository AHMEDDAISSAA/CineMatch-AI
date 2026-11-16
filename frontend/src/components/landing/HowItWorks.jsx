import { Cpu, Database, ListOrdered } from "lucide-react";
import { STEPS } from "../../data/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const ICONS = [Database, Cpu, ListOrdered];

export default function HowItWorks() {
  return (
    <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <SectionHeading eyebrow="Fonctionnement" title="Des notes de films à votre top 10, en trois étapes.">
        Pas de magie : un pipeline de Machine Learning complet, de la préparation des données à l'explication de chaque
        recommandation.
      </SectionHeading>

      <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
        <div
          aria-hidden="true"
          className="absolute top-11 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-transparent via-white/15 to-transparent md:block"
        />
        {STEPS.map((step, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal as="li" key={step.title} delay={i * 70} className="relative">
              <div className="h-full rounded-2xl border border-white/10 bg-ink-900/70 p-6">
                <div className="flex items-center gap-3">
                  <span className="relative grid size-11 place-items-center rounded-xl border border-white/10 bg-ink-800 text-rose-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-heading text-sm text-slate-500">Étape {i + 1}</span>
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-400">{step.text}</p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
