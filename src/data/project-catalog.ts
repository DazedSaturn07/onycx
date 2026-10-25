export type ProjectVisual = "retail-iq" | "shoplens" | "novamart" | "customer" | "mask" | "reviewpilot" | "job-market" | "loanflow" | "airops" | "retainai";

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
    id: "job-market", title: "Job Market Quality", category: "Job market & information quality",
    summary: "A historical LinkedIn snapshot of 123,849 posting observations reveals pay disclosure, experience expectations and exact text repetition across 119,041 text groups.",
    question: "How clearly do postings describe pay and requirements, and how much does repeated text inflate observation counts?",
    approach: "Python prepares a dimensional model with transparent review rules; MySQL reconciles the counts, Excel supports review, and Power BI presents the evidence.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/FakeJob-Analysis", visual: "job-market",
    note: "March–April 2024 historical information quality; not a validated fake-job detector or a measure of today's vacancies.",
  },
  {
    id: "loanflow", title: "LoanFlow", category: "Business analysis & process investigation",
    summary: "An investigation of 31,509 loan applications connects resolution time, repeated completed work and process variation to a transparent pilot decision exercise.",
    question: "Which lending-process patterns deserve case review, and do the modeled pilot assumptions justify the implementation cost?",
    approach: "Python extracts case and path metrics from the BPI Challenge 2017 event log; MySQL reconciles them, Excel validates formulas, and Power BI links cohorts to case histories and scenarios.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "Business Analysis"],
    repoUrl: "https://github.com/DazedSaturn07/LoanFlow", visual: "loanflow",
    note: "Calendar gaps are not proven queue time. Repeated work is an investigation proxy; scenario capacity value is hypothetical, not achieved savings.",
  },
  {
    id: "airops", title: "AirOps", category: "Airline operations & disruption analytics",
    summary: "A full-population analysis of 5,819,079 US flight observations compares arrival reliability, cancellations, route and airport patterns, and recorded delay attribution.",
    question: "Which carriers, routes and departure patterns warrant investigation after checking eligible outcomes and observation volume?",
    approach: "Python retains lineage and missing outcomes, MySQL independently reconciles the metrics, Excel validates a sample, and Power BI supports operational comparisons and route investigation.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/AirOps", visual: "airops",
    note: "Historical 2015 records; custom on-time boundary ≤15 minutes. October numeric airport identifiers are unresolved and preserved.",
  },
  {
    id: "retail-iq",
    title: "RetailIQ",
    category: "Retail intelligence",
    summary: "Three independent retail studies cover customer value, product affinity, retention, mall personas, and grocery reorder patterns.",
    question: "Who buys, what do they buy together, and which customer patterns deserve attention?",
    approach: "Python notebooks prepare and analyse Online Retail, mall-customer, and Instacart data; MySQL scripts model and query it for a Power BI reporting layer.",
    technologies: ["Python", "Pandas", "MySQL", "SQL", "Power BI", "RFM", "Cohorts", "Apriori"],
    repoUrl: "https://github.com/DazedSaturn07/retail_Iq",
    visual: "retail-iq",
    note: "The website follows the seven-page Power BI report’s analytical scope, with verified aggregates and corrections for customer counts and visual aggregations. The three source populations are independent.",
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
    note: "The supplied file contains 3,900 customer records and has no dated transaction column.",
  },
  {
    id: "novamart",
    title: "NovaMart",
    category: "Marketplace commerce & fulfillment",
    summary: "An analysis of 99,441 Olist orders connects BRL 13.22 million in delivered item value with delivery reliability, seller and category performance, and repeat purchases.",
    question: "Where does the marketplace generate delivered item value, and which delivery patterns deserve investigation?",
    approach: "Python aggregates items, payments and reviews to their correct grain; MySQL independently reconciles the analysis, Excel validates the controls, and five Power BI pages support investigation.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/NovaMart",
    visual: "novamart",
    note: "Historical Brazilian marketplace data in BRL. Item value is a GMV proxy, not revenue or profit. Delivery rates exclude eight delivered orders without actual delivery dates; timestamp and calendar-date lateness differ.",
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
  {
    id: "retainai", title: "RetainAI", category: "Applied machine learning · telecom churn",
    summary: "An offline churn study on 3,150 anonymous telecom records compares two models, ranks a campaign contact list and checks distribution drift.",
    question: "Which customers have higher churn risk, and how should a limited contact capacity be ranked under explicit campaign assumptions?",
    approach: "Four notebooks prepare profile-grouped splits, compare logistic regression with calibrated histogram gradient boosting, score a batch and inspect PSI drift. Identical predictor profiles stay together during splitting and calibration.",
    technologies: ["Python", "Pandas", "scikit-learn", "Jupyter", "Calibration", "PSI"],
    repoUrl: "https://github.com/DazedSaturn07/RetainAi", visual: "retainai",
    note: "GitHub reference run: test average precision 0.8978 and ROC-AUC 0.9807. Repository-reported results; campaign benefits are hypothetical, with no deployed prediction service or measured retention uplift.",
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
