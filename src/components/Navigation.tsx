"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const navItems = [
  ["About", "#about"], ["Work", "#work"], ["Capabilities", "#capabilities"],
  ["Activity", "#activity"], ["Credentials", "#credentials"],
] as const;

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);

  useEffect(() => {
    let wasScrolled = false;
    const onScroll = () => {
      const isScrolled = window.scrollY > 40;
      if (isScrolled !== wasScrolled) {
        wasScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const onOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!header.current?.contains(target) && !mobileMenu.current?.contains(target)) setMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onOutsideClick);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      });
    }, { rootMargin: "-15% 0px -65% 0px" });
    document.querySelectorAll("main > section[id], main > footer[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <><header ref={header} className={`shatter-nav${scrolled ? " is-scrolled" : ""}`}>
      <a className="shatter-wordmark" href="#top" aria-label="Prashant Yadav — home" onClick={() => setMenuOpen(false)}>PY<span>©26</span></a>
      <nav className="shatter-nav-links" aria-label="Primary navigation">
        {navItems.map(([label, href]) => <a key={href} href={href} aria-current={active === href ? "location" : undefined}>{label}</a>)}
      </nav>
      <a className="shatter-contact-link" href="#contact">Let&apos;s talk <ArrowUpRight size={15} aria-hidden="true" /></a>
      <button ref={menuButton} type="button" className="shatter-menu-button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={21} />}</button>
    </header>
      <nav ref={mobileMenu} id="mobile-navigation" className={`shatter-mobile-nav${scrolled ? " is-scrolled" : ""}`} aria-label="Mobile navigation" hidden={!menuOpen} data-lenis-prevent>
        {navItems.map(([label, href], index) => <a key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active === href ? "location" : undefined}><span>0{index + 1}</span>{label}</a>)}
        <a href="#contact" onClick={() => setMenuOpen(false)}><span>06</span>Contact</a>
      </nav>
    </>
  );
}
