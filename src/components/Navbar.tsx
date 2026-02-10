"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

/**
 * Navbar — Fixed glassmorphic pill navbar that condenses on scroll
 * with a morphing active pill indicator and mobile drawer.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const lastScrollY = useCallback(() => {
    let last = 0;
    return { get: () => last, set: (v: number) => { last = v; } };
  }, [])();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        setHidden(currentY > lastScrollY.get() && currentY > 100);
        setScrolled(currentY > 50);
        lastScrollY.set(currentY);

        // Detect active section
        const sections = navItems.map((item) => item.href.slice(1));
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i]);
          if (el && el.getBoundingClientRect().top <= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleClick = (href: string) => {
    setIsOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-2 sm:px-6 py-2.5 rounded-full transition-all duration-300"
        style={{
          background: scrolled ? "rgba(11, 15, 20, 0.8)" : "rgba(255, 255, 255, 0.03)",
          backdropFilter: `blur(${scrolled ? 24 : 16}px)`,
          WebkitBackdropFilter: `blur(${scrolled ? 24 : 16}px)`,
          border: `1px solid rgba(255, 255, 255, ${scrolled ? 0.08 : 0.04})`,
          boxShadow: scrolled
            ? "0 8px 32px rgba(0, 0, 0, 0.4)"
            : "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-1 sm:gap-6">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleClick("#home");
            }}
            className="text-base font-display font-bold gradient-text-static px-2 sm:px-0 hover:opacity-80 transition-opacity"
          >
            PKY
          </a>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(item.href);
                  }}
                  className={`relative text-sm font-medium px-4 py-2 rounded-full transition-colors duration-300 ${activeSection === item.href.slice(1)
                      ? "text-white"
                      : "text-white/45 hover:text-white/80"
                    }`}
                >
                  {/* Morphing active pill background */}
                  {activeSection === item.href.slice(1) && (
                    <motion.span
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(255, 140, 66, 0.12)",
                        border: "1px solid rgba(255, 140, 66, 0.2)",
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-white/50 hover:text-accent-orange transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{
              background: "rgba(11, 15, 20, 0.96)",
              backdropFilter: "blur(24px)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col items-center justify-center h-full gap-6">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(item.href);
                  }}
                  className={`text-3xl font-display font-semibold transition-colors ${activeSection === item.href.slice(1)
                      ? "gradient-text-static"
                      : "text-white/40 hover:text-white/80"
                    }`}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
