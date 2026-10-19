import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { capabilityGroups } from "@/data/portfolio";

export default function Capabilities() {
  return (
    <section id="capabilities" className="portfolio-section portfolio-capabilities" aria-labelledby="capabilities-heading">
      <div className="portfolio-section-inner">
        <div className="capabilities-topline">
          <p className="portfolio-section-kicker">03 / Capabilities</p>
          <span>Three disciplines. One connected practice.</span>
        </div>

        <div className="capabilities-studio">
          <div className="capabilities-studio-copy" data-reveal data-reveal-side="left">
            <p className="capabilities-eyebrow">Think clearly. Make thoughtfully.</p>
            <h2 id="capabilities-heading">Useful<br /><em>systems.</em></h2>
            <p>From the first question to the final interface, I focus on work that is clear, maintainable, and ready to use.</p>
            <Link href="/projects" className="capabilities-explore">Explore the work <span><ArrowUpRight size={18} aria-hidden="true" /></span></Link>
          </div>
          <div className="capabilities-sculpture" aria-hidden="true">
            <span className="capabilities-sculpture-word">systems</span>
            <Image src="/images/capabilities-sculpture.webp" alt="" width={1200} height={922} sizes="(max-width: 760px) 95vw, 56vw" />
            <span className="capabilities-sculpture-caption">Analysis / Models / Interfaces</span>
          </div>
        </div>

        <div className="capabilities-disciplines">
          {capabilityGroups.map((group, index) => (
            <details key={group.index} name="capability-discipline" className="capabilities-discipline" open={index === 0}>
              <summary>
                <span className="capabilities-discipline-index">{group.index}</span>
                <h3>{group.title}</h3>
                <Plus className="capabilities-discipline-toggle" size={20} aria-hidden="true" />
              </summary>
              <div className="capabilities-discipline-body">
                <p>{group.copy}</p>
                <ul aria-label={`${group.title} tools`}>{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
