import { ArrowUp, ArrowUpRight, FileText, Mail } from "lucide-react";
import { profile } from "@/data/portfolio";
import FooterWordmark from "@/components/ui/footer-wordmark";
import GithubIcon from "@/components/ui/github-icon";

function LinkedinIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 2H3.55C2.69 2 2 2.67 2 3.5v17c0 .83.69 1.5 1.55 1.5h16.9c.86 0 1.55-.67 1.55-1.5v-17c0-.83-.69-1.5-1.55-1.5ZM8.01 18.34H5.02V9.02h2.99v9.32ZM6.52 7.75a1.73 1.73 0 1 1 0-3.46 1.73 1.73 0 0 1 0 3.46Zm11.82 10.59h-2.98v-4.53c0-1.08-.02-2.46-1.5-2.46-1.5 0-1.73 1.17-1.73 2.38v4.61H9.15V9.02h2.86v1.27h.04c.4-.75 1.37-1.54 2.81-1.54 3.01 0 3.57 1.98 3.57 4.55v5.04Z" /></svg>;
}

function MarqueeGroup() {
  return (
    <div className="cinematic-footer__marquee-group">
      <span>Data intelligence</span><span className="cinematic-footer__spark" aria-hidden="true">✦</span>
      <span>Applied machine learning</span><span className="cinematic-footer__spark" aria-hidden="true">✦</span>
      <span>Creative engineering</span><span className="cinematic-footer__spark" aria-hidden="true">✦</span>
      <span>Useful experiences</span><span className="cinematic-footer__spark" aria-hidden="true">✦</span>
    </div>
  );
}

export function CinematicFooter() {
  return (
    <footer id="contact" className="cinematic-footer" aria-labelledby="footer-heading">
      <div className="cinematic-footer__glow" aria-hidden="true" />
      <div className="cinematic-footer__marquee" aria-hidden="true">
        <div className="cinematic-footer__marquee-track"><MarqueeGroup /><MarqueeGroup /></div>
      </div>

      <div className="cinematic-footer__main" data-reveal data-reveal-side="right">
        <p className="cinematic-footer__eyebrow">Prashant Yadav · India</p>
        <h2 id="footer-heading" className="cinematic-footer__heading">Let&apos;s build<br />something useful.</h2>
        <nav className="cinematic-footer__links" aria-label="Contact and social links">
          <a className="cinematic-footer__pill" href={`mailto:${profile.email}`}><Mail aria-hidden="true" />Email me</a>
          <a className="cinematic-footer__pill" href={profile.linkedin} target="_blank" rel="noopener noreferrer"><LinkedinIcon />LinkedIn<ArrowUpRight aria-hidden="true" /></a>
          <a className="cinematic-footer__pill" href={profile.github} target="_blank" rel="noopener noreferrer"><GithubIcon />GitHub<ArrowUpRight aria-hidden="true" /></a>
          <a className="cinematic-footer__pill cinematic-footer__resume" href={profile.resume} target="_blank" rel="noopener noreferrer"><FileText aria-hidden="true" />View résumé<ArrowUpRight aria-hidden="true" /></a>
        </nav>
      </div>

      <div className="cinematic-footer__wordmark"><FooterWordmark /></div>
      <div className="cinematic-footer__bottom">
        <p className="cinematic-footer__copyright">© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        <div className="cinematic-footer__credit"><span>Built with</span><span className="cinematic-footer__heart" aria-hidden="true">♥</span><span>by</span><span className="cinematic-footer__credit-name">Prashant</span></div>
        <a className="cinematic-footer__top" href="#top" aria-label="Back to top"><ArrowUp aria-hidden="true" /></a>
      </div>
    </footer>
  );
}
