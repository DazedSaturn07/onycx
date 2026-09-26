"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollEffects() {
  useEffect(() => {
    const media = gsap.matchMedia();

    media.add({
      motion: "(prefers-reduced-motion: no-preference)",
      compact: "(max-width: 1024px)",
    }, (context) => {
      if (!context.conditions?.motion) return;
      const revealItems = gsap.utils.toArray<HTMLElement>("[data-reveal]");

      revealItems.forEach((element, index) => {
        const direction = element.dataset.revealSide === "left" ? -1 : element.dataset.revealSide === "right" ? 1 : 0;
        const offset = context.conditions?.compact ? 16 : 42;

        gsap.fromTo(
          element,
          { autoAlpha: 0, x: direction * offset, y: 22 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.72,
            delay: (index % 3) * 0.035,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: element, start: "top 88%", once: true, fastScrollEnd: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-scroll-highlight]").forEach((text) => {
        gsap.fromTo(text.querySelectorAll(".scroll-highlight-word"),
          { opacity: .4 },
          { opacity: 1, stagger: .12, ease: "none", scrollTrigger: {
            trigger: text, start: "top 82%", end: "bottom 42%", scrub: .5,
          } },
        );
      });
    });

    media.add("(min-width: 1025px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.to(".shatter-light-field", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: ".shatter-hero", start: "top top", end: "bottom top", scrub: 0.7 },
      });

      gsap.fromTo(
        ".portfolio-about-image",
        { yPercent: -2 },
        {
          yPercent: 2,
          ease: "none",
          scrollTrigger: { trigger: ".portfolio-about", start: "top bottom", end: "bottom top", scrub: 0.7 },
        },
      );

      gsap.to(".hero-sculpture", { yPercent: 10, rotation: -4, ease: "none",
        scrollTrigger: { trigger: ".shatter-hero", start: "top top", end: "bottom top", scrub: .7 } });

      gsap.utils.toArray<HTMLElement>(".project-preview").forEach((preview) => {
        gsap.fromTo(preview.querySelector("img"), { yPercent: -2, scale: 1.05 }, {
          yPercent: 2, scale: 1.05, ease: "none",
          scrollTrigger: { trigger: preview, start: "top bottom", end: "bottom top", scrub: .6 },
        });
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    const footer = document.querySelector(".cinematic-footer");
    const loopObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    });
    if (footer) loopObserver.observe(footer);
    let mounted = true;
    const refreshFrame = requestAnimationFrame(refresh);
    window.addEventListener("load", refresh, { once: true });
    document.fonts?.ready.then(() => {
      if (mounted) refresh();
    });
    return () => {
      mounted = false;
      cancelAnimationFrame(refreshFrame);
      window.removeEventListener("load", refresh);
      loopObserver.disconnect();
      media.revert();
    };
  }, []);

  return null;
}
