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
    const animation = gsap.timeline({ paused: true });
    let exit: gsap.core.Tween | undefined;
    let prepareFrame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dismiss = () => {
      if (cancelled || complete) return;
      complete = true;
      clearTimeout(safetyTimer);
      try { sessionStorage.setItem(INTRO_KEY, "seen"); } catch { /* Storage can be disabled. */ }
      if (element.contains(document.activeElement)) {
        (document.activeElement as HTMLElement | null)?.blur();
      }
      setVisible(false);
      onComplete();
    };

    const reveal = () => {
      if (cancelled || complete || exiting) return;
      exiting = true;
      animation.kill();
      onReveal();
      if (reducedMotion) dismiss();
      else exit = gsap.to(element, { opacity: 0, duration: .75, ease: "power2.inOut", onComplete: dismiss });
    };

    finish.current = reveal;
    const safetyTimer = setTimeout(reveal, 5500);

    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === "seen"; } catch { /* Still works without storage. */ }
    if (seen || reducedMotion || getComputedStyle(element).visibility === "hidden" || (window.location.hash && window.location.hash !== "#top")) {
      onReveal();
      dismiss();
      return () => { cancelled = true; clearTimeout(safetyTimer); animation.kill(); };
    }

    const ink = element.querySelector<HTMLElement>("[data-signature-ink]");
    if (ink) {
      gsap.set(ink, { clipPath: "inset(0 100% 0 0)" });
      animation.to(ink, {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.65,
        ease: "power2.inOut",
      });
      animation.to({}, { duration: .4 });
    }

    const prepare = () => {
      prepareFrame = requestAnimationFrame(() => {
        if (!cancelled && !exiting) window.dispatchEvent(new Event("portfolio:prepare"));
      });
      const fontFamily = ink ? getComputedStyle(ink).fontFamily : "";
      const loadSignatureFont = fontFamily && document.fonts?.load
        ? document.fonts.load(`400 48px ${fontFamily}`).catch(() => undefined)
        : Promise.resolve();
      const ready = Promise.all([loadSignatureFont, document.fonts?.ready ?? Promise.resolve()]);
      return Promise.race([
        ready,
        new Promise((resolve) => setTimeout(resolve, 450)),
      ]);
    };

    const written = new Promise<void>((resolve) => {
      if (!ink) resolve();
      else animation.eventCallback("onComplete", resolve);
    });

    void prepare().then(() => {
      if (cancelled) return;
      if (ink) animation.play();
      return written;
    }).then(() => {
      if (!cancelled) reveal();
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      cancelAnimationFrame(prepareFrame);
      animation.kill();
      exit?.kill();
    };
  }, [onReveal, onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={overlay}
      id="signature-intro"
      className="signature-preloader"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Prashant Yadav's portfolio"
      tabIndex={-1}
      data-lenis-prevent
      onKeyDown={(event) => {
        if (event.key === "Escape") finish.current();
        if (event.key === "Tab" && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          overlay.current?.querySelector<HTMLButtonElement>(".intro-skip")?.focus();
        }
      }}
    >
      <div className="intro-center">
        <SignatureMark />
      </div>
      <button type="button" className="intro-skip" onClick={() => finish.current()}>
        Skip intro <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
