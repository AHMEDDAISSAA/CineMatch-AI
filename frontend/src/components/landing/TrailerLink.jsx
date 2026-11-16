import { Play } from "lucide-react";

// Bande-annonce officielle (id YouTube vérifié), sinon recherche YouTube en repli
export const trailerUrl = (film) =>
  film.trailer
    ? `https://www.youtube.com/watch?v=${film.trailer}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${film.title} ${film.year} bande-annonce`)}`;

export default function TrailerLink({ film, className = "", iconClassName = "size-4" }) {
  return (
    <a
      href={trailerUrl(film)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Voir la bande-annonce de ${film.title} sur YouTube`}
      title="Bande-annonce sur YouTube"
      className={`pressable grid cursor-pointer place-items-center rounded-full border border-white/50 bg-white/15 backdrop-blur-md hover:border-white/80 hover:bg-white/30 ${className}`}
    >
      <Play className={`ml-0.5 fill-white text-white ${iconClassName}`} aria-hidden="true" />
    </a>
  );
}
