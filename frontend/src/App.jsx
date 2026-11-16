import AlphaDemo from "./components/landing/AlphaDemo";
import AppShowcase from "./components/landing/AppShowcase";
import Approaches from "./components/landing/Approaches";
import Evaluation from "./components/landing/Evaluation";
import Footer from "./components/landing/Footer";
import Hero from "./components/landing/Hero";
import HowItWorks from "./components/landing/HowItWorks";
import Navbar from "./components/landing/Navbar";
import Team from "./components/landing/Team";

export default function App() {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink-950"
      >
        Aller au contenu
      </a>
      <Navbar />
      <main id="contenu">
        <Hero />
        <AppShowcase />
        <HowItWorks />
        <Approaches />
        <AlphaDemo />
        <Evaluation />
        <Team />
      </main>
      <Footer />
    </>
  );
}
