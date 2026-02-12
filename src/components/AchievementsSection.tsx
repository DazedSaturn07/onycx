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
    title: "IBM Machine Learning Professional Certificate",
    issuer: "Coursera — IBM Professional Certificate",
    date: "2024",
    image: "/certificates/21BCS2563_Prashant_IBM_final.webp",
    verifyUrl: "https://coursera.org/verify/professional-cert/KW27N63JG4YO",
  },
  {
    title: "Exploratory Data Analysis for ML",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/1_exploratory_data.webp",
  },
  {
    title: "Supervised Machine Learning: Regression",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/2_supervised_ml.webp",
  },
  {
    title: "Supervised ML: Classification",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/3_supervised_ml_classification.webp",
  },
  {
    title: "Unsupervised Machine Learning",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/4_unsupervised_ml.webp",
  },
  {
    title: "Deep Learning & Neural Networks",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/5_deep_learning.webp",
  },
  {
    title: "ML Capstone Project",
    issuer: "Coursera — IBM",
    date: "2024",
    image: "/certificates/6_ml_capstone.webp",
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
            Professional certifications validating expertise in data analytics, development & cloud technologies.
          </p>
        </RevealOnScroll>

        {/* Infinite Scrolling Carousel */}
        <RevealOnScroll delay={0.1}>
          <div className="relative overflow-hidden group">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(90deg, #0b0f14, transparent)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(270deg, #0b0f14, transparent)" }} />

            <div className="flex gap-6 animate-marquee group-hover:[animation-play-state:paused] w-max">
              {[...achievements, ...achievements].map((cert, i) => (
                <div
                  key={`${cert.title}-${i}`}
                  className="w-[280px] md:w-[320px] shrink-0"
                >
                  <div className="glass h-full overflow-hidden group/card hover:translate-y-[-3px] transition-transform duration-300">
                    {/* Certificate Image */}
                    {cert.image && (
                      <div className="relative h-44 overflow-hidden">
                        <Image
                          src={cert.image}
                          alt={cert.title}
                          fill
                          className="object-cover group-hover/card:scale-105 transition-transform duration-500"
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
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
