import { Mail, Phone, Download, Github, Linkedin } from "lucide-react";
import type { SectionId } from "./HeroSection";

const socials = [
  {
    label: "GitHub",
    href: "https://github.com/DazedSaturn07",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/onycx",
    icon: Linkedin,
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
    <section id="contact" className="cinema-section cinema-contact">
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
          <a href="tel:+919170787018" data-cursor="interactive">
            <Phone size={15} />
            +91 9170787018
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
            href="/Prashant_Resume.pdf?v=2"
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
    </section>
  );
}
