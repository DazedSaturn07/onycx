import Image from "next/image";

const stats = [
  { value: "15+", label: "Projects built" },
  { value: "10+", label: "Core tools" },
  { value: "04", label: "Focus lanes" },
];

const capabilities = [
  "Data analytics",
  "Machine learning",
  "Power BI dashboards",
  "AI assisted web builds",
  "ETL pipelines",
  "Business intelligence",
];

export function AboutSection() {
  return (
    <section id="about" className="cinema-section cinema-about-section">
      <div className="cinema-section-inner cinema-about">
        <div className="cinema-about-copy">
          <p className="cinema-kicker">About / Signal over noise</p>
          <h2 className="cinema-display-title">
            Builder of <span className="cinema-outline">data intelligence</span>
          </h2>
          <p className="cinema-about-text">
            I specialize in analytics, machine learning, and AI-driven
            automation. The work sits where clean data pipelines, sharp
            visualization, and practical decision systems meet.
          </p>
          <p className="cinema-about-text is-muted">
            Computer Science graduate from Chandigarh University with a bias for
            clear dashboards, useful models, and modern interfaces that feel
            alive without slowing people down.
          </p>

          <div className="cinema-stat-row">
            {stats.map((stat) => (
              <div className="cinema-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="cinema-capabilities" aria-label="Capabilities">
            {capabilities.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </div>

        <div className="cinema-about-media" data-cursor="interactive">
          <div className="cinema-about-glow" aria-hidden="true" />
          <Image
            src="/photo.png"
            alt="Prashant Kumar Yadav"
            fill
            sizes="(max-width: 768px) 76vw, 34vw"
            className="cinema-about-image"
          />
        </div>
      </div>
    </section>
  );
}
