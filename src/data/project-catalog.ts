export type ProjectVisual = "retail-iq" | "shoplens" | "sales" | "customer" | "mask" | "reviewpilot";

export interface RepositoryProject {
  id: string;
  title: string;
  category: string;
  summary: string;
  question: string;
  approach: string;
  technologies: string[];
  repoUrl: string;
  visual: ProjectVisual;
  note?: string;
}

export const analyticsProjects: RepositoryProject[] = [
  {
    id: "retail-iq",
    title: "RetailIQ",
    category: "Retail intelligence",
    summary: "A multi-dataset retail analytics workflow that connects customer value, product affinity, retention, and reorder behaviour.",
    question: "Who buys, what do they buy together, and which customer patterns deserve attention?",
    approach: "Python notebooks prepare and analyse Online Retail, mall-customer, and Instacart data; MySQL scripts model and query it for a Power BI reporting layer.",
    technologies: ["Python", "Pandas", "MySQL", "SQL", "Power BI", "RFM", "Cohorts", "Apriori"],
    repoUrl: "https://github.com/DazedSaturn07/retail_Iq",
    visual: "retail-iq",
    note: "The repository documents a reproducible workflow; generated outputs and the Power BI file are created locally rather than committed.",
  },
  {
    id: "shoplens",
    title: "ShopLens Analytics",
    category: "Customer value & retention",
    summary: "An e-commerce analysis focused on finding valuable customer segments, spotting churn risk, and reading retention over time.",
    question: "Which customers are becoming inactive, and when do shoppers stop returning?",
    approach: "Python cleaning and exploratory analysis feed a SQLite star schema, then RFM, churn, and cohort scripts produce decision-ready tables for SQL and Power BI.",
    technologies: ["Python", "Pandas", "SQLite", "SQL", "Power BI", "RFM", "Cohorts"],
    repoUrl: "https://github.com/DazedSaturn07/end-to-end-ecommerce-revenue",
    visual: "shoplens",
    note: "Uses the Online Retail II transaction dataset; data preparation and dashboard stages are described in the repository.",
  },
  {
    id: "customer-behaviour",
    title: "Customer Shopping Behaviour",
    category: "Customer analytics",
    summary: "A shopper-level study of purchase patterns across demographics, product categories, seasons, subscriptions, and delivery choices.",
    question: "How do customer and shopping attributes relate to product and loyalty patterns?",
    approach: "A documented Python cleaning and EDA workflow leads into statistical analysis, business-focused SQL queries, and a Power BI KPI dashboard.",
    technologies: ["Python", "Pandas", "NumPy", "SciPy", "SQL", "Power BI"],
    repoUrl: "https://github.com/DazedSaturn07/Customer_Behaviour_Analysis",
    visual: "customer",
    note: "The README describes a dataset of more than 3,900 customer records.",
  },
  {
    id: "sales-analysis",
    title: "Retail Sales Analysis",
    category: "Sales performance",
    summary: "A sales reporting project that examines transaction quality, revenue trends, product performance, customer value, and geography.",
    question: "Where are sales concentrated, when do they peak, and which products and customers contribute most?",
    approach: "Python data cleaning and exploratory work support a broad set of SQL analyses and a Power BI dashboard with trend, product, customer, and location views.",
    technologies: ["Python", "Pandas", "MySQL", "SQL", "Power BI", "DAX", "RFM"],
    repoUrl: "https://github.com/DazedSaturn07/Sales_Analysis_Dashboard",
    visual: "sales",
    note: "This project also uses Online Retail II; its README contains conflicting currency labels, so no revenue total is repeated here.",
  },
];

export const machineLearningProjects: RepositoryProject[] = [
  {
    id: "face-mask-detection",
    title: "Face Mask Detection",
    category: "Computer vision",
    summary: "A live webcam pipeline that locates faces, classifies mask status, and displays a confidence score beside each detection.",
    question: "Can a lightweight image classifier distinguish masked from unmasked faces in a camera frame?",
    approach: "OpenCV's SSD / ResNet-10 face detector supplies face crops to a fine-tuned MobileNetV2 classifier with data augmentation.",
    technologies: ["Python", "TensorFlow", "Keras", "MobileNetV2", "OpenCV", "scikit-learn"],
    repoUrl: "https://github.com/DazedSaturn07/Face_Mask_Detection",
    visual: "mask",
    note: "The README reports about 98% validation accuracy; this is a repository-reported result, not an independent benchmark.",
  },
];

export const productProjects: RepositoryProject[] = [
  {
    id: "reviewpilot",
    title: "ReviewPilot AI",
    category: "AI-assisted full-stack build",
    summary: "A developer tool concept that turns pull request changes into structured, prioritised code review findings.",
    question: "How can fast, deterministic checks and language-aware AI review work together on a pull request?",
    approach: "A FastAPI service accepts a pasted pull request URL or signed GitHub webhook, filters and prepares diffs, combines static checks with OpenAI review, then presents findings in a React dashboard.",
    technologies: ["FastAPI", "Python", "React", "TypeScript", "OpenAI", "Docker"],
    repoUrl: "https://github.com/DazedSaturn07/ReviewPilot",
    visual: "reviewpilot",
    note: "An AI-assisted software project, presented separately from the independently built analytics and machine-learning work.",
  },
];

export const featuredProjects = [
  analyticsProjects[0],
  analyticsProjects[1],
  machineLearningProjects[0],
];
