import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BadgeCheck, ExternalLink } from "lucide-react";
import ThreeDImageCarousel from "@/components/ui/ThreeDImageCarousel";

export interface Certificate {
  title: string;
  issuer: string;
  date: string;
  category: string;
  image: string;
  verifyUrl?: string;
}

export const certificates: Certificate[] = [
  {
    title: "IBM Machine Learning",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Professional Certificate",
    image: "/certificates/21BCS2563_Prashant_IBM_final.webp",
    verifyUrl: "https://coursera.org/verify/professional-cert/FSFLHO1JDUI3",
  },
  {
    title: "Exploratory Data Analysis for Machine Learning",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/1_exploratory_data.webp",
    verifyUrl: "https://coursera.org/verify/4JJCUIDQNJX7",
  },
  {
    title: "Supervised Machine Learning: Regression",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/2_supervised_ml.webp",
    verifyUrl: "https://coursera.org/verify/HAC8AR37Z84K",
  },
  {
    title: "Supervised Machine Learning: Classification",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/3_supervised_ml_classification.webp",
    verifyUrl: "https://coursera.org/verify/EFYMVKCQUUGF",
  },
  {
    title: "Unsupervised Machine Learning",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/4_unsupervised_ml.webp",
    verifyUrl: "https://coursera.org/verify/91SHQNJXVDJT",
  },
  {
    title: "Deep Learning and Reinforcement Learning",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Deep Learning",
    image: "/certificates/5_deep_learning.webp",
    verifyUrl: "https://coursera.org/verify/MPPYJ6F4L3AJ",
  },
  {
    title: "Machine Learning Capstone",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Capstone Project",
    image: "/certificates/6_ml_capstone.webp",
    verifyUrl: "https://coursera.org/verify/7Y12KT9EF4QW",
  },
  {
    title: "The Ultimate Pandas Bootcamp: Advanced Python Data Analysis",
    issuer: "Udemy",
    date: "2024",
    category: "Python Analytics",
    image: "/certificates/Advanced Python Data Analysis_Udemy.png",
    verifyUrl: "https://www.udemy.com/certificate/UC-dcb2851c-8639-464c-81b2-a4a17ccfd772/",
  },
  {
    title: "Angular JS Training",
    issuer: "Infosys Springboard",
    date: "2024",
    category: "Frontend Development",
    image: "/certificates/Angula_JS_Infosys.png",
  },
];

const EASE = [0.23, 1, 0.32, 1] as const;

export function CertificatesSection() {
  const [activeCertificateIndex, setActiveCertificateIndex] = useState(0);
  const activeCertificate = certificates[activeCertificateIndex];
  const certificateSlides = certificates.map((certificate, index) => ({
    id: index + 1,
    src: certificate.image,
    href: certificate.verifyUrl ?? certificate.image,
    title: certificate.title,
  }));
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.8, 1], [0, 80]);
  const filter = useTransform(
    scrollYProgress,
    [0, 0.2, 0.85, 1],
    ["blur(10px)", "blur(0px)", "blur(0px)", "blur(12px)"]
  );

  return (
    <section
      id="certificates"
      ref={sectionRef}
      className="cinema-section cinema-certificates-scrolly"
    >
      <motion.div
        className="cinema-certificates-sticky"
        style={{ opacity, y, filter }}
      >
        <div className="cinema-section-inner cinema-certificates-inner">
          <div className="cinema-certificates-header">
            <div>
              <p className="cinema-kicker">Credentials / Verified learning</p>
              <h2 className="cinema-display-title">
                Certified <span className="cinema-outline">capability</span>
              </h2>
            </div>
            <p className="cinema-certificates-copy">
              A focused credential library across machine learning, analytics,
              Python, and frontend development. Each certificate is presented as a
              scannable proof point rather than a decorative attachment.
            </p>
          </div>

          <div className="cinema-certificates-carousel-stage">
            <ThreeDImageCarousel
              slides={certificateSlides}
              autoplay
              delay={4}
              itemCount={5}
              className="cinema-certificates-carousel"
              onActiveIndexChange={setActiveCertificateIndex}
            />

            <motion.div
              key={activeCertificate.title}
              className="cinema-certificate-carousel-info"
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: EASE }}
              data-cursor="interactive"
            >
              <div className="cinema-certificate-feature-meta cinema-certificate-carousel-meta">
                <span>{String(activeCertificateIndex + 1).padStart(2, "0")}</span>
                <span>{activeCertificate.category}</span>
              </div>

              <div className="cinema-certificate-feature-info">
                <div>
                  <h3>{activeCertificate.title}</h3>
                  <p>
                    {activeCertificate.issuer} / {activeCertificate.date}
                  </p>
                </div>
                <div className="cinema-certificate-actions">
                  {activeCertificate.verifyUrl && (
                    <a
                      href={activeCertificate.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cinema-primary-link"
                      data-cursor="interactive"
                    >
                      Verify
                      <BadgeCheck size={17} />
                    </a>
                  )}
                  <a
                    href={activeCertificate.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cinema-secondary-link"
                    data-cursor="interactive"
                  >
                    Open
                    <ExternalLink size={17} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
