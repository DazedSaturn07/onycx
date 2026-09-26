"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { certificates } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger);

export default function CertificateCarousel() {
  const stage = useRef<HTMLDivElement>(null);
  const scrollSequence = useRef<ScrollTrigger | null>(null);
  const activeIndex = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = stage.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(min-height: 550px) and (prefers-reduced-motion: no-preference)", () => {
      root.dataset.motion = "true";
      const cards = gsap.utils.toArray<HTMLElement>(".certificate-slide", root);
      const links = cards.map((card) => card.querySelector("a"));
      const transforms = cards.map((card) => (value: string) => { card.style.transform = value; });
      const opacities = cards.map((card) => (value: number) => { card.style.opacity = String(value); });
      const visibleCards = cards.map(() => false);
      const position = { value: 0 };
      let previousNearest = -1;
      let cardWidth = cards[0]?.offsetWidth ?? 0;
      let verticalStep = root.clientWidth < 760 ? 17 : 29;
      gsap.set(cards, { autoAlpha: 0 });
      const draw = () => {
        const nearest = Math.round(position.value);
        if (nearest !== activeIndex.current) {
          activeIndex.current = nearest;
          setActive(nearest);
        }
        const changedSelection = nearest !== previousNearest;
        cards.forEach((card, index) => {
          const delta = index - position.value;
          const distance = Math.abs(delta);
          const visible = distance < 3.2;
          if (visible !== visibleCards[index] || previousNearest === -1) {
            card.style.visibility = visible ? "visible" : "hidden";
            card.setAttribute("aria-hidden", String(!visible));
            if (!visible) opacities[index](0);
            visibleCards[index] = visible;
          }
          if (changedSelection) {
            card.style.zIndex = String(10 - Math.round(distance * 2));
            if (links[index]) links[index]!.tabIndex = index === nearest ? 0 : -1;
          }
          if (!visible) return;
          const x = delta * cardWidth * .84;
          const y = Math.pow(Math.min(distance, 4), 1.6) * verticalStep;
          transforms[index](`translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(delta * 11).toFixed(2)}deg) rotateY(${(delta * -5).toFixed(2)}deg) scale(${Math.max(.64, 1 - distance * .07).toFixed(4)})`);
          opacities[index](Math.max(.22, 1 - distance * .23));
        });
        previousNearest = nearest;
      };
      draw();
      const tween = gsap.to(position, {
        value: certificates.length - 1,
        ease: "none",
        onUpdate: draw,
        scrollTrigger: {
          trigger: root,
          start: "top top+=96",
          end: () => `+=${(certificates.length - 1) * Math.max(260, window.innerHeight * .42)}`,
          pin: true,
          scrub: .6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onToggle: (self) => cards.forEach((card) => { card.style.willChange = self.isActive ? "transform, opacity" : "auto"; }),
          onRefresh: () => {
            cardWidth = cards[0]?.offsetWidth ?? 0;
            verticalStep = root.clientWidth < 760 ? 17 : 29;
            draw();
          },
        },
      });
      scrollSequence.current = tween.scrollTrigger ?? null;
      return () => {
        scrollSequence.current = null;
        delete root.dataset.motion;
        cards.forEach((card) => {
          card.style.removeProperty("transform");
          card.style.removeProperty("opacity");
          card.style.removeProperty("visibility");
          card.style.removeProperty("z-index");
          card.style.removeProperty("will-change");
          card.removeAttribute("aria-hidden");
          const link = card.querySelector("a");
          if (link) link.tabIndex = 0;
        });
      };
    });
    return () => media.revert();
  }, []);

  const navigate = (index: number) => {
    const next = Math.max(0, Math.min(certificates.length - 1, index));
    const sequence = scrollSequence.current;
    if (sequence) {
      const y = sequence.start + (sequence.end - sequence.start) * next / (certificates.length - 1);
      window.dispatchEvent(new CustomEvent("portfolio:scroll-to", { detail: y }));
    } else {
      stage.current?.querySelectorAll<HTMLElement>(".certificate-slide")[next]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      activeIndex.current = next;
      setActive(next);
    }
  };

  return (
    <div ref={stage} className="certificate-carousel" role="region" aria-roledescription="carousel" aria-label="Certification collection"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          navigate(activeIndex.current + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
      onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={(event) => {
        if (touchStart.current !== null && scrollSequence.current) {
          const delta = event.changedTouches[0].clientX - touchStart.current.x;
          const vertical = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(delta) > 45 && Math.abs(delta) > Math.abs(vertical)) navigate(activeIndex.current + (delta < 0 ? 1 : -1));
        }
        touchStart.current = null;
      }}>
      <div className="certificate-carousel-label"><span>Learning, in motion</span><a href="#contact">Continue to contact <ArrowUpRight size={14} aria-hidden="true" /></a></div>
      <div className="certificate-carousel-cards" onScroll={(event) => {
        if (scrollSequence.current) return;
        const rail = event.currentTarget;
        const cards = Array.from(rail.querySelectorAll<HTMLElement>(".certificate-slide"));
        const nearest = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - rail.scrollLeft) < Math.abs(cards[best].offsetLeft - rail.scrollLeft) ? index : best, 0);
        if (nearest !== activeIndex.current) { activeIndex.current = nearest; setActive(nearest); }
      }}>
        {certificates.map((certificate, index) => (
          <article className="certificate-slide" key={certificate.title} aria-roledescription="slide" aria-label={`${index + 1} of ${certificates.length}: ${certificate.title}`}>
            <a href={certificate.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${certificate.title} credential`} onClick={(event) => {
              if (scrollSequence.current && index !== activeIndex.current) { event.preventDefault(); navigate(index); }
            }}>
              <Image src={certificate.image} alt={`${certificate.title} certificate`} fill sizes="(max-width: 760px) 70vw, 420px" />
              <span className="certificate-slide-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className="certificate-slide-copy"><span>{certificate.issuer} · {certificate.year}</span><h3>{certificate.title}</h3><span className="certificate-slide-link">View credential <ArrowUpRight size={15} aria-hidden="true" /></span></div>
            </a>
          </article>
        ))}
      </div>
      <div className="certificate-carousel-controls">
        <button type="button" aria-label="Previous certificate" disabled={active === 0} onClick={() => navigate(activeIndex.current - 1)}><ArrowLeft size={18} aria-hidden="true" /></button>
        <p aria-live="polite" aria-atomic="true"><span>{String(active + 1).padStart(2, "0")}</span> / {String(certificates.length).padStart(2, "0")}</p>
        <button type="button" aria-label="Next certificate" disabled={active === certificates.length - 1} onClick={() => navigate(activeIndex.current + 1)}><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
      <p className="certificate-carousel-hint">Scroll to explore · Swipe or use the arrows</p>
    </div>
  );
}
