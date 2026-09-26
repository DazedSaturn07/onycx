"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SignaturePreloader from "@/components/SignaturePreloader";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrolling({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "opening" | "ready">("loading");
  const shell = useRef<HTMLDivElement>(null);
  const scroller = useRef<Lenis | null>(null);
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

    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      window.removeEventListener("portfolio:scroll-to", scrollToPosition);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      scroller.current = null;
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

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

  return <>
    <SignaturePreloader onReveal={reveal} onComplete={complete} />
    <div ref={shell} className="portfolio-shell" data-intro-phase={phase}>{children}</div>
    <noscript><style>{"#signature-intro{display:none}.portfolio-shell[data-intro-phase]{opacity:1}"}</style></noscript>
  </>;
}
