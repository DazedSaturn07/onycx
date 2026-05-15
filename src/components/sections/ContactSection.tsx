import { Mail, Github, Linkedin, Download } from "lucide-react";
import Image from "next/image";
import type { SectionId } from "./HeroSection";
import AsciiWave from "../ui/AsciiWave";

const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/onycx/",
    icon: Linkedin,
  },
  {
    label: "GitHub",
    href: "https://github.com/DazedSaturn07",
    icon: Github,
  },
  {
    label: "Email",
    href: "mailto:prashants0325@gmail.com",
    icon: Mail,
  },
];

interface ContactSectionProps {
  navigateTo: (id: SectionId) => void;
}

export function ContactSection({ navigateTo }: ContactSectionProps) {
  return (
    <section 
      id="contact" 
      className="cinema-section cinema-contact"
    >
      <div className="cinema-contact-bg" aria-hidden="true">
        <Image 
          src="/cts.jpg" 
          alt="Contact Background" 
          fill 
          sizes="100vw"
          className="cinema-contact-bg-img"
        />
        <div className="cinema-contact-overlay" />
      </div>

      <div className="cinema-section-inner cinema-contact-inner">
        <p className="cinema-kicker">Contact / Open to work</p>
        
        <a
          href="mailto:prashants0325@gmail.com"
          className="cinema-contact-title"
          data-cursor="interactive"
        >
          Let&apos;s Build
        </a>

        <p className="cinema-contact-copy">
          Available for full-time roles, freelance builds, data analytics
          projects, and useful conversations about turning messy inputs into
          working systems.
        </p>

        <div className="cinema-contact-strip">
          <a href="mailto:prashants0325@gmail.com" data-cursor="interactive">
            <Mail size={15} />
            prashants0325@gmail.com
          </a>
        </div>

        <div className="cinema-socials">
          {socials.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={social.label}
                data-cursor="interactive"
              >
                <Icon size={24} />
              </a>
            );
          })}
        </div>

        <div className="cinema-contact-actions">
          <a
            href="/Prashant_Resume.pdf?v=4"
            download="Prashant_Resume.pdf"
            className="cinema-secondary-link"
            data-cursor="interactive"
          >
            <Download size={16} />
            Download CV
          </a>
          <button
            type="button"
            onClick={() => navigateTo("home")}
            className="cinema-secondary-link"
            data-cursor="interactive"
          >
            Back to start
          </button>
        </div>

        <p className="cinema-footer-line">
          Copyright 2026 Prashant Kumar Yadav - Next.js / TypeScript / Motion
        </p>

      </div>

      <div className="cinema-contact-wave" aria-hidden="true">
        <AsciiWave 
          color="#ff4d00" 
          speed={0.6} 
        />
      </div>
    </section>
  );
}
