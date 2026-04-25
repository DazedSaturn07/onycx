import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { BadgeCheck, ExternalLink, Award } from "lucide-react";

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
    title: "IBM Machine Learning Professional Certificate",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Professional Certificate",
    image: "/certificates/21BCS2563_Prashant_IBM_final.webp",
    verifyUrl: "https://coursera.org/verify/professional-cert/KW27N63JG4YO",
  },
  {
    title: "Exploratory Data Analysis for Machine Learning",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/1_exploratory_data.webp",
  },
  {
    title: "Supervised Machine Learning: Regression",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/2_supervised_ml.webp",
  },
  {
    title: "Supervised Machine Learning: Classification",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/3_supervised_ml_classification.webp",
  },
  {
    title: "Unsupervised Machine Learning",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Machine Learning",
    image: "/certificates/4_unsupervised_ml.webp",
  },
  {
    title: "Deep Learning and Neural Networks",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Deep Learning",
    image: "/certificates/5_deep_learning.webp",
  },
  {
    title: "Machine Learning Capstone Project",
    issuer: "IBM / Coursera",
    date: "2024",
    category: "Applied ML",
    image: "/certificates/6_ml_capstone.webp",
  },
  {
    title: "Advanced Python Data Analysis",
    issuer: "Udemy",
    date: "2024",
    category: "Python Analytics",
    image: "/certificates/Advanced Python Data Analysis_Udemy.png",
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

  return (
    <section id="certificates" className="cinema-section cinema-certificates">
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

        <div className="cinema-certificates-layout">
          <motion.div
            key={activeCertificate.image}
            className="cinema-certificate-feature"
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: EASE }}
            data-cursor="interactive"
          >
            <div className="cinema-certificate-feature-meta">
              <span>{String(activeCertificateIndex + 1).padStart(2, "0")}</span>
              <span>{activeCertificate.category}</span>
            </div>

            <div className="cinema-certificate-frame">
              <Image
                src={activeCertificate.image}
                alt={`${activeCertificate.title} certificate`}
                fill
                sizes="(max-width: 900px) 92vw, 58vw"
                className="cinema-certificate-feature-image"
              />
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

          <div className="cinema-certificate-list" aria-label="Certificate list">
            {certificates.map((certificate, index) => (
              <button
                key={certificate.image}
                type="button"
                className={`cinema-certificate-card${activeCertificateIndex === index ? " is-active" : ""}`}
                onClick={() => setActiveCertificateIndex(index)}
                onMouseEnter={() => setActiveCertificateIndex(index)}
                data-cursor="interactive"
                aria-pressed={activeCertificateIndex === index}
              >
                <span className="cinema-certificate-card-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="cinema-certificate-card-thumb">
                  <Image
                    src={certificate.image}
                    alt=""
                    fill
                    sizes="96px"
                    className="cinema-certificate-card-image"
                  />
                </span>
                <span className="cinema-certificate-card-copy">
                  <strong>{certificate.title}</strong>
                  <small>
                    {certificate.issuer} / {certificate.date}
                  </small>
                </span>
                <Award size={17} className="cinema-certificate-card-icon" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
