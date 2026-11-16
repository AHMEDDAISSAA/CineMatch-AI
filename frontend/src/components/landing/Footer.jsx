import { ArrowRight } from "lucide-react";
import { GITHUB_URL, MOVIELENS_URL } from "../../data/content";
import { GitHubMark, Logo } from "./Brand";
import Reveal from "./Reveal";

export default function Footer() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-deep via-ink-900 to-ink-900 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.3),transparent_65%)]"
          />
          <h2 className="relative font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Curieux de voir le code derrière les recommandations ?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Notebooks, modèles, API et interface : tout le projet est sur GitHub.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-ink-950 hover:bg-slate-200"
            >
              <GitHubMark className="size-4" />
              Voir le dépôt
            </a>
            <a
              href="#demo"
              className="pressable group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white hover:border-white/25 hover:bg-white/10"
            >
              Rejouer la démo
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>
            Données :{" "}
            <a href={MOVIELENS_URL} target="_blank" rel="noreferrer" className="text-slate-300 underline-offset-4 hover:underline">
              MovieLens Latest Small
            </a>{" "}
            © GroupLens Research, University of Minnesota. Affiches : Wikipédia.
          </p>
          <p>Projet de Machine Learning · 2026</p>
        </div>
      </footer>
    </>
  );
}
