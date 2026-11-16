import { useId, useMemo, useState } from "react";
import { SAMPLE_FILMS } from "../../data/content";
import { FILM_BY_ID } from "../../data/films";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const ROW_H = 68;
const PRESETS = [0, 0.5, 1];
const fr2 = (x) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AlphaDemo() {
  const [alpha, setAlpha] = useState(0.5);
  const sliderId = useId();

  const ranked = useMemo(
    () =>
      SAMPLE_FILMS.map((f) => ({ ...f, score: alpha * f.collab + (1 - alpha) * f.content })).sort(
        (a, b) => b.score - a.score,
      ),
    [alpha],
  );
  const rankOf = Object.fromEntries(ranked.map((f, i) => [f.id, i]));
  const scoreOf = Object.fromEntries(ranked.map((f) => [f.id, f.score]));
  const pctCollab = Math.round(alpha * 100);

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-120 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(30_27_75/0.55),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="Démo" title="Un curseur pour doser deux intuitions.">
            Le modèle hybride mélange deux avis. Faites glisser alpha et regardez le classement changer.
          </SectionHeading>

          <Reveal delay={80} className="mt-8 space-y-4 text-slate-300">
            <p className="rounded-xl border border-white/10 bg-ink-900/70 p-4">
              <span className="font-heading font-semibold text-white">α = 0, contenu seul.</span> Des films proches de ceux
              que vous aimez. Ici, le profil d'exemple adore la science-fiction : Interstellar et Arrival montent.
            </p>
            <p className="rounded-xl border border-white/10 bg-ink-900/70 p-4">
              <span className="font-heading font-semibold text-white">α = 1, collaboratif seul.</span> Ce qu'ont aimé les
              personnes au profil proche du vôtre, même hors de vos genres habituels : Pulp Fiction, Whiplash.
            </p>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-5 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={sliderId} className="font-heading text-lg font-semibold">
                Poids du collaboratif <span className="text-rose-300">α</span>
              </label>
              <output htmlFor={sliderId} className="font-heading text-2xl font-semibold tabular-nums">
                {fr2(alpha)}
              </output>
            </div>

            <input
              id={sliderId}
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              aria-valuetext={`alpha ${fr2(alpha)} : ${pctCollab} % collaboratif, ${100 - pctCollab} % contenu`}
              className="alpha-range mt-5"
              style={{ "--fill": `${alpha * 100}%` }}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Contenu</span>
              <div className="flex gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAlpha(p)}
                    aria-pressed={alpha === p}
                    className={`pressable cursor-pointer rounded-lg border px-2.5 py-1 tabular-nums ${
                      alpha === p
                        ? "border-rose-400/60 bg-rose-500/15 text-rose-200"
                        : "border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    α = {p.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
              <span>Collaboratif</span>
            </div>

            <p className="mt-5 rounded-xl bg-ink-950/70 px-4 py-3 text-center font-heading text-sm text-slate-300 tabular-nums">
              score = <span className="text-white">{fr2(alpha)}</span> × collaboratif +{" "}
              <span className="text-white">{fr2(1 - alpha)}</span> × contenu
            </p>

            {/* Classement animé (visuel) */}
            <div className="relative mt-5" style={{ height: ROW_H * SAMPLE_FILMS.length }} aria-hidden="true">
              {SAMPLE_FILMS.map((film) => {
                const rank = rankOf[film.id];
                const score = scoreOf[film.id];
                return (
                  <div
                    key={film.id}
                    className="rank-row absolute inset-x-0 top-0 flex items-center gap-4 px-1"
                    style={{ height: ROW_H, transform: `translateY(${rank * ROW_H}px)` }}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg font-heading text-sm font-semibold tabular-nums ${
                        rank === 0 ? "bg-cta text-white" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      {rank + 1}
                    </span>
                    {FILM_BY_ID[film.id] && (
                      <img
                        src={FILM_BY_ID[film.id].poster}
                        alt=""
                        width="34"
                        height="51"
                        loading="lazy"
                        decoding="async"
                        className="h-[51px] w-[34px] shrink-0 rounded-md object-cover ring-1 ring-white/10"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {film.title} <span className="hidden text-slate-500 sm:inline">({film.year})</span>
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="score-bar h-full rounded-full bg-linear-to-r from-rose-500 to-rose-300"
                          style={{ transform: `scaleX(${score})` }}
                        />
                      </div>
                    </div>
                    <div className="hidden w-40 shrink-0 justify-end gap-1 sm:flex">
                      {film.genres.slice(0, 2).map((g) => (
                        <span key={g} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                          {g}
                        </span>
                      ))}
                      {film.genres.length > 2 && (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-500">
                          +{film.genres.length - 2}
                        </span>
                      )}
                    </div>
                    <span className="w-12 shrink-0 text-right font-heading text-sm font-semibold tabular-nums">
                      {fr2(score)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Même classement pour les lecteurs d'écran */}
            <ol className="sr-only">
              {ranked.map((f) => (
                <li key={f.id}>
                  {f.title}, score {fr2(f.score)}
                </li>
              ))}
            </ol>
            <p className="sr-only" aria-live="polite">
              En tête du classement : {ranked[0].title}
            </p>

            <p className="mt-4 text-xs text-slate-500">
              Scores d'exemple pour illustrer le principe. Dans l'application, ils viennent des modèles via l'API.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
