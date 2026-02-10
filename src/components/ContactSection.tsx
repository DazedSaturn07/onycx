"use client";

import { useRef, MouseEvent } from "react";
import { Mail, Phone, Linkedin, Github, ArrowUpRight } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";

const contactCards = [
  {
    icon: <Mail size={22} />,
    label: "Email",
    value: "prashantyadav5735@gmail.com",
    href: "mailto:prashantyadav5735@gmail.com",
  },
  {
    icon: <Phone size={22} />,
    label: "Phone",
    value: "+91 88828 97545",
    href: "tel:+918882897545",
  },
  {
    icon: <Linkedin size={22} />,
    label: "LinkedIn",
    value: "Prashant Yadav",
    href: "https://linkedin.com/in/prashant-yadav",
    external: true,
  },
  {
    icon: <Github size={22} />,
    label: "GitHub",
    value: "DazedSaturn07",
    href: "https://github.com/DazedSaturn07",
    external: true,
  },
];

/**
 * ContactSection — Centered contact with glow-follow cards,
 * availability indicator, and magnetic CTA button.
 */
export default function ContactSection() {
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Magnetic effect on CTA
  const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!ctaRef.current) return;
    const rect = ctaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ctaRef.current.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (!ctaRef.current) return;
    ctaRef.current.style.transform = "translate(0, 0) scale(1)";
  };

  return (
    <section id="contact" className="py-24 md:py-36 px-4 md:px-8 relative" aria-label="Contact">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(rgba(255,140,66,0.3) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        <RevealOnScroll>
          <h2 className="font-display font-bold text-section gradient-text-static text-center mb-4">
            Let&apos;s Connect
          </h2>
          <p className="text-white/40 text-center mb-12 max-w-lg mx-auto">
            Open to opportunities, collaborations, and conversations about
            technology. Reach out anytime.
          </p>
        </RevealOnScroll>

        {/* Availability Badge */}
        <RevealOnScroll delay={0.1}>
          <div className="flex justify-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
              style={{
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-green-400/80 font-medium">Available for work</span>
            </div>
          </div>
        </RevealOnScroll>

        {/* Contact Cards Grid */}
        <RevealOnScroll delay={0.15}>
          <div className="grid sm:grid-cols-2 gap-3 mb-12">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noopener noreferrer" : undefined}
                className="glass glow-card p-5 flex items-center gap-4 group hover:translate-y-[-2px] transition-all duration-300"
              >
                <div
                  className="p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "rgba(255,140,66,0.08)" }}
                >
                  <span className="text-accent-orange">{card.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/35 mb-0.5">{card.label}</p>
                  <p className="text-sm text-white/80 font-medium truncate">
                    {card.value}
                  </p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-white/15 group-hover:text-accent-orange/60 transition-colors shrink-0"
                />
              </a>
            ))}
          </div>
        </RevealOnScroll>

        {/* CTA Button — Magnetic */}
        <RevealOnScroll delay={0.2}>
          <div className="text-center">
            <a
              ref={ctaRef}
              href="mailto:prashantyadav5735@gmail.com"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full font-bold text-white text-lg transition-all duration-300 hover:shadow-[0_0_50px_rgba(245,158,66,0.35)] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #F59E42 0%, #FF8C42 100%)",
              }}
            >
              <Mail size={20} />
              Send Me an Email
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
