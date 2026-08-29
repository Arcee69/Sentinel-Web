import { useEffect } from "react";
import Header from "./sections/Header";
import Hero from "./sections/Hero";
import Audiences from "./sections/Audiences";
import Thesis from "./sections/Thesis";
import Engine from "./sections/Engine";
import Baseline from "./sections/Baseline";
import Turnout from "./sections/Turnout";
import Variables from "./sections/Variables";
import Cohorts from "./sections/Cohorts";
import Evidence from "./sections/Evidence";
import Channels from "./sections/Channels";
import Scenarios from "./sections/Scenarios";
import EarlyWarning from "./sections/EarlyWarning";
import Geography from "./sections/Geography";
import PlatformPreview from "./sections/PlatformPreview";
import Architecture from "./sections/Architecture";
import BuiltFor from "./sections/BuiltFor";
import Integrity from "./sections/Integrity";
import FinalCta from "./sections/FinalCta";
import Footer from "./sections/Footer";

/**
 * Public marketing site for SMHP Sentinel.
 *
 * Rendered outside the agent app's PhoneFrame — this is a full-width desktop
 * page, and it holds its own light palette (`--l-*`) so the agent's dark-mode
 * preference never applies here.
 */
export default function Landing() {
  useEffect(() => {
    const previous = document.title;
    document.title = "SMHP Sentinel | Nigeria 2027 Election Intelligence Platform";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-l-background font-l-sans text-l-foreground">
      <Header />
      <main>
        <Hero />
        <Audiences />
        <Thesis />
        <Engine />
        <Baseline />
        <Turnout />
        <Variables />
        <Cohorts />
        <Evidence />
        <Channels />
        <Scenarios />
        <EarlyWarning />
        <Geography />
        <PlatformPreview />
        <Architecture />
        <BuiltFor />
        <Integrity />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
