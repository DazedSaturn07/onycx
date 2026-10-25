import evidence from "./project-evidence.json";

export type ProjectVisual =
  | "retail-iq"
  | "shoplens"
  | "novamart"
  | "customer"
  | "mask"
  | "reviewpilot"
  | "job-market"
  | "loanflow"
  | "airops"
  | "retainai"
  | "campaignlift"
  | "mobilitydemand"
  | "freightflow"
  | "civicpulse";

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
  outcomes: { label: string; value: string }[];
}

const analyticsCatalog: RepositoryProject[] = [
  {
    id: "job-market",
    title: "Job Market Quality",
    category: "Job market & information quality",
    outcomes: [
      { label: "Posting observations", value: "123,849" },
      { label: "Distinct text groups", value: "119,041" },
    ],
    summary:
      "A historical LinkedIn snapshot of 123,849 posting observations reveals pay disclosure, experience expectations and exact text repetition across 119,041 text groups.",
    question:
      "How clearly do postings describe pay and requirements, and how much does repeated text inflate observation counts?",
    approach:
      "Python prepares a dimensional model with transparent review rules; MySQL reconciles the counts, Excel supports review, and Power BI presents the evidence.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/FakeJob-Analysis",
    visual: "job-market",
    note: "March–April 2024 historical information quality; not a validated fake-job detector or a measure of today's vacancies.",
  },
  {
    id: "loanflow",
    title: "LoanFlow",
    category: "Business analysis & process investigation",
    outcomes: [
      { label: "Applications investigated", value: "31,509" },
      { label: "Delivered analysis", value: "Process paths + pilot scenarios" },
    ],
    summary:
      "An investigation of 31,509 loan applications connects resolution time, repeated completed work and process variation to a transparent pilot decision exercise.",
    question:
      "Which lending-process patterns deserve case review, and do the modeled pilot assumptions justify the implementation cost?",
    approach:
      "Python extracts case and path metrics from the BPI Challenge 2017 event log; MySQL reconciles them, Excel validates formulas, and Power BI links cohorts to case histories and scenarios.",
    technologies: [
      "Python",
      "Pandas",
      "MySQL",
      "Excel",
      "Power BI",
      "Business Analysis",
    ],
    repoUrl: "https://github.com/DazedSaturn07/LoanFlow",
    visual: "loanflow",
    note: "Calendar gaps are not proven queue time. Repeated work is an investigation proxy; scenario capacity value is hypothetical, not achieved savings.",
  },
  {
    id: "airops",
    title: "AirOps",
    category: "Airline operations & disruption analytics",
    outcomes: [
      { label: "Flight observations", value: "5,819,079" },
      {
        label: "Delivered analysis",
        value: "Reliability + route investigation",
      },
    ],
    summary:
      "A full-population analysis of 5,819,079 US flight observations compares arrival reliability, cancellations, route and airport patterns, and recorded delay attribution.",
    question:
      "Which carriers, routes and departure patterns warrant investigation after checking eligible outcomes and observation volume?",
    approach:
      "Python retains lineage and missing outcomes, MySQL independently reconciles the metrics, Excel validates a sample, and Power BI supports operational comparisons and route investigation.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/AirOps",
    visual: "airops",
    note: "Historical 2015 records; custom on-time boundary ≤15 minutes. October numeric airport identifiers are unresolved and preserved.",
  },
  {
    id: "retail-iq",
    outcomes: [
      { label: "Independent source populations", value: "3" },
      { label: "Delivered analysis", value: "RFM, cohorts + basket affinity" },
    ],
    title: "RetailIQ",
    category: "Retail intelligence",
    summary:
      "Three independent retail studies cover customer value, product affinity, retention, mall personas, and grocery reorder patterns.",
    question:
      "Who buys, what do they buy together, and which customer patterns deserve attention?",
    approach:
      "Python notebooks prepare and analyse Online Retail, mall-customer, and Instacart data; MySQL scripts model and query it for a Power BI reporting layer.",
    technologies: [
      "Python",
      "Pandas",
      "MySQL",
      "SQL",
      "Power BI",
      "RFM",
      "Cohorts",
      "Apriori",
    ],
    repoUrl: "https://github.com/DazedSaturn07/retail_Iq",
    visual: "retail-iq",
    note: "The website follows the seven-page Power BI report’s analytical scope, with verified aggregates and corrections for customer counts and visual aggregations. The three source populations are independent.",
  },
  {
    id: "shoplens",
    outcomes: [
      {
        label: "Delivered analysis",
        value: "Customer value + repeat-purchase cohorts",
      },
    ],
    title: "ShopLens Analytics",
    category: "Customer value & retention",
    summary:
      "An e-commerce analysis focused on finding valuable customer segments, spotting churn risk, and reading retention over time.",
    question:
      "Which customers are becoming inactive, and when do shoppers stop returning?",
    approach:
      "Python cleaning and exploratory analysis feed a SQLite star schema, then RFM, churn, and cohort scripts produce decision-ready tables for SQL and Power BI.",
    technologies: [
      "Python",
      "Pandas",
      "SQLite",
      "SQL",
      "Power BI",
      "RFM",
      "Cohorts",
    ],
    repoUrl: "https://github.com/DazedSaturn07/end-to-end-ecommerce-revenue",
    visual: "shoplens",
    note: "Uses the Online Retail II transaction dataset; data preparation and dashboard stages are described in the repository.",
  },
  {
    id: "customer-behaviour",
    outcomes: [
      { label: "Shopper records", value: "3,900" },
      {
        label: "Delivered analysis",
        value: "Preferences + subscription patterns",
      },
    ],
    title: "Customer Shopping Behaviour",
    category: "Customer analytics",
    summary:
      "A shopper-level study of purchase patterns across demographics, product categories, seasons, subscriptions, and delivery choices.",
    question:
      "How do customer and shopping attributes relate to product and loyalty patterns?",
    approach:
      "A documented Python cleaning and EDA workflow leads into statistical analysis, business-focused SQL queries, and a Power BI KPI dashboard.",
    technologies: ["Python", "Pandas", "NumPy", "SciPy", "SQL", "Power BI"],
    repoUrl: "https://github.com/DazedSaturn07/Customer_Behaviour_Analysis",
    visual: "customer",
    note: "The supplied file contains 3,900 customer records and has no dated transaction column.",
  },
  {
    id: "novamart",
    outcomes: [
      { label: "Delivered item value / GMV proxy", value: "BRL 13.22M" },
      { label: "Orders reconciled", value: "99,441" },
    ],
    title: "NovaMart",
    category: "Marketplace commerce & fulfillment",
    summary:
      "An analysis of 99,441 Olist orders connects BRL 13.22 million in delivered item value with delivery reliability, seller and category performance, and repeat purchases.",
    question:
      "Where does the marketplace generate delivered item value, and which delivery patterns deserve investigation?",
    approach:
      "Python aggregates items, payments and reviews to their correct grain; MySQL independently reconciles the analysis, Excel validates the controls, and five Power BI pages support investigation.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/NovaMart",
    visual: "novamart",
    note: "Historical Brazilian marketplace data in BRL. Item value is a GMV proxy, not revenue or profit. Delivery rates exclude eight delivered orders without actual delivery dates; timestamp and calendar-date lateness differ.",
  },
  {
    id: "civicpulse",
    title: "CivicPulse",
    category: "Public-service operations analytics",
    outcomes: [
      { label: "Requests reconciled", value: "348,180" },
      { label: "Cohort requests unclosed at retrieval", value: "1,640" },
    ],
    summary:
      "A complete January 2025 cohort of 348,180 NYC 311 requests connects agency workload, resolution distributions and 1,640 requests still unclosed at the retrieval snapshot.",
    question:
      "Where is reported service demand concentrated, and which unresolved requests or long resolutions deserve investigation?",
    approach:
      "Python preserves source exceptions, MySQL independently checks every agency and intake day, Excel reconciles totals, and five Power BI pages support operational review.",
    technologies: ["Python", "Pandas", "MySQL", "Excel", "Power BI", "DAX"],
    repoUrl: "https://github.com/DazedSaturn07/CivicPulse",
    visual: "civicpulse",
    note: "January 2025 intake; status observed 25 October 2026. Backlog belongs to this cohort. Due-date evidence covers only 1,295 eligible DSNY records; it is not a citywide SLA measure.",
  },
  {
    id: "freightflow",
    title: "FreightFlow",
    category: "Supply chain & freight planning",
    outcomes: [
      { label: "2024 estimated freight", value: "20.012B tons" },
      { label: "Lane-trade candidates", value: "2,031" },
    ],
    summary:
      "A full FAF5.7.1 analysis transforms 2.67 million source records into a governed freight model and identifies 2,031 lane-trade candidates for further capacity investigation.",
    question:
      "Which regional freight flows deserve capacity review after considering baseline volume, forecast growth and economic density?",
    approach:
      "Python and DuckDB aggregate source detail without discarding repeated keys; MySQL reconciles 27 totals, Excel reviews a shortlist, and Power BI explores the full eligible population.",
    technologies: ["Python", "DuckDB", "Pandas", "MySQL", "Excel", "Power BI"],
    repoUrl: "https://github.com/DazedSaturn07/FreightFlow",
    visual: "freightflow",
    note: "2024 is a baseline estimate; 2030/2050 are FAF source forecasts. Global lane scores are screening aids, not proof of capacity shortages, optimization or achieved savings.",
  },
];

const machineLearningCatalog: RepositoryProject[] = [
  {
    id: "face-mask-detection",
    outcomes: [
      { label: "Repository-reported validation accuracy", value: "≈98%" },
      {
        label: "Delivered workflow",
        value: "Webcam detection + mask classification",
      },
    ],
    title: "Face Mask Detection",
    category: "Computer vision",
    summary:
      "A live webcam pipeline that locates faces, classifies mask status, and displays a confidence score beside each detection.",
    question:
      "Can a lightweight image classifier distinguish masked from unmasked faces in a camera frame?",
    approach:
      "OpenCV's SSD / ResNet-10 face detector supplies face crops to a fine-tuned MobileNetV2 classifier with data augmentation.",
    technologies: [
      "Python",
      "TensorFlow",
      "Keras",
      "MobileNetV2",
      "OpenCV",
      "scikit-learn",
    ],
    repoUrl: "https://github.com/DazedSaturn07/Face_Mask_Detection",
    visual: "mask",
    note: "The README reports about 98% validation accuracy; this is a repository-reported result, not an independent benchmark.",
  },
  {
    id: "retainai",
    title: "RetainAI",
    category: "Applied machine learning · telecom churn",
    outcomes: [
      { label: "Repository-reported test AP", value: "0.8978" },
      { label: "Repository-reported test ROC-AUC", value: "0.9807" },
    ],
    summary:
      "An offline churn study on 3,150 anonymous telecom records compares two models, ranks a campaign contact list and checks distribution drift.",
    question:
      "Which customers have higher churn risk, and how should a limited contact capacity be ranked under explicit campaign assumptions?",
    approach:
      "Four notebooks prepare profile-grouped splits, compare logistic regression with calibrated histogram gradient boosting, score a batch and inspect PSI drift. Identical predictor profiles stay together during splitting and calibration.",
    technologies: [
      "Python",
      "Pandas",
      "scikit-learn",
      "Jupyter",
      "Calibration",
      "PSI",
    ],
    repoUrl: "https://github.com/DazedSaturn07/RetainAi",
    visual: "retainai",
    note: "GitHub reference run: test average precision 0.8978 and ROC-AUC 0.9807. Repository-reported results; campaign benefits are hypothetical, with no deployed prediction service or measured retention uplift.",
  },
  {
    id: "campaignlift",
    title: "CampaignLift",
    category: "Churn propensity & campaign ranking",
    outcomes: [
      {
        label: "Held-out ranking lift at capacity",
        value: `${evidence.campaignlift.lift_at_capacity.toFixed(2)}×`,
      },
      {
        label: "Observed test churners captured",
        value: `${evidence.campaignlift.churners_captured} / 72 in ${evidence.campaignlift.contacts} slots`,
      },
    ],
    summary:
      "A profile-grouped churn study compares two models and builds a capacity-limited retention review list from 3,150 historical telecom records.",
    question:
      "How many observed churners can a ranked contact list concentrate within a strict 20% campaign capacity?",
    approach:
      "Four notebooks validate the attributed source, keep matching predictor profiles together, select the model on validation, reload it for scoring and inspect PSI drift.",
    technologies: [
      "Python",
      "Pandas",
      "scikit-learn",
      "Jupyter",
      "Ranking metrics",
      "PSI",
    ],
    repoUrl: "https://github.com/DazedSaturn07/CampainLift",
    visual: "campaignlift",
    note: "Saved held-out predictions independently reconciled: 468 test customers, 93 contact slots and 60 observed churners captured. Ranking lift is not measured treatment uplift or achieved retention savings. No live prediction API.",
  },
  {
    id: "mobilitydemand",
    title: "MobilityDemand",
    category: "Time-aware demand forecasting",
    outcomes: [
      {
        label: "Held-out MAE reduction vs last-week rule",
        value: `${evidence.mobilitydemand.mae_improvement_pct.toFixed(2)}%`,
      },
      {
        label: "Held-out MAE · rentals/hour",
        value: evidence.mobilitydemand.mae.toFixed(2),
      },
    ],
    summary:
      "An hourly bike-sharing forecast compares gradient boosting with a same-hour-last-week baseline, then explores a transparent shortage-versus-excess capacity exercise.",
    question:
      "Can a time-aware model improve hourly rental estimates, and what does an assumed capacity buffer trade off?",
    approach:
      "Exact-clock historical lags preserve missing hours. Chronological train/validation/test periods separate fitting, model selection and evaluation; saved predictions and capacity arithmetic are independently checked.",
    technologies: [
      "Python",
      "Pandas",
      "scikit-learn",
      "SQL",
      "Jupyter",
      "Time-series evaluation",
    ],
    repoUrl: "https://github.com/DazedSaturn07/MobilityDemand",
    visual: "mobilitydemand",
    note: "Historical one-hour-ahead replay on 2,101 eligible test hours. Observed weather and target components are excluded. Capacity costs use arbitrary teaching units; this is not station-level fleet planning or measured savings.",
  },
];

export const productProjects: RepositoryProject[] = [
  {
    id: "reviewpilot",
    outcomes: [
      {
        label: "Delivered workflow",
        value: "PR URL / signed webhook → structured findings",
      },
    ],
    title: "ReviewPilot AI",
    category: "AI-assisted full-stack build",
    summary:
      "A developer tool concept that turns pull request changes into structured, prioritised code review findings.",
    question:
      "How can fast, deterministic checks and language-aware AI review work together on a pull request?",
    approach:
      "A FastAPI service accepts a pasted pull request URL or signed GitHub webhook, filters and prepares diffs, combines static checks with OpenAI review, then presents findings in a React dashboard.",
    technologies: [
      "FastAPI",
      "Python",
      "React",
      "TypeScript",
      "OpenAI",
      "Docker",
    ],
    repoUrl: "https://github.com/DazedSaturn07/ReviewPilot",
    visual: "reviewpilot",
    note: "An AI-assisted software project, presented separately from the independently built analytics and machine-learning work.",
  },
];

// Curated within disciplines by reproducibility, validation depth and delivered scope.
// Metrics from different datasets are not compared as a common leaderboard.
function ordered(projects: RepositoryProject[], ids: string[]) {
  return ids.map((id) => projects.find((project) => project.id === id)!);
}
export const analyticsProjects = ordered(analyticsCatalog, [
  "civicpulse",
  "novamart",
  "loanflow",
  "job-market",
  "retail-iq",
  "shoplens",
  "customer-behaviour",
]);
export const supplyChainProjects = ordered(analyticsCatalog, [
  "freightflow",
  "airops",
]);
export const machineLearningProjects = ordered(machineLearningCatalog, [
  "mobilitydemand",
  "campaignlift",
  "retainai",
  "face-mask-detection",
]);
export const dashboardProjects = [...analyticsProjects, ...supplyChainProjects];
export const allRepositoryProjects = [
  ...dashboardProjects,
  ...machineLearningProjects,
  ...productProjects,
];
export const featuredProjects = [
  analyticsProjects[0],
  supplyChainProjects[0],
  machineLearningProjects[0],
];
