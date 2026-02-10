"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";
import Image from "next/image";
import RevealOnScroll from "./RevealOnScroll";

interface Achievement {
  title: string;
  issuer: string;
  date: string;
  image?: string;
  verifyUrl?: string;
}

const achievements: Achievement[] = [
  {
    title: "IBM Full Stack Software Developer",
    issuer: "Coursera — IBM Professional Certificate",
    date: "2024",
    image: "/certificates/21BCS2563_Prashant_IBM_final.webp",
    verifyUrl: "https://coursera.org/verify/professional-cert/KW27N63JG4YO",
  },
  {
    title: "Developing Front-End Apps with React",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/developing_frontend_apps_react.webp",
    verifyUrl: "https://coursera.org/verify/X7JXBK7SNFQX",
  },
  {
    title: "Introduction to Cloud Computing",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/introduction_to_cloud_computing.webp",
    verifyUrl: "https://coursera.org/verify/2Y4FHPKHSEKV",
  },
  {
    title: "Introduction to Web Development",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/introduction_to_webdevelopment.webp",
    verifyUrl: "https://coursera.org/verify/9KXCVH77KJ94",
  },
  {
    title: "Getting Started with Git and GitHub",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/getting_started_with_git_github.webp",
    verifyUrl: "https://coursera.org/verify/1XAZB5BFEJJM",
  },
  {
    title: "Developing AI Applications with Python & Flask",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/developing_ai_applications_with_python_and_flask.webp",
    verifyUrl: "https://coursera.org/verify/YT6Y1RRHMDPH",
  },
  {
    title: "Django Application Development with SQL & Databases",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/django_application_dev.webp",
    verifyUrl: "https://coursera.org/verify/H71UJK0YWCBO",
  },
  {
    title: "JavaScript Programming Essentials",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/javascript_programming_essentials.webp",
    verifyUrl: "https://coursera.org/verify/E1GBJZRR9B7I",
  },
  {
    title: "Node.js & Express - Application Development",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/nodejsandexpress.webp",
    verifyUrl: "https://coursera.org/verify/S78F0F9F48CB",
  },
  {
    title: "Intermediate Web & Front-End Development",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/intermediate_web_frontend_development.webp",
    verifyUrl: "https://coursera.org/verify/BGPCGHG5OVQ7",
  },
  {
    title: "Advanced Python Data Analysis",
    issuer: "Udemy",
    date: "2024",
    image: "/certificates/Advanced Python Data Analysis_Udemy.png",
  },
  {
    title: "Angular.js Training",
    issuer: "Infosys Springboard",
    date: "2024",
    image: "/certificates/Angula_JS_Infosys.png",
  },
];

export default function AchievementsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="achievements" className="py-24 md:py-36 px-4 md:px-8" aria-label="Achievements">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display font-bold text-section gradient-text-static text-center mb-4">
            Certifications
          </h2>
          <p className="text-white/40 text-center mb-12 max-w-xl mx-auto">
            Professional certifications validating expertise across the stack.
          </p>
        </RevealOnScroll>

        {/* Horizontal Scrolling Carousel */}
        <RevealOnScroll delay={0.1}>
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(90deg, #0b0f14, transparent)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: "linear-gradient(270deg, #0b0f14, transparent)" }} />

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {achievements.map((cert, i) => (
                <motion.div
                  key={cert.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="snap-center shrink-0 w-[280px] md:w-[320px]"
                >
                  <div className="glass h-full overflow-hidden group hover:translate-y-[-3px] transition-transform duration-300">
                    {/* Certificate Image */}
                    {cert.image && (
                      <div className="relative h-44 overflow-hidden">
                        <Image
                          src={cert.image}
                          alt={cert.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="320px"
                          loading="lazy"
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,15,20,0.6), transparent)" }} />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="p-2 rounded-lg shrink-0"
                          style={{ background: "rgba(255,140,66,0.1)" }}
                        >
                          <Award size={16} className="text-accent-orange" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white leading-snug">
                            {cert.title}
                          </h3>
                          <p className="text-[11px] text-white/35 mt-1">{cert.issuer}</p>
                          <p className="text-[10px] text-white/25 mt-0.5">{cert.date}</p>
                        </div>
                      </div>

                      {cert.verifyUrl && (
                        <a
                          href={cert.verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-accent-orange/70 hover:text-accent-orange transition-colors"
                        >
                          <ExternalLink size={10} /> Verify Certificate
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <p className="text-center text-white/20 text-xs mt-4">← Scroll to explore →</p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
