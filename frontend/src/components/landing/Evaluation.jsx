import { ShieldCheck } from "lucide-react";
import { EVAL_RULES, METRICS, STACK } from "../../data/content";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const SPLIT = [
  { label: "Train", share: 80, detail: "80 % des notes les plus anciennes", className: "bg-indigo-500/70" },
  { label: "Validation", share: 10, detail: "10 % suivantes", className: "bg-violet-400/80" },
  { label: "Test", share: 10, detail: "10 % les plus récentes", className: "bg-cta" },
];

export default function Evaluation() {
  return (
    <section id="evaluation" className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
      <SectionHeading eyebrow="Évaluation" title="Une évaluation honnête, sans fuite de données.">
        On apprend sur le passé, on teste sur le futur. Pour chaque utilisateur, ses notes sont triées dans le temps avant
        d'être découpées.
      </SectionHeading>

      <Reveal className="mt-12 rounded-2xl border border-white/10 bg-ink-900/70 p-6 sm:p-8">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Notes les plus anciennes</span>
          <span>Plus récentes</span>
        </div>
        <div className="mt-3 flex h-12 gap-1 overflow-hidden rounded-xl" role="img" aria-label="Découpage temporel : 80 % Train, 10 % Validation, 10 % Test">
          {SPLIT.map((s) => (
            <div key={s.label} className={`${s.className} flex items-center px-2 sm:px-3`} style={{ width: `${s.share}%` }}>
              <span className={`truncate text-sm font-medium text-white ${s.share < 20 ? "hidden sm:inline" : ""}`}>
                {s.share} %
              </span>
            </div>
          ))}
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {SPLIT.map((s) => (
            <div key={s.label} className="flex items-start gap-3">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${s.className}`} aria-hidden="true" />
              <div>
                <dt className="font-heading font-semibold">{s.label}</dt>
                <dd className="text-sm text-slate-400">{s.detail}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal delay={60} className="rounded-2xl border border-white/10 bg-ink-900/70 p-6 sm:p-8">
          <h3 className="font-heading text-lg font-semibold">Trois règles anti-fuite</h3>
          <ul className="mt-4 space-y-3">
            {EVAL_RULES.map((rule) => (
              <li key={rule} className="flex gap-3 text-slate-300">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden="true" />
                {rule}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="rounded-2xl border border-white/10 bg-ink-900/70 p-6 sm:p-8">
          <h3 className="font-heading text-lg font-semibold">Ce qu'on mesure</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-slate-400">La note prédite est-elle juste ?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {METRICS.filter((m) => m.group === "note").map((m) => (
                  <span key={m.name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-heading text-sm">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Le top 10 contient-il les bons films ?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {METRICS.filter((m) => m.group === "top").map((m) => (
                  <span key={m.name} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 font-heading text-sm text-rose-100">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={80} className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
        <span className="text-slate-400">Construit avec</span>
        {STACK.map((tech) => (
          <span key={tech} className="font-heading font-medium text-slate-300">
            {tech}
          </span>
        ))}
      </Reveal>
    </section>
  );
}
