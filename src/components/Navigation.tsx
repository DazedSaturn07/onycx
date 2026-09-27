"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const navItems = [
  ["About", "/#about"], ["Projects", "/projects"], ["Capabilities", "/#capabilities"],
  ["Activity", "/#activity"], ["Credentials", "/#credentials"],
] as const;

export default function Navigation() {
  const pathname = usePathname();
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
      <Link className="shatter-wordmark" href="/" aria-label="Prashant Yadav — home" onClick={() => setMenuOpen(false)}>
        <Image src="/Logo.png" alt="Prashant Yadav Logo" width={48} height={48} style={{ height: "1.5rem", width: "auto", objectFit: "contain" }} priority />
        <span>©26</span>
      </Link>
      <nav className="shatter-nav-links" aria-label="Primary navigation">
        {navItems.map(([label, href]) => {
          const destination = pathname === "/" && href.startsWith("/#") ? href.slice(1) : href;
          const isActive = href === "/projects" ? pathname === href : pathname === "/" && active === href.slice(1);
          return <Link key={href} href={destination} aria-current={isActive ? "location" : undefined} onClick={() => setMenuOpen(false)}>{label}</Link>;
        })}
      </nav>
      <Link className="shatter-contact-link" href={pathname === "/" ? "#contact" : "/#contact"} onClick={() => setMenuOpen(false)}>Let&apos;s talk <ArrowUpRight size={15} aria-hidden="true" /></Link>
      <button ref={menuButton} type="button" className="shatter-menu-button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={21} />}</button>
    </header>
      <nav ref={mobileMenu} id="mobile-navigation" className={`shatter-mobile-nav${scrolled ? " is-scrolled" : ""}`} aria-label="Mobile navigation" hidden={!menuOpen} data-lenis-prevent>
        {navItems.map(([label, href], index) => {
          const destination = pathname === "/" && href.startsWith("/#") ? href.slice(1) : href;
          const isActive = href === "/projects" ? pathname === href : pathname === "/" && active === href.slice(1);
          return <Link key={href} href={destination} onClick={() => setMenuOpen(false)} aria-current={isActive ? "location" : undefined}><span>0{index + 1}</span>{label}</Link>;
        })}
        <Link href={pathname === "/" ? "#contact" : "/#contact"} onClick={() => setMenuOpen(false)}><span>06</span>Contact</Link>
        <Link href="/" aria-label="Home" onClick={() => setMenuOpen(false)} className="shatter-mobile-logo-text">
          <span className="shatter-mobile-logo-word">ONYCX</span>
        </Link>
      </nav>
    </>
  );
}
