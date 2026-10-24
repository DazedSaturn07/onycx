import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { capabilityGroups } from "@/data/portfolio";

const disciplines = [
  { label: "Find the signal", href: "/projects#analytics", link: "Explore data projects", kind: "data" },
  { label: "Explore the possibilities", href: "/projects#machine-learning", link: "Explore ML projects", kind: "models" },
  { label: "Make it tangible", href: "/projects#web-experiences", link: "Explore web projects", kind: "interfaces" },
];

// Decorative studies of each discipline, rather than project metrics.
function DisciplineStudy({ kind }: { kind: string }) {
  if (kind === "data") {
    const heights = [40, 68, 55, 100, 86, 132, 121, 165, 187];
    return (
      <svg className="capabilities-study" viewBox="0 0 400 290" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="capability-bars" x1="0" y1="80" x2="0" y2="250" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e8e7e2" /><stop offset="1" stopColor="#353535" />
          </linearGradient>
        </defs>
        {[95, 145, 195, 245].map((y) => <path key={y} d={`M36 ${y}H364`} stroke="#ffffff12" />)}
        {heights.map((height, i) => <rect key={i} x={52 + i * 35} y={245 - height} width="17" height={height} rx="8.5" fill={i === 8 ? "#ff663b" : "url(#capability-bars)"} />)}
        <path d="M54 176C93 176 95 132 130 145S174 134 204 107S251 130 278 88S319 79 340 48" stroke="#ff663b" strokeWidth="2" />
        <circle cx="340" cy="48" r="5" fill="#ff663b" /><circle cx="340" cy="48" r="12" stroke="#ff663b" strokeOpacity=".3" />
      </svg>
    );
  }
  if (kind === "models") {
    return (
      <svg className="capabilities-study" viewBox="0 0 400 290" fill="none" aria-hidden="true">
        {Array.from({ length: 19 }, (_, i) => <path key={i} d={`M-30 ${55 + i * 10}C75 ${-65 + i * 8} 105 ${310 - i * 7} 205 ${165 + i * 3}S310 ${-35 + i * 15} 440 ${100 + i * 10}`} stroke={i % 4 === 0 ? "#ffc6a2" : "#26100b"} strokeOpacity={i % 4 === 0 ? ".75" : ".65"} strokeWidth={i % 4 === 0 ? "1.5" : "1"} />)}
        <circle cx="205" cy="165" r="40" fill="#17100d" stroke="#ffb28a" strokeWidth=".75" />
        <path d="M190 165H220M205 150V180M194 154L216 176M194 176L216 154" stroke="#ff8253" strokeWidth="2.5" />
        <circle cx="205" cy="165" r="54" stroke="#ffc6a2" strokeOpacity=".45" strokeDasharray="2 7" />
      </svg>
    );
  }
  return (
    <div className="capabilities-interface-study" aria-hidden="true">
      <div className="capabilities-browser">
        <div className="capabilities-browser-bar"><i /><i /><i /><span /></div>
        <div className="capabilities-browser-body">
          <div className="capabilities-browser-sidebar"><b /><b /><b /><b /></div>
          <div className="capabilities-browser-canvas">
            <span className="capabilities-browser-tag" />
            <div className="capabilities-browser-type"><b /><b /></div>
            <span className="capabilities-browser-button"><ArrowUpRight size={14} /></span>
            <div className="capabilities-browser-orbit"><i /><i /><i /></div>
          </div>
        </div>
      </div>
      <span className="capabilities-code-chip">&lt;/&gt;</span>
    </div>
  );
}

export default function Capabilities() {
  return (
    <section id="capabilities" className="portfolio-section portfolio-capabilities" aria-labelledby="capabilities-heading">
      <div className="portfolio-section-inner">
        <div className="capabilities-topline">
          <p className="portfolio-section-kicker">03 / Capabilities</p>
          <span>Analytical thinking. Creative practice.</span>
        </div>

        <div className="capabilities-intro" data-reveal>
          <p className="capabilities-eyebrow"><span /> A connected practice</p>
          <h2 id="capabilities-heading">Understand the complex.<br /><span>Make it <Asterisk aria-hidden="true" /> meaningful.</span></h2>
          <p>Finding the story in data. Exploring what models can do.<br className="capabilities-desktop-break" /> Bringing ideas to life through thoughtful interfaces.</p>
        </div>

        <div className="capabilities-cards">
          {capabilityGroups.map((group, index) => {
            const discipline = disciplines[index];
            return (
              <article key={group.index} className={`capabilities-card capabilities-card--${discipline.kind}`} data-reveal>
                <div className="capabilities-card-art">
                  <span className="capabilities-card-label">{group.index} / {discipline.label}</span>
                  <DisciplineStudy kind={discipline.kind} />
                  <span className="capabilities-art-caption">{["Question → insight", "Explore → evaluate", "Design → develop"][index]}</span>
                </div>
                <div className="capabilities-card-copy">
                  <h3>{group.title}</h3>
                  <p>{group.copy}</p>
                  <ul aria-label={`${group.title} tools`}>{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
                  <Link href={discipline.href}>{discipline.link}<ArrowUpRight size={18} aria-hidden="true" /></Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="capabilities-footer">
          <p>Different disciplines.<br /><span>The same curiosity.</span></p>
          <Link href="/projects">See the work <span><ArrowUpRight size={20} aria-hidden="true" /></span></Link>
        </div>
      </div>
    </section>
  );
}
