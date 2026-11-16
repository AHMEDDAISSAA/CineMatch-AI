import { ArrowRight, Bookmark, Plus, Sparkles, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GITHUB_URL, STATS } from "../../data/content";
import { FILM_BY_ID } from "../../data/films";
import useCountUp from "../../hooks/useCountUp";
import useReducedMotion from "../../hooks/useReducedMotion";
import { GitHubMark, LogoMark } from "./Brand";
import TasteGraph from "./TasteGraph";
import TrailerLink from "./TrailerLink";

const fr = (value, decimals = 0) =>
  value.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Le téléphone montre une recommandation ; les affiches autour sont les suivantes du top 10.
const FEATURED = FILM_BY_ID[58559]; // The Dark Knight
const BECAUSE = FILM_BY_ID[79132]; // Inception
const NEXT = [
  { film: FILM_BY_ID[79132], rank: 2, score: 0.91, rotate: 9, depth: 26, delay: 0.1, float: 0, front: false, className: "top-4 right-0 w-[150px]" },
  { film: FILM_BY_ID[296], rank: 3, score: 0.88, rotate: -11, depth: 34, delay: 0.2, float: 2.3, front: false, badge: "left", className: "top-[38%] -left-2 w-[146px]" },
  { film: FILM_BY_ID[88129], rank: 4, score: 0.86, rotate: 6, depth: 20, delay: 0.3, float: 4.6, front: true, className: "-right-9 bottom-0 w-[150px]" },
];

function Stat({ value, decimals = 0, suffix = "", label }) {
  const current = useCountUp(value);
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-heading text-2xl font-semibold tabular-nums text-white sm:text-3xl">
        {fr(current, decimals)}
        {suffix}
      </dd>
      <dd className="mt-1 text-sm text-slate-400">{label}</dd>
    </div>
  );
}

// Couche de profondeur : suit légèrement le pointeur (plus la valeur est grande, plus elle bouge)
const parallax = (depth, rotate = 0) => ({
  transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px), 0) rotate(${rotate}deg)`,
});

function FloatingPoster({ film, rank, score, rotate, depth, delay, float, front, badge = "center", className }) {
  return (
    <div className={`absolute ${front ? "z-20" : "z-0"} ${className}`} style={parallax(depth, rotate)}>
      <div className="hero-in" style={{ "--in-delay": `${delay + 0.25}s` }}>
        <div className="float relative" style={{ "--float-delay": `-${float}s` }}>
          <div className="relative overflow-hidden rounded-md shadow-[0_30px_60px_-15px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
            <img
              src={film.poster}
              alt={`Affiche de ${film.title}`}
              width={film.width}
              height={film.height}
              decoding="async"
              className="aspect-[2/3] w-full object-cover"
            />
            {/* Reflet de papier plié */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.16)_0%,transparent_28%,transparent_47%,rgb(255_255_255/0.14)_50%,transparent_53%,transparent_100%)]"
            />
          </div>
          <div className={`absolute -bottom-3 flex items-center gap-1.5 ${badge === "left" ? "left-2" : "left-1/2 -translate-x-1/2"} rounded-full border border-white/10 bg-ink-950/85 px-2.5 py-1 text-xs whitespace-nowrap shadow-lg backdrop-blur`}>
            <span className="text-slate-400">n°{rank}</span>
            <span className="h-3 w-px bg-white/15" aria-hidden="true" />
            <span className="font-heading font-semibold tabular-nums text-rose-200">{fr(score, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  const film = FEATURED;
  return (
    <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
      <div style={parallax(8)}>
        <div className="hero-in" style={{ "--in-delay": "0.1s" }}>
          <div className="relative h-[560px] w-[276px] rounded-[2.8rem] border border-white/15 bg-[#0d0d14] p-2.5 shadow-[0_50px_120px_-30px_rgb(0_0_0/0.95),inset_0_0_0_1px_rgb(255_255_255/0.04)]">
            <div className="relative h-full overflow-hidden rounded-[2.3rem] bg-[#111119]">
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <span className="flex items-center gap-1.5 font-heading text-sm font-semibold">
                  <LogoMark className="h-4 w-auto" />
                  Pour vous
                </span>
                <span className="rounded-full bg-cta/20 px-2 py-0.5 text-[10px] font-medium text-rose-200">Top 10</span>
              </div>

              {/* Affiche du film recommandé */}
              <div className="relative mx-3 h-[290px] overflow-hidden rounded-[1.4rem] ring-1 ring-white/10">
                <img
                  src={film.poster}
                  alt={`Affiche de ${film.title}`}
                  width={film.width}
                  height={film.height}
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                  <Sparkles className="size-3 text-rose-300" aria-hidden="true" />
                  Recommandé · 94 %
                </span>
                <TrailerLink film={film} className="absolute right-3 bottom-3 size-11" />
              </div>

              {/* Fiche du film */}
              <div className="absolute inset-x-0 bottom-0 rounded-t-[1.8rem] border-t border-white/10 bg-[#16161f] px-5 pt-2.5 pb-5">
                <div className="mx-auto h-1 w-9 rounded-full bg-white/15" aria-hidden="true" />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg leading-tight font-semibold">{film.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      {film.year}
                      <span className="size-1 rounded-full bg-slate-600" aria-hidden="true" />
                      <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <span className="text-slate-200">{fr(film.rating, 1)}</span>
                      <span>· {film.votes} notes</span>
                    </p>
                  </div>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/8" aria-hidden="true">
                    <Bookmark className="size-3.5 text-slate-300" />
                  </span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {film.genres
                    .filter((g) => g !== "IMAX")
                    .map((g) => (
                      <span key={g} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-slate-300">
                        {g}
                      </span>
                    ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Sparkles className="size-3 shrink-0 text-rose-300" aria-hidden="true" />
                  <span className="truncate">
                    Parce que vous avez aimé <span className="text-slate-200">{BECAUSE.title}</span>
                  </span>
                </p>
                <div className="mt-3.5 flex items-center justify-center gap-1.5 rounded-full bg-cta py-2.5 text-xs font-medium text-white" aria-hidden="true">
                  <Plus className="size-3.5" />
                  Ajouter à ma liste
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const stageRef = useRef(null);
  const reduced = useReducedMotion();
  // La constellation n'existe que sur grand écran : pas de WebGL ni de Three.js sur mobile
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setWide(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // Parallaxe au pointeur, lissée (désactivée si le mouvement est réduit)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return undefined;
    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      stage.style.setProperty("--px", x.toFixed(3));
      stage.style.setProperty("--py", y.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:flex lg:min-h-[100svh] lg:items-center lg:pt-24"
    >
      {/* Constellation discrète en fond : films regroupés par genre, liens vers le top 10 */}
      {wide && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[60%] opacity-35">
          <TasteGraph className="h-full w-full" />
        </div>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 right-[-5%] h-180 w-180 rounded-full bg-[radial-gradient(circle,rgb(67_56_202/0.3),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-10%] left-[-12%] h-140 w-140 rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.14),transparent_65%)]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium whitespace-nowrap text-slate-300 backdrop-blur">
            <Sparkles className="size-3.5 text-cta" aria-hidden="true" />
            Projet de Machine Learning · MovieLens
          </p>

          <h1 className="mt-5 font-heading text-4xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] xl:text-6xl short:text-5xl">
            Le film que vous allez aimer,{" "}
            <span className="bg-linear-to-r from-rose-400 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
              avant même de le chercher.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300 short:mt-4 short:text-base">
            CineMatch-AI apprend vos goûts à partir de plus de 100 000 notes de films. Il combine deux intuitions,
            les films qui ressemblent à ceux que vous aimez et ceux qu'aiment les personnes qui vous ressemblent,
            pour proposer un top 10 personnalisé et expliqué.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#demo"
              className="pressable group inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cta px-5 py-3 font-medium text-white shadow-[0_8px_30px_rgb(225_29_72/0.35)] hover:bg-cta-hover"
            >
              Essayer le curseur alpha
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white backdrop-blur hover:border-white/25 hover:bg-white/10"
            >
              <GitHubMark className="size-4" />
              Voir le code
            </a>
          </div>

          <dl className="mt-10 grid max-w-xl short:mt-7 short:pt-5 grid-cols-2 gap-6 border-t border-white/10 pt-7 sm:grid-cols-4">
            {STATS.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </dl>
        </div>

        {/* Composition : téléphone + affiches suivantes du top 10 */}
        <div className="relative mx-auto h-[410px] w-full max-w-[520px] sm:h-[600px]">
          <div
            ref={stageRef}
            className="absolute top-0 left-1/2 h-[600px] w-[520px] origin-top -translate-x-1/2 scale-[0.68] sm:scale-100 short:scale-[0.86]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.28),transparent_62%)]"
            />
            <PhoneMockup />
            {NEXT.map((item) => (
              <FloatingPoster key={item.film.id} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
