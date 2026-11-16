import Reveal from "./Reveal";

export default function SectionHeading({ eyebrow, title, children, align = "left" }) {
  const centered = align === "center";
  return (
    <Reveal className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="text-sm font-medium tracking-wide text-rose-400 uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-lg leading-relaxed text-slate-400">{children}</p>}
    </Reveal>
  );
}
