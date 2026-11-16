import { ArrowLeft, ChevronLeft, ChevronRight, Heart, House, Search, Star, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FILMS, FILM_BY_ID } from "../../data/films";
import useReducedMotion from "../../hooks/useReducedMotion";
import { LogoMark } from "./Brand";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import TrailerLink from "./TrailerLink";

// Films du carrousel « Pour vous » (movieId MovieLens)
const FEATURED = [109487, 5618, 296, 109374, 122882, 4973, 58559].map((id) => FILM_BY_ID[id]);
const AUTOPLAY_MS = 4500;

const fr1 = (x) => x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const contentGenres = (film) => film.genres.filter((g) => g !== "IMAX");

// Mini « content-based » : similarité de Jaccard sur les genres
function similarFilms(film, n = 3) {
  const a = new Set(contentGenres(film));
  return FILMS.filter((f) => f.id !== film.id)
    .map((f) => {
      const b = new Set(contentGenres(f));
      const inter = [...a].filter((g) => b.has(g)).length;
      return { film: f, score: inter / new Set([...a, ...b]).size };
    })
    .sort((x, y) => y.score - x.score || y.film.votes - x.film.votes)
    .slice(0, n)
    .map((s) => s.film);
}

// Position de chaque carte selon son écart (circulaire) avec la carte active
function cardStyle(offset) {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset);
  const x = [0, 112, 188, 250][Math.min(abs, 3)] * sign;
  const rotate = [0, -26, -38, -45][Math.min(abs, 3)] * sign;
  const scale = [1, 0.8, 0.64, 0.5][Math.min(abs, 3)];
  return {
    transform: `translateX(${x}px) rotateY(${rotate}deg) scale(${scale})`,
    opacity: [1, 0.85, 0.4, 0][Math.min(abs, 3)],
    zIndex: 10 - abs,
    filter: abs ? "brightness(0.7)" : "none",
  };
}

function Poster({ film, className = "", eager = false }) {
  return (
    <img
      src={film.poster}
      alt={`Affiche de ${film.title}`}
      width={film.width}
      height={film.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable="false"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function PhoneFrame({ children, className = "" }) {
  return (
    <div
      className={`relative h-[600px] w-[290px] shrink-0 overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#101016] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.95)] ${className}`}
    >
      {children}
    </div>
  );
}

function HomeScreen({ active, onSelect }) {
  const film = FEATURED[active];
  const n = FEATURED.length;

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") onSelect((active + 1) % n);
    if (e.key === "ArrowLeft") onSelect((active - 1 + n) % n);
  };

  return (
    <PhoneFrame>
      {/* Image du film à la une */}
      <div className="absolute inset-x-0 top-0 h-[330px]" aria-hidden="true">
        <img key={film.id} src={film.poster} alt="" className="fade-in h-full w-full scale-105 object-cover object-top" />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/5 to-[#101016]" />
      </div>

      <div className="relative flex items-center justify-between px-5 pt-6">
        <p className="flex items-center gap-2 font-heading text-lg font-semibold [text-shadow:0_1px_10px_rgb(0_0_0/0.7)]">
          <LogoMark className="h-5 w-auto drop-shadow" />
          Pour vous
        </p>
        <span className="grid size-8 place-items-center rounded-full bg-white/15 backdrop-blur">
          <User className="size-4" aria-hidden="true" />
        </span>
      </div>

      {/* Carrousel */}
      <div
        className="absolute inset-x-0 top-[168px] h-[240px] [perspective:900px]"
        role="group"
        aria-roledescription="carrousel"
        aria-label="Recommandations pour vous"
        onKeyDown={onKeyDown}
      >
        {FEATURED.map((f, i) => {
          let offset = (i - active + n) % n;
          if (offset > n / 2) offset -= n;
          const isActive = offset === 0;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(i)}
              tabIndex={Math.abs(offset) <= 1 ? 0 : -1}
              aria-label={isActive ? `${f.title}, film à la une` : `Afficher ${f.title}`}
              aria-current={isActive}
              className="carousel-card absolute top-0 left-1/2 -ml-[78px] h-[234px] w-[156px] cursor-pointer rounded-2xl"
              style={{ ...cardStyle(offset), pointerEvents: Math.abs(offset) > 2 ? "none" : "auto" }}
            >
              <span className="block h-full overflow-hidden rounded-2xl shadow-[0_18px_40px_-10px_rgb(0_0_0/0.8)] ring-1 ring-white/10">
                <Poster film={f} eager={Math.abs(offset) <= 1} />
              </span>
            </button>
          );
        })}
        {/* Lecture : lien vers la bande-annonce, posé sur le coin de la carte active
            (hors du bouton de la carte : un lien ne peut pas être dans un bouton) */}
        <TrailerLink key={film.id} film={film} className="fade-in absolute -top-4 left-1/2 z-20 ml-[50px] size-11" />
      </div>

      {/* Titre + points */}
      <div className="absolute inset-x-0 top-[424px] px-5 text-center">
        <p key={film.id} className="fade-in truncate font-heading font-semibold">
          {film.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {film.year} · {contentGenres(film).slice(0, 2).join(", ")}
        </p>
        <div className="mt-3 flex justify-center gap-1.5">
          {FEATURED.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Aller au film ${i + 1} : ${f.title}`}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                i === active ? "w-4 bg-cta" : "w-1.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Barre de navigation */}
      <nav
        aria-label="Navigation de l'application (maquette)"
        className="absolute inset-x-3 bottom-3 flex items-center justify-around rounded-[1.8rem] border border-white/5 bg-white/5 py-3.5 backdrop-blur"
      >
        <span className="relative text-cta" aria-label="Accueil">
          <House className="size-5 fill-cta/20" aria-hidden="true" />
          <span className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-cta shadow-[0_0_8px_2px_rgb(225_29_72/0.8)]" />
        </span>
        <Heart className="size-5 text-slate-500" aria-label="Favoris" />
        <Search className="size-5 text-slate-500" aria-label="Recherche" />
        <User className="size-5 text-slate-500" aria-label="Profil" />
      </nav>
    </PhoneFrame>
  );
}

function DetailScreen({ film, onSelect }) {
  const similar = useMemo(() => similarFilms(film), [film]);

  return (
    <PhoneFrame className="lg:translate-y-10">
      {/* En-tête : affiche floutée en fond, affiche nette par-dessus */}
      <div className="relative h-[220px] overflow-hidden" aria-hidden="true">
        <img key={film.id} src={film.poster} alt="" className="fade-in h-full w-full scale-125 object-cover blur-2xl saturate-150" />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/10 to-[#101016]" />
      </div>
      <div className="absolute top-5 right-5 left-5 flex justify-between">
        <span className="grid size-8 place-items-center rounded-full bg-black/30 backdrop-blur">
          <ArrowLeft className="size-4" aria-hidden="true" />
        </span>
        <span className="grid size-8 place-items-center rounded-full bg-black/30 backdrop-blur">
          <Heart className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div key={film.id} className="fade-in absolute top-[64px] left-5 h-[150px] w-[100px] overflow-hidden rounded-xl shadow-[0_20px_40px_-12px_rgb(0_0_0/0.9)] ring-1 ring-white/15">
        <Poster film={film} eager />
      </div>
      <TrailerLink film={film} className="absolute top-[166px] right-5 size-12" iconClassName="size-5" />

      <div className="px-5 pt-3">
        <h3 className="font-heading text-xl leading-tight font-semibold">
          {film.title} <span className="text-sm font-normal text-slate-500">{film.year}</span>
        </h3>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="font-semibold">{fr1(film.rating)}</span>
          <span className="text-slate-500">/ 5</span>
          <span className="h-3 w-px bg-white/15" aria-hidden="true" />
          <span className="text-slate-400">{film.votes} notes MovieLens</span>
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {contentGenres(film)
            .slice(0, 3)
            .map((g) => (
              <span key={g} className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] text-slate-300">
                {g}
              </span>
            ))}
        </div>
        <p className="mt-3 line-clamp-4 text-[13px] leading-relaxed text-slate-300">{film.synopsis}</p>

        <p className="mt-4 text-sm font-semibold">Plus comme ça</p>
        <div className="mt-2 flex gap-2">
          {similar.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f.id)}
              aria-label={`Voir ${f.title}`}
              className="pressable h-[114px] w-[76px] shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-white/30"
            >
              <Poster film={f} />
            </button>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

export default function AppShowcase() {
  const [active, setActive] = useState(0);
  const [detailId, setDetailId] = useState(FEATURED[0].id);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  const stageRef = useRef(null);

  const select = (i) => {
    setActive(i);
    setDetailId(FEATURED[i].id);
  };
  const step = (delta) => select((active + delta + FEATURED.length) % FEATURED.length);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    if (stageRef.current) io.observe(stageRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || reduced || !inView) return undefined;
    const timer = setTimeout(() => select((active + 1) % FEATURED.length), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  });

  const detail = FILM_BY_ID[detailId];
  const glowRight = similarFilms(detail, 1)[0]?.color ?? detail.color;

  return (
    <section id="application" className="mx-auto max-w-6xl px-4 pt-24 sm:pt-32">
      <SectionHeading eyebrow="L'application" title="Votre prochain film, en un coup d'œil.">
        Un carrousel de recommandations personnalisées et, pour chaque film, sa note moyenne MovieLens, ses genres et
        des films proches. Les films et les notes viennent du dataset.
      </SectionHeading>

      <Reveal className="mt-12">
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b11] px-4 py-12 sm:py-16"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {/* Lueurs : couleur dominante de l'affiche active et du film le plus proche */}
          <div aria-hidden="true" className="glow pointer-events-none absolute top-[5%] -left-40 size-[38rem] opacity-70" style={{ "--glow": FEATURED[active].color }} />
          <div aria-hidden="true" className="glow pointer-events-none absolute top-[15%] -right-40 size-[36rem] opacity-60" style={{ "--glow": glowRight }} />
          <div aria-hidden="true" className="glow pointer-events-none absolute -bottom-72 left-1/2 size-[40rem] -translate-x-1/2 opacity-60" style={{ "--glow": "#7c3aed" }} />

          <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-14">
            <HomeScreen active={active} onSelect={select} />
            <DetailScreen film={detail} onSelect={setDetailId} />
          </div>

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Film précédent"
            className="pressable absolute top-1/2 left-5 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-ink-950 shadow-lg hover:bg-slate-200 sm:grid"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Film suivant"
            className="pressable absolute top-1/2 right-5 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-ink-950 shadow-lg hover:bg-slate-200 sm:grid"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Maquette d'interface. Affiches : Wikipédia, propriété de leurs ayants droit.
        </p>
      </Reveal>
    </section>
  );
}
