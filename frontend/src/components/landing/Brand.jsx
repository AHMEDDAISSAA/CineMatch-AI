import { useId } from "react";

// Logo CineMatch AI (redessiné en SVG à partir du logo du projet) et logo GitHub (Simple Icons).
//
// Le symbole : un triangle « lecture » dont le bord gauche est une pellicule, rempli
// d'un réseau de nœuds (le graphe de recommandation).

const NODES = [
  [125, 100, 22], // A
  [322, 203, 25], // B
  [207, 255, 27], // C
  [372, 328, 27], // D
  [120, 330, 25], // E
  [217, 413, 27], // F
  [340, 440, 26], // G
  [130, 555, 22], // H
  [527, 327, 33], // pointe
];
const [A, B, C, D, E, F, G, H, T] = NODES;
const EDGES = [
  [A, C], [C, B], [C, E], [C, D], [C, F], [C, G], [B, D], [B, F],
  [D, T], [D, F], [D, G], [E, F], [F, G], [F, H],
];
const HOLES = [75, 168, 260, 352, 445, 537];
// Pellicule arrondie à gauche seulement : à droite elle se fond dans le triangle
const STRIP = "M120 20 H64 A42 42 0 0 0 22 62 V594 A42 42 0 0 0 64 636 H120 Z";

const TONES = {
  // Fond sombre (site) : pellicule claire, réseau en dégradé violet → rose
  dark: { strip: "#f4f3fa", stops: ["#a78bfa", "#e879f9", "#fb7185"] },
  // Fond clair (rapport, README) : couleurs d'origine du logo
  light: { strip: "#0f1f3d", stops: ["#4a1a5e", "#4a1a5e", "#4a1a5e"] },
};

export function LogoMark({ className = "h-8 w-auto", tone = "dark", animated = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { strip, stops } = TONES[tone];
  const grad = `cm-grad-${uid}`;
  const mask = `cm-holes-${uid}`;

  return (
    <svg viewBox="16 14 566 628" className={`${className} ${animated ? "logo-draw" : ""}`} aria-hidden="true">
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="120" y1="60" x2="540" y2="600">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </linearGradient>
        {/* Perforations réellement transparentes */}
        <mask id={mask}>
          <rect x="0" y="0" width="600" height="660" fill="#fff" />
          {HOLES.map((y) => (
            <rect key={y} x="48" y={y} width="47" height="43" rx="7" fill="#000" />
          ))}
        </mask>
      </defs>

      <polyline
        points="95,44 540,327 95,612"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="30"
        strokeLinejoin="round"
        strokeLinecap="butt"
      />
      <g stroke={`url(#${grad})`} strokeWidth="10" strokeLinecap="round">
        {EDGES.map(([[x1, y1], [x2, y2]], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" style={{ "--i": i }} />
        ))}
      </g>
      <g fill={`url(#${grad})`}>
        {NODES.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} style={{ "--i": i }} />
        ))}
      </g>
      <path d={STRIP} fill={strip} mask={`url(#${mask})`} />
    </svg>
  );
}

export function Wordmark({ className = "" }) {
  return (
    <span className={`font-heading font-bold tracking-tight ${className}`}>
      CineMatch
      <span className="bg-linear-to-r from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">AI</span>
    </span>
  );
}

export function Logo({ animated = false }) {
  return (
    <a href="#top" className="flex items-center gap-2.5 rounded-lg" aria-label="CineMatch AI, retour en haut">
      <LogoMark className="h-9 w-auto" animated={animated} />
      <Wordmark className="text-xl" />
    </a>
  );
}

export function GitHubMark({ className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
