"use client";

import { useState, useEffect, useCallback } from "react";
import { Home, User, FolderKanban, Zap, Trophy, Mail } from "lucide-react";
import { AnimeNavBar } from "@/components/ui/anime-navbar";

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
 * section tracking and smooth scrolling.
 */
export default function Navbar() {
  const [activeTab, setActiveTab] = useState("Home");
  const [visible, setVisible] = useState(false);

  // Wait for the preloader to finish before showing the navbar
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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
    </div>
  );
}
