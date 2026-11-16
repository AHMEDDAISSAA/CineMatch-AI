import { useEffect, useState } from "react";
import { GITHUB_URL, NAV_LINKS } from "../../data/content";
import { GitHubMark, Logo } from "./Brand";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-4 top-4 z-50">
      <nav
        aria-label="Navigation principale"
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 backdrop-blur-xl transition-colors duration-300 ${
          scrolled ? "border-white/10 bg-ink-900/80" : "border-transparent bg-ink-900/30"
        }`}
      >
        <Logo animated />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Code source sur GitHub"
            className="pressable grid size-10 cursor-pointer place-items-center rounded-xl text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <GitHubMark />
          </a>
          <a
            href="#demo"
            className="pressable cursor-pointer rounded-xl bg-cta px-4 py-2 text-sm font-medium text-white hover:bg-cta-hover"
          >
            Essayer
          </a>
        </div>
      </nav>
    </header>
  );
}
