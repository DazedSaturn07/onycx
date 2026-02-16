"use client";

import { useState, useEffect, useCallback } from "react";
import { Home, User, FolderKanban, Zap, Trophy, Mail, Download } from "lucide-react";
import { AnimeNavBar } from "@/components/ui/anime-navbar";
import { usePreload } from "@/context/PreloadContext";

const navItems = [
  { name: "Home", url: "#home", icon: Home },
  { name: "About", url: "#about", icon: User },
  { name: "Projects", url: "#projects", icon: FolderKanban },
  { name: "Skills", url: "#skills", icon: Zap },
  { name: "Achievements", url: "#achievements", icon: Trophy },
  { name: "Contact", url: "#contact", icon: Mail },
];

/**
 * Navbar — Floating anime-style pill navbar with scroll-based
 * section tracking, smooth scrolling, and a Resume download button.
 */
export default function Navbar() {
  const [activeTab, setActiveTab] = useState("Home");
  const { isLoading } = usePreload();
  const visible = !isLoading;

  // Scroll-based active section detection
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sections = navItems.map((item) => item.url.slice(1));
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i]);
          if (el && el.getBoundingClientRect().top <= 200) {
            setActiveTab(navItems[i].name);
            break;
          }
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabClick = useCallback((name: string, url: string) => {
    setActiveTab(name);
    const el = document.querySelector(url);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div
      className="transition-opacity duration-700 ease-out"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <AnimeNavBar
        items={navItems}
        defaultActive="Home"
        activeTab={activeTab}
        onTabClick={handleTabClick}
      />

      {/* ── Resume Download Button — Fixed position, glassmorphism capsule ── */}
      <a
        href="/Prashant_res.pdf"
        download="Prashant_Kumar_Yadav_Resume.pdf"
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50 group"
        aria-label="Download Resume"
      >
        <div
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full text-white/70 hover:text-white font-semibold text-xs md:text-sm transition-all duration-500 hover:scale-[1.04] active:scale-[0.97]"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <Download
            size={14}
            className="group-hover:text-accent-orange transition-colors duration-300"
          />
          <span className="hidden md:inline">Resume</span>
        </div>
      </a>
    </div>
  );
}
