export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  summary: string;
  outcome: string;
  focus: string;
  role: string;
  year: string;
  tech: string[];
  liveUrl: string;
  image: string;
}

const webCatalog: PortfolioProject[] = [
  {
    id: "scotia-delights",
    outcome:
      "A published e-commerce storefront for handcrafted laddoos and roasted makhana with product browsing, flavour discovery and direct ordering.",
    title: "Scotia Delights",
    category: "Commerce / Food",
    summary:
      "An online shop for ScotiaDelights' small-batch Indian snacks — date laddoos, dry-fruit laddoos, coconut laddoos and roasted makhana — with product cards, ingredient details and delivery across India.",
    focus:
      "Product-led storytelling, flavour browsing, mobile-first buying path and an approachable brand voice for artisan food.",
    role: "Web design & frontend",
    year: "2026",
    tech: ["Next.js", "TypeScript", "Motion"],
    liveUrl: "https://www.scotiadelights.in/",
    image: "/images/scotia.webp",
  },
  {
    id: "aurora-vault",
    outcome:
      "A cinematic dark-theme portfolio template with a scroll-driven frame-sequence hero, seven immersive scenes and 60 fps motion throughout.",
    title: "Aurora Vault",
    category: "3D / Interactive",
    summary:
      "A premium portfolio template featuring a cosmic hooded-figure hero with frame-sequence scroll animation, featured-work showcase, career timeline, tech stack section and a vertical left-rail navigation.",
    focus:
      "Scroll-choreographed storytelling, frame-led visual pacing, editorial serif typography and reduced-motion accessibility fallbacks.",
    role: "Interactive direction & frontend",
    year: "2026",
    tech: ["Next.js", "TypeScript", "GSAP", "Motion"],
    liveUrl: "https://orb-port.netlify.app/",
    image: "/images/3d-portfolio.webp",
  },
  {
    id: "clean-ai",
    outcome:
      "A published SaaS product site for CleanIQ — an AI dataset cleaner for CSV and TSV files — with feature walkthrough, pricing tiers and a docs entry point.",
    title: "Clean AI",
    category: "AI / SaaS",
    summary:
      "A product-marketing site for CleanIQ that explains its AI-powered data profiling, quality scoring, interactive audit and one-click export workflow for analysis-ready datasets.",
    focus:
      "Feature hierarchy, pricing clarity, trust-building social proof and a direct path from landing to free trial.",
    role: "Product narrative & UI",
    year: "2026",
    tech: ["Next.js", "React", "TypeScript"],
    liveUrl: "https://clean-ai-psi.vercel.app/",
    image: "/images/CleanAi.webp",
  },
  {
    id: "rs-staging",
    outcome:
      "A published home-staging studio site for The Staging Studio in Hoboken, NJ & NYC, with service pages, a styled-room collection and a contact path.",
    title: "RS Staging",
    category: "Interiors / Services",
    summary:
      "A warm, editorial website for a home-staging and interior-styling studio that showcases staged living rooms, bedrooms, kitchens and dining spaces with before-and-after storytelling and a 'Let's talk' enquiry flow.",
    focus:
      "Spatial imagery pacing, service breakdown (home staging, occupied styling, interior direction) and a soft, approachable brand feel.",
    role: "Portfolio design & build",
    year: "2025",
    tech: ["React", "Responsive media", "Netlify"],
    liveUrl: "https://rsstaging.netlify.app/",
    image: "/images/RSStaging.webp",
  },
  {
    id: "hortic",
    outcome:
      "A published landscape and horticulture company site with service pages for design, arbor care, lawn care and lighting, plus a process walkthrough.",
    title: "Hortic",
    category: "Landscape / Services",
    summary:
      "A modern website for a South Florida horticulture business covering landscape design, arbor care, custom lawn care and landscape lighting, with a garden-edit gallery and a step-by-step process section.",
    focus:
      "Service clarity, nature-forward visual identity, responsive composition and a direct enquiry path for homeowners.",
    role: "Brand system & web",
    year: "2025",
    tech: ["React", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://hortic.netlify.app/",
    image: "/images/hortic.webp",
  },
  {
    id: "interior-design-la",
    outcome:
      "A published 3D interior-design studio site for a Beverly Hills visualization practice covering rendering, kitchen design, bathroom visualization and VR walkthroughs.",
    title: "Interior Design LA",
    category: "Studio / Portfolio",
    summary:
      "A visual-first studio site for a Beverly Hills 3D interior-design practice, showcasing rendering expertise across light, material and form with a six-section expertise breakdown and a client-stories gallery.",
    focus:
      "Full-bleed imagery, cinematic scroll pacing, expertise storytelling (3D rendering, kitchen layout, architectural visualization) and a 'Let's talk' contact path.",
    role: "Visual design & frontend",
    year: "2025",
    tech: ["React", "CSS Grid", "Motion"],
    liveUrl: "https://interiordesignla.netlify.app/",
    image: "/images/3d-DesignLA.webp",
  },
];

export const projects = [
  "scotia-delights",
  "aurora-vault",
  "hortic",
  "interior-design-la",
  "rs-staging",
  "clean-ai",
].map((id) => webCatalog.find((project) => project.id === id)!);

export const capabilityGroups = [
  {
    index: "01",
    title: "Data analysis & BI",
    copy: "Cleaning raw datasets, writing SQL and Python queries, and building reports that answer real business questions.",
    skills: ["Python", "Pandas", "SQL", "Power BI", "Excel", "Data modelling"],
  },
  {
    index: "02",
    title: "Machine learning",
    copy: "Exploring data, engineering features, and training scikit-learn and TensorFlow models that hold up on test data.",
    skills: [
      "Scikit-learn",
      "TensorFlow",
      "EDA",
      "Feature engineering",
      "Model evaluation",
    ],
  },
  {
    index: "03",
    title: "Web development",
    copy: "Building responsive websites and interactive interfaces with Next.js, TypeScript, and clean motion.",
    skills: [
      "Next.js",
      "React",
      "TypeScript",
      "GSAP",
      "Lenis",
      "Design systems",
    ],
  },
];

export const certificates = [
  {
    title: "IBM Machine Learning Specialization",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/21BCS2563_Prashant_IBM_final.webp",
    url: "https://coursera.org/verify/professional-cert/FSFLHO1JDUI3",
  },
  {
    title: "Exploratory Data Analysis for ML",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/1_exploratory_data.webp",
    url: "https://coursera.org/verify/4JJCUIDQNJX7",
  },
  {
    title: "Supervised ML: Regression",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/2_supervised_ml.webp",
    url: "https://coursera.org/verify/HAC8AR37Z84K",
  },
  {
    title: "Supervised ML: Classification",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/3_supervised_ml_classification.webp",
    url: "https://coursera.org/verify/EFYMVKCQUUGF",
  },
  {
    title: "Unsupervised Machine Learning",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/4_unsupervised_ml.webp",
    url: "https://coursera.org/verify/91SHQNJXVDJT",
  },
  {
    title: "Deep Learning & Reinforcement Learning",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/5_deep_learning.webp",
    url: "https://coursera.org/verify/MPPYJ6F4L3AJ",
  },
  {
    title: "Machine Learning Capstone",
    issuer: "IBM / Coursera",
    year: "2024",
    image: "/certificates/6_ml_capstone.webp",
    url: "https://coursera.org/verify/7Y12KT9EF4QW",
  },
  {
    title: "Advanced Python Data Analysis",
    issuer: "Udemy",
    year: "2024",
    image: "/certificates/Advanced Python Data Analysis_Udemy.png",
    url: "https://www.udemy.com/certificate/UC-dcb2851c-8639-464c-81b2-a4a17ccfd772/",
  },
  {
    title: "Frontend Engineering & Angular",
    issuer: "Infosys Springboard",
    year: "2024",
    image: "/certificates/Angula_JS_Infosys.png",
    url: "/certificates/Angula_JS_Infosys.png",
  },
];

export const profile = {
  name: "Prashant Yadav",
  githubUsername: "DazedSaturn07",
  role: "Data analyst & web developer",
  location: "India · open to remote and relocation",
  linkedin: "https://www.linkedin.com/in/onycx/",
  instagram: "https://www.instagram.com/0nycx.dev/",
  github: "https://github.com/DazedSaturn07",
};
