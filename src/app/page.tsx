import Preloader from "@/components/Preloader";
import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ProjectsSection from "@/components/ProjectsSection";
import SkillsSection from "@/components/SkillsSection";
import AchievementsSection from "@/components/AchievementsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import LightPillarBackground from "@/components/LightPillarBackground";

/**
 * Home — Single-page scrollytelling portfolio.
 * Sections flow: Hero → About → Projects → Skills → Achievements → Contact → Footer
 *
 * LightPillarBackground is a fixed WebGL overlay with mix-blend-mode: screen
 * that becomes visible after scrolling past the hero section.
 */
export default function Home() {
  return (
    <>
      <Preloader />
      <ScrollProgress />
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <LightPillarBackground />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <AchievementsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}

