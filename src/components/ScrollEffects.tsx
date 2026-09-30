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

      gsap.utils.toArray<HTMLElement>(".portfolio-home > .portfolio-about,.portfolio-home > .portfolio-capabilities").forEach((section) => {
        gsap.fromTo(section,
          { scale: 1 },
          {
            scale: context.conditions?.compact ? .972 : .965,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 98%",
              end: "top 18%",
              scrub: .5,
              invalidateOnRefresh: true,
              onToggle: (self) => { section.style.willChange = self.isActive ? "transform" : "auto"; },
            },
          },
        );
      });

      const signature = document.querySelector<HTMLElement>(".portfolio-signature-section");
      if (signature) {
        const ink = signature.querySelector<HTMLElement>(".portfolio-signature-ink");
        if (ink) gsap.fromTo(ink,
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            ease: "none",
            scrollTrigger: { trigger: signature, start: "top 70%", end: "bottom bottom", scrub: .4 },
          },
        );
      }
    });

    media.add("(min-width: 1025px) and (prefers-reduced-motion: no-preference)", () => {
      const hero = document.querySelector<HTMLElement>(".shatter-hero");
      const lightField = document.querySelector<HTMLElement>(".shatter-light-field");
      if (hero && lightField) {
        gsap.to(lightField, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.7 },
        });

        const sculpture = hero.querySelector<HTMLElement>(".hero-sculpture");
        if (sculpture) {
          gsap.to(sculpture, { yPercent: 10, rotation: -4, ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .7 } });
        }
      }

      const about = document.querySelector<HTMLElement>(".portfolio-about");
      const aboutImage = about?.querySelector<HTMLElement>(".portfolio-about-image");
      if (about && aboutImage) {
        gsap.fromTo(
          aboutImage,
          { yPercent: -2 },
          {
            yPercent: 2,
            ease: "none",
            scrollTrigger: { trigger: about, start: "top bottom", end: "bottom top", scrub: 0.7 },
          },
        );
      }

      gsap.utils.toArray<HTMLElement>(".project-preview").forEach((preview) => {
        const image = preview.querySelector("img");
        if (!image) return;
        gsap.fromTo(image, { yPercent: -2, scale: 1.05 }, {
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
