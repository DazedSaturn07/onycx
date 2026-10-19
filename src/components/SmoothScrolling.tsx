"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SignaturePreloader from "@/components/SignaturePreloader";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrolling({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"loading" | "opening" | "ready">("loading");
  const shell = useRef<HTMLDivElement>(null);
  const scroller = useRef<Lenis | null>(null);
  const pendingRoute = useRef<string | null>(null);
  const routeFrame = useRef<number | null>(null);
  const reveal = useCallback(() => setPhase("opening"), []);
  const complete = useCallback(() => setPhase("ready"), []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.78,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.05,
      anchors: true,
      respectReducedMotion: true,
    });
    scroller.current = lenis;
    lenis.stop();

    const updateScrollTrigger = () => ScrollTrigger.update();
    lenis.on("scroll", updateScrollTrigger);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);

    const scrollToPosition = (event: Event) => {
      const position = (event as CustomEvent<number>).detail;
      if (Number.isFinite(position)) lenis.scrollTo(position, { duration: .7 });
    };
    window.addEventListener("portfolio:scroll-to", scrollToPosition);

    const followPageLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href);
      if (destination.origin !== window.location.origin) return;
      pendingRoute.current = null;
      // Cancel the previous wheel/anchor target before Next changes the document.
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      if (destination.hash) return;
      if (destination.pathname === window.location.pathname) lenis.scrollTo(0, { immediate: true, force: true });
      else pendingRoute.current = destination.pathname;
    };
    const restoreHistory = () => {
      pendingRoute.current = null;
      if (routeFrame.current !== null) cancelAnimationFrame(routeFrame.current);
    };
    document.addEventListener("click", followPageLink, true);
    window.addEventListener("popstate", restoreHistory);

    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      window.removeEventListener("portfolio:scroll-to", scrollToPosition);
      document.removeEventListener("click", followPageLink, true);
      window.removeEventListener("popstate", restoreHistory);
      if (routeFrame.current !== null) cancelAnimationFrame(routeFrame.current);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      scroller.current = null;
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  useEffect(() => {
    if (pendingRoute.current !== pathname) return;
    pendingRoute.current = null;
    const position = () => {
      scroller.current?.resize();
      scroller.current?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    position();
    // Settle after Next's scroll handling and the new page's card setup.
    routeFrame.current = requestAnimationFrame(position);
    return () => { if (routeFrame.current !== null) cancelAnimationFrame(routeFrame.current); };
  }, [pathname]);

  useEffect(() => {
    const content = shell.current;
    if (content) content.inert = phase !== "ready";
    if (phase === "ready") {
      scroller.current?.start();
      scroller.current?.resize();
      ScrollTrigger.refresh();
    }
    return () => { if (content) content.inert = false; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "ready" || !window.location.hash) return;
    const hash = window.location.hash;
    let cancelled = false;
    let frame = 0;
    // Native fragment positioning can happen before fonts and pin spacing settle.
    // Align once after layout, unless the visitor has already started interacting.
    const interrupt = () => { cancelled = true; };
    const align = () => {
      if (cancelled || window.location.hash !== hash) return;
      let id: string;
      try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (!target) return;
      ScrollTrigger.refresh();
      scroller.current?.resize();
      // Lenis already accounts for CSS scroll-padding and scroll-margin.
      scroller.current?.scrollTo(target, { immediate: true, force: true });
    };
    window.addEventListener("wheel", interrupt, { passive: true, once: true });
    window.addEventListener("pointerdown", interrupt, { passive: true, once: true });
    window.addEventListener("keydown", interrupt, { once: true });
    void document.fonts.ready.then(() => {
      if (!cancelled) frame = requestAnimationFrame(align);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("pointerdown", interrupt);
      window.removeEventListener("keydown", interrupt);
    };
  }, [phase, pathname]);

  return <>
    <SignaturePreloader onReveal={reveal} onComplete={complete} />
    <div ref={shell} className="portfolio-shell" data-intro-phase={phase}>{children}</div>
    <noscript><style>{"#signature-intro{display:none}.portfolio-shell[data-intro-phase]{opacity:1}.portfolio-shell .hero-reveal,.portfolio-shell .project-hero-reveal{opacity:1}"}</style></noscript>
  </>;
}
