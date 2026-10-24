"use client";

import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { certificates } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function CertificateCarousel() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const axis = useRef<HTMLDivElement>(null);
  const center = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const rail = useRef<HTMLOListElement>(null);
  const sequence = useRef<ScrollTrigger | null>(null);
  const activeIndex = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = root.current;
    const surface = stage.current;
    if (!section || !surface) return;
    const media = gsap.matchMedia();
    // The ring-to-drum geometry follows Dyvoult's Works Wheel.
    media.add("(min-width: 800px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)", () => {
      section.dataset.motion = "true";
      const model = { turn: 0 };
      let disposed = false;
      let cardHeight = 0;
      let cardWidth = 0;
      const draw = () => {
        const morph = clamp(model.turn, 0, 1);
        const position = Math.max(0, model.turn - 1);
        const drumRadius = cardHeight * 2.22;
        const ringRadius = cardHeight * 1.14;
        const ringScale = clamp((2 * Math.PI * ringRadius / certificates.length) * .82 / (cardWidth || 1), .16, 1);
        surface.dataset.mode = morph < .5 ? "ring" : "drum";
        if (axis.current) axis.current.style.transform = `translateZ(${-morph * drumRadius}px)`;
        cards.current.forEach((card, index) => {
          if (!card) return;
          const delta = index - position;
          const degrees = delta * 40;
          const radians = degrees * Math.PI / 180;
          const culled = morph > .5 && Math.abs(delta) > 1.6;
          Object.assign(card.style, {
            transform: `translateX(${-morph * cardHeight * 1.82 * (1 - Math.cos(radians))}px) rotateZ(${(1 - morph) * delta * 360 / certificates.length}deg) translateY(${-(1 - morph) * ringRadius}px) rotateX(${morph * degrees}deg) translateZ(${morph * drumRadius}px)`,
            visibility: culled ? "hidden" : "visible",
            zIndex: String(Math.round(100 - Math.abs(delta) * 2)),
          });
          card.tabIndex = morph < .5 || Math.round(position) === index ? 0 : -1;
          card.setAttribute("aria-hidden", String(culled));
          const face = card.firstElementChild as HTMLElement | null;
          if (face) face.style.transform = `scale(${ringScale + (1 - ringScale) * morph})`;
        });
        if (center.current) center.current.style.opacity = String(1 - morph);
        if (detail.current) {
          detail.current.style.opacity = String(morph);
          detail.current.style.visibility = morph > .5 ? "visible" : "hidden";
        }
        const next = clamp(Math.round(position), 0, certificates.length - 1);
        if (next !== activeIndex.current) {
          activeIndex.current = next;
          setActive(next);
        }
      };
      const resize = () => {
        cardHeight = Math.min(surface.clientHeight * .33, surface.clientWidth * .22);
        cardWidth = cardHeight * 1.45;
        surface.style.perspective = `${cardHeight * 2.7}px`;
        cards.current.forEach((card) => {
          if (card) Object.assign(card.style, { width: `${cardWidth}px`, height: `${cardHeight}px`, marginLeft: `${-cardWidth / 2}px`, marginTop: `${-cardHeight / 2}px` });
        });
        draw();
      };
      const tween = gsap.to(model, {
        turn: certificates.length,
        ease: "none",
        onUpdate: draw,
        scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: .65, invalidateOnRefresh: true, onRefresh: resize },
      });
      sequence.current = tween.scrollTrigger ?? null;
      const observer = new ResizeObserver(resize);
      observer.observe(surface);
      resize();
      void document.fonts.ready.then(() => {
        if (!disposed) { resize(); ScrollTrigger.refresh(); }
      });
      return () => {
        disposed = true;
        observer.disconnect();
        sequence.current = null;
        delete section.dataset.motion;
        delete surface.dataset.mode;
        surface.style.removeProperty("perspective");
        axis.current?.style.removeProperty("transform");
        cards.current.forEach((card) => {
          if (!card) return;
          card.removeAttribute("style");
          card.removeAttribute("aria-hidden");
          card.tabIndex = 0;
          card.firstElementChild?.removeAttribute("style");
        });
        center.current?.removeAttribute("style");
        detail.current?.removeAttribute("style");
      };
    });
    return () => media.revert();
  }, []);

  const navigate = (index: number) => {
    const next = clamp(index, 0, certificates.length - 1);
    const trigger = sequence.current;
    if (trigger) {
      window.dispatchEvent(new CustomEvent("portfolio:scroll-to", { detail: trigger.start + (trigger.end - trigger.start) * (next + 1) / certificates.length }));
    } else {
      const list = rail.current;
      const card = list?.children[next] as HTMLElement | undefined;
      if (list && card) list.scrollTo({ left: card.offsetLeft - list.offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      activeIndex.current = next;
      setActive(next);
    }
  };

  return (
    <section ref={root} id="credentials" className="portfolio-section portfolio-credentials certificate-wheel-section" aria-labelledby="credentials-heading">
      <div className="certificate-wheel-sticky" onKeyDown={(event) => {
        if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && !(event.target instanceof HTMLButtonElement)) {
          event.preventDefault();
          navigate(activeIndex.current + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}>
        <div className="certificate-wheel-top">
          <div><p className="portfolio-section-kicker">05 / Credentials</p><h2 id="credentials-heading">Learning in <span>motion.</span></h2></div>
          <a href="#contact">Continue to contact <ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
        <div ref={stage} className="certificate-wheel-stage" role="region" aria-label="Scroll-driven certification collection">
          <div ref={axis} className="certificate-wheel-axis">
            {certificates.map((certificate, index) => (
              <a key={certificate.title} ref={(node) => { cards.current[index] = node; }} className="certificate-wheel-card" href={certificate.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${certificate.title} credential`}>
                <span className="certificate-wheel-face"><Image src={certificate.image} alt={`${certificate.title} certificate`} fill sizes="(max-width: 1100px) 34vw, 500px" /><span className="certificate-wheel-hover">View credential <ArrowUpRight size={14} aria-hidden="true" /></span></span>
              </a>
            ))}
          </div>
          <div ref={center} className="certificate-wheel-center">Always curious.<br /><span>Always learning.</span><small>Scroll to turn <ArrowDown size={13} aria-hidden="true" /></small></div>
          <div ref={detail} className="certificate-wheel-detail">
            <span>{String(active + 1).padStart(2, "0")} / {String(certificates.length).padStart(2, "0")}</span>
            <h3>{certificates[active].title}</h3><p>{certificates[active].issuer} · {certificates[active].year}</p>
            <a href={certificates[active].url} target="_blank" rel="noopener noreferrer">View credential <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <ol className="certificate-wheel-index" aria-label="Choose a certificate">{certificates.map((certificate, index) => <li key={certificate.title}><button type="button" onClick={() => navigate(index)} aria-current={index === active ? "true" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{certificate.title}</button></li>)}</ol>
        </div>
        <ol ref={rail} className="certificate-wheel-mobile" aria-label="Certification collection" data-lenis-prevent-wheel onScroll={(event) => {
          const list = event.currentTarget;
          const items = Array.from(list.children) as HTMLElement[];
          const nearest = items.reduce((best, card, index) => Math.abs(card.offsetLeft - list.offsetLeft - list.scrollLeft) < Math.abs(items[best].offsetLeft - list.offsetLeft - list.scrollLeft) ? index : best, 0);
          if (nearest !== activeIndex.current) { activeIndex.current = nearest; setActive(nearest); }
        }}>
          {certificates.map((certificate, index) => <li key={certificate.title}><a href={certificate.url} target="_blank" rel="noopener noreferrer"><div className="certificate-mobile-art"><Image src={certificate.image} alt={`${certificate.title} certificate`} fill sizes="(max-width: 799px) 80vw, 600px" /></div><span>{String(index + 1).padStart(2, "0")} / {certificate.issuer} · {certificate.year}</span><h3>{certificate.title}</h3><span className="certificate-mobile-link">View credential <ArrowUpRight size={16} aria-hidden="true" /></span></a></li>)}
        </ol>
        <div className="certificate-wheel-bottom"><p>Courses, curiosity &amp; continued practice.</p><div className="certificate-wheel-controls"><button type="button" aria-label="Previous certificate" disabled={active === 0} onClick={() => navigate(activeIndex.current - 1)}><ArrowLeft size={18} aria-hidden="true" /></button><p aria-live="polite" aria-atomic="true"><span>{String(active + 1).padStart(2, "0")}</span> / {String(certificates.length).padStart(2, "0")}</p><button type="button" aria-label="Next certificate" disabled={active === certificates.length - 1} onClick={() => navigate(activeIndex.current + 1)}><ArrowRight size={18} aria-hidden="true" /></button></div></div>
      </div>
    </section>
  );
}
