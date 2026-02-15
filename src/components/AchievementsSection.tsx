"use client";



import RevealOnScroll from "./RevealOnScroll";
import ThreeDImageCarousel from "./ThreeDImageCarousel";

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

        <RevealOnScroll delay={0.1}>
          <div className="relative z-10">
            <ThreeDImageCarousel
              slides={achievements.map((cert, index) => ({
                id: index,
                src: cert.image || "",
                href: cert.verifyUrl || "#",
              }))}
              autoplay={true}
              delay={3}
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
