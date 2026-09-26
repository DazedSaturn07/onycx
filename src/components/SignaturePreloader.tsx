"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import SignatureMark from "@/components/ui/signature-mark";

const INTRO_KEY = "portfolio.signature-intro.v1";

type Props = { onReveal: () => void; onComplete: () => void };

export default function SignaturePreloader({ onReveal, onComplete }: Props) {
  const overlay = useRef<HTMLDivElement>(null);
  const finish = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = overlay.current;
    if (!element) return;
    let cancelled = false;
    let complete = false;
    let exiting = false;
    const animation = gsap.timeline({ paused: true, delay: .3 });
    let exit: gsap.core.Tween | undefined;
    let focusFrame = 0;
    let prepareFrame = 0;
    const previousFocus = document.activeElement as HTMLElement | null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dismiss = () => {
      if (cancelled || complete) return;
      complete = true;
      clearTimeout(safetyTimer);
      try { sessionStorage.setItem(INTRO_KEY, "seen"); } catch { /* Storage can be disabled. */ }
      setVisible(false);
      onComplete();
      if (element.contains(document.activeElement)) focusFrame = requestAnimationFrame(() => {
        (previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : document.querySelector<HTMLElement>(".shatter-wordmark"))?.focus({ preventScroll: true });
      });
    };
    const reveal = () => {
      if (cancelled || complete || exiting) return;
      exiting = true;
      animation.kill();
      onReveal();
      if (reducedMotion) dismiss();
      else exit = gsap.to(element, { opacity: 0, duration: .85, ease: "power2.inOut", onComplete: dismiss });
    };
    finish.current = reveal;
    const safetyTimer = setTimeout(reveal, 6500);

    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === "seen"; } catch { /* Still works without storage. */ }
    // Direct links and motion preferences keep visitors close to their destination.
    if (seen || reducedMotion || getComputedStyle(element).visibility === "hidden" || (window.location.hash && window.location.hash !== "#top")) {
      onReveal();
      dismiss();
      return () => { cancelled = true; cancelAnimationFrame(focusFrame); animation.kill(); };
    }

    const skip = element.querySelector<HTMLButtonElement>("button");
    focusFrame = requestAnimationFrame(() => skip?.focus({ preventScroll: true }));

    const prepare = async () => {
      // Four requests at a time keep the intro from saturating a mobile connection.
      const images = [...document.querySelectorAll<HTMLImageElement>(".portfolio-shell img")];
      const warmImages = async () => {
        let cursor = 0;
        const worker = async () => {
          while (!cancelled && !exiting && cursor < images.length) {
            const image = images[cursor++];
            image.loading = "eager";
            try { await image.decode(); } catch { /* A missing image must not block the page. */ }
          }
        };
        await Promise.all(Array.from({ length: Math.min(4, images.length) }, worker));
      };
      // Wait until sibling effects have registered their preparation listeners.
      prepareFrame = requestAnimationFrame(() => {
        if (!cancelled && !exiting) window.dispatchEvent(new Event("portfolio:prepare"));
      });
      await Promise.allSettled([document.fonts.ready, warmImages()]);
    };

    const strokes = [...element.querySelectorAll<SVGPathElement>("[data-signature-stroke]")];
    gsap.set(strokes, { strokeDashoffset: 1 });
    strokes.forEach((stroke, index) => {
      if (index === 8) animation.to({}, { duration: .18 });
      animation.set(stroke, { opacity: 1 });
      animation.to(stroke, {
        strokeDashoffset: 0,
        autoRound: false,
        duration: index === 0 ? .62 : index === 8 ? .45 : .15,
        ease: "none",
      });
    });
    animation.to(".intro-signature-rule", { scaleX: 1, duration: .45, ease: "power2.out" });
    animation.call(() => { element.dataset.signatureWritten = "true"; });
    animation.to({}, { duration: .35 });
    const written = new Promise<void>((resolve) => animation.eventCallback("onComplete", resolve));
    animation.play();
    void Promise.allSettled([prepare(), written]).then(() => {
      if (!cancelled) reveal();
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      cancelAnimationFrame(focusFrame);
      cancelAnimationFrame(prepareFrame);
      animation.kill();
      exit?.kill();
    };
  }, [onReveal, onComplete]);

  if (!visible) return null;

  return (
    <div ref={overlay} id="signature-intro" className="signature-preloader" role="dialog" aria-modal="true" aria-label="Welcome to Prashant Yadav's portfolio" data-lenis-prevent onKeyDown={(event) => {
      if (event.key === "Escape") finish.current();
      if (event.key === "Tab" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        overlay.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }}>
      <span className="intro-edition" aria-hidden="true">PY / PORTFOLIO 2026</span>
      <div className="intro-center">
        <p className="intro-eyebrow">A personal touch.</p>
        <SignatureMark />
        <div className="intro-signature-rule" aria-hidden="true" />
        <p className="intro-caption" role="status">Thoughtfully made. Ready to explore.</p>
      </div>
      <span className="intro-location" aria-hidden="true">Crafted in India.</span>
      <button type="button" className="intro-skip" onClick={() => finish.current()}>Skip intro <span aria-hidden="true">↗</span></button>
    </div>
  );
}
