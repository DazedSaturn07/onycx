export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  summary: string;
  focus: string;
  role: string;
  year: string;
  tech: string[];
  liveUrl: string;
  image: string;
}

export const projects: PortfolioProject[] = [
  {
    id: "scotia-delights",
    title: "Scotia Delights",
    category: "Commerce / Food",
    summary: "A premium bakery and hamper storefront shaped around product discovery, gifting clarity, and a fast mobile buying path.",
    focus: "Commerce storytelling, responsive product presentation, and a direct path from browsing to enquiry.",
    role: "Web design & frontend",
    year: "2026",
    tech: ["Next.js", "TypeScript", "Motion"],
    liveUrl: "https://www.scotiadelights.in/",
    image: "/images/Scotia.avif",
  },
  {
    id: "luxar",
    title: "Luxar",
    category: "Luxury / Editorial",
    summary: "A high-contrast interior product experience with cinematic pacing, editorial type, and image-led storytelling.",
    focus: "A luxury visual system that keeps the product—not the interface—at the centre of the experience.",
    role: "Art direction & interaction",
    year: "2026",
    tech: ["Next.js", "TypeScript", "GSAP"],
    liveUrl: "https://luxar.vercel.app/",
    image: "/images/Luxe.avif",
  },
  {
    id: "clean-ai",
    title: "Clean AI",
    category: "AI / SaaS",
    summary: "A technical product site that turns an abstract AI offer into a clear, credible, and navigable product story.",
    focus: "Feature hierarchy, developer-facing clarity, and a concise route to product understanding.",
    role: "Product narrative & UI",
    year: "2026",
    tech: ["Next.js", "React", "TypeScript"],
    liveUrl: "https://clean-ai-psi.vercel.app/",
    image: "/images/CleanAi.avif",
  },
  {
    id: "rs-staging",
    title: "RS Staging",
    category: "Architecture / Services",
    summary: "A restrained staging portfolio built around spatial imagery, clear services, and low-friction contact paths.",
    focus: "Responsive galleries, service clarity, and visual pacing for a high-consideration business.",
    role: "Portfolio design & build",
    year: "2025",
    tech: ["React", "Responsive media", "Netlify"],
    liveUrl: "https://rsstaging.netlify.app/",
    image: "/images/RSStaging.avif",
  },
  {
    id: "hortic",
    title: "Hortic",
    category: "Industry / Environment",
    summary: "A modern horticulture presence balancing practical industry communication with a fresh visual identity.",
    focus: "Information architecture, responsive composition, and a credible technical-organic brand language.",
    role: "Brand system & web",
    year: "2025",
    tech: ["React", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://hortic.netlify.app/",
    image: "/images/Hortic.avif",
  },
  {
    id: "interior-design-la",
    title: "Interior Design LA",
    category: "Studio / Portfolio",
    summary: "A visual-first studio site with immersive project imagery, refined contrast, and an editorial portfolio rhythm.",
    focus: "High-resolution image delivery, mobile galleries, and a presentation system suited to spatial work.",
    role: "Visual design & frontend",
    year: "2025",
    tech: ["React", "CSS Grid", "Motion"],
    liveUrl: "https://interiordesignla.netlify.app/",
    image: "/images/3d_DesignLA.avif",
  },
];

export const capabilityGroups = [
  {
    index: "01",
    title: "Data intelligence",
    copy: "Turning raw data into decision-ready analysis, repeatable reporting, and business-facing evidence.",
    skills: ["Python", "Pandas", "SQL", "Power BI", "Excel", "Data modelling"],
  },
  {
    index: "02",
    title: "Applied machine learning",
    copy: "Building and evaluating practical predictive workflows with a clear link between model output and action.",
    skills: ["Scikit-learn", "TensorFlow", "EDA", "Feature engineering", "Model evaluation"],
  },
  {
    index: "03",
    title: "Creative engineering",
    copy: "Designing responsive interfaces where typography, interaction, performance, and implementation work as one system.",
    skills: ["Next.js", "React", "TypeScript", "GSAP", "Lenis", "Design systems"],
  },
];

export const certificates = [
  { title: "IBM Machine Learning Specialization", issuer: "IBM / Coursera", year: "2024", image: "/certificates/21BCS2563_Prashant_IBM_final.webp", url: "https://coursera.org/verify/professional-cert/FSFLHO1JDUI3" },
  { title: "Exploratory Data Analysis for ML", issuer: "IBM / Coursera", year: "2024", image: "/certificates/1_exploratory_data.webp", url: "https://coursera.org/verify/4JJCUIDQNJX7" },
  { title: "Supervised ML: Regression", issuer: "IBM / Coursera", year: "2024", image: "/certificates/2_supervised_ml.webp", url: "https://coursera.org/verify/HAC8AR37Z84K" },
  { title: "Supervised ML: Classification", issuer: "IBM / Coursera", year: "2024", image: "/certificates/3_supervised_ml_classification.webp", url: "https://coursera.org/verify/EFYMVKCQUUGF" },
  { title: "Unsupervised Machine Learning", issuer: "IBM / Coursera", year: "2024", image: "/certificates/4_unsupervised_ml.webp", url: "https://coursera.org/verify/91SHQNJXVDJT" },
  { title: "Deep Learning & Reinforcement Learning", issuer: "IBM / Coursera", year: "2024", image: "/certificates/5_deep_learning.webp", url: "https://coursera.org/verify/MPPYJ6F4L3AJ" },
  { title: "Machine Learning Capstone", issuer: "IBM / Coursera", year: "2024", image: "/certificates/6_ml_capstone.webp", url: "https://coursera.org/verify/7Y12KT9EF4QW" },
  { title: "Advanced Python Data Analysis", issuer: "Udemy", year: "2024", image: "/certificates/Advanced Python Data Analysis_Udemy.png", url: "https://www.udemy.com/certificate/UC-dcb2851c-8639-464c-81b2-a4a17ccfd772/" },
  { title: "Frontend Engineering & Angular", issuer: "Infosys Springboard", year: "2024", image: "/certificates/Angula_JS_Infosys.png", url: "/certificates/Angula_JS_Infosys.png" },
];

export const profile = {
  name: "Prashant Yadav",
  githubUsername: "DazedSaturn07",
  role: "Data analyst & creative developer",
  location: "India · open to remote and relocation",
  email: process.env.NEXT_PUBLIC_EMAIL || "prashants0325@gmail.com",
  linkedin: "https://www.linkedin.com/in/onycx/",
  github: "https://github.com/DazedSaturn07",
  resume: "/Prashant_res.pdf",
};
