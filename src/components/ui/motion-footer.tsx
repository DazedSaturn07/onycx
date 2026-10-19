import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { profile } from "@/data/portfolio";

export function CinematicFooter() {
  return <HalftoneWordmarkFooter
    id="contact"
    wordmark="onycx"
    label={profile.name}
    meta="Data analyst & creative developer · India"
    preset="night"
    palette={{ background: "#0b0c0c", ink: "#d9dcd8", warm: "#e98b53" }}
    fontFamily="GeistSans, Arial, sans-serif"
    monoFamily="GeistMono, Consolas, monospace"
    height="clamp(680px, 54vw, 900px)"
    dotGap={5}
    radius={95}
    grain={0.3}
    crop={0}
    columns={[
      { title: "Work", links: [{ label: "All projects", href: "/projects" }, { label: "Data analytics", href: "/projects#analytics" }, { label: "Web experiences", href: "/projects#web-experiences" }] },
      { title: "Practice", links: [{ label: "About", href: "/#about" }, { label: "Capabilities", href: "/#capabilities" }, { label: "Résumé", href: profile.resume }] },
      { title: "Connect", links: [{ label: "Email me", href: `mailto:${profile.email}` }, { label: "LinkedIn", href: profile.linkedin }, { label: "GitHub", href: profile.github }] },
    ]}
  />;
}
