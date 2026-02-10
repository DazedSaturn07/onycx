"use client";

import { ArrowUp, Github, Linkedin, Mail } from "lucide-react";

/**
 * Footer — Minimal with animated gradient top border,
 * social links, and back-to-top button.
 */
export default function Footer() {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative pt-16 pb-8 px-4 md:px-8" aria-label="Footer">
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,140,66,0.3), rgba(245,158,66,0.3), transparent)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Back to top */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleBackToTop}
            className="group p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-[0_0_24px_rgba(255,140,66,0.2)]"
            style={{
              background: "rgba(255,140,66,0.06)",
              border: "1px solid rgba(255,140,66,0.15)",
            }}
            aria-label="Back to top"
          >
            <ArrowUp
              size={18}
              className="text-accent-orange group-hover:translate-y-[-2px] transition-transform"
            />
          </button>
        </div>

        {/* Social Row */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { icon: <Github size={18} />, href: "https://github.com/DazedSaturn07", label: "GitHub" },
            { icon: <Linkedin size={18} />, href: "https://linkedin.com/in/prashant-yadav", label: "LinkedIn" },
            { icon: <Mail size={18} />, href: "mailto:prashantyadav5735@gmail.com", label: "Email" },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target={social.href.startsWith("http") ? "_blank" : undefined}
              rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={social.label}
              className="p-2.5 rounded-full text-white/25 hover:text-accent-orange transition-all duration-300 hover:bg-white/5"
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center space-y-1">
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} Prashant Kumar Yadav. All rights reserved.
          </p>
          <p className="text-white/10 text-[10px]">
            Built with Next.js 14 · TypeScript · Tailwind · Framer Motion
          </p>
        </div>
      </div>
    </footer>
  );
}
