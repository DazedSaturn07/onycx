import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "lenis/dist/lenis.css";
import "./site.css";
import "./refinement.css";
import "./resumes.css";

import SmoothScrolling from "@/components/SmoothScrolling";
import { siteUrl } from "@/lib/site-config";

const chillax = localFont({
  src: "../../fonts/chillax/Chillax-Variable.woff2",
  weight: "200 700",
  variable: "--font-body",
  display: "swap",
  preload: false,
  fallback: ["Arial"],
});
const orbitron = localFont({
  src: "../../fonts/orbitron/Orbitron-Variable.ttf",
  weight: "400 900",
  variable: "--font-orbitron",
  display: "swap",
  fallback: ["Arial"],
});
const axel = localFont({
  src: [
    { path: "../../fonts/axel/AxelRegular.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/axel/AxelBold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-editorial",
  display: "swap",
  preload: false,
  fallback: ["Arial"],
});
const gavency = localFont({
  src: "../../fonts/gavency/Gavency-Condensed-demo.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-serif",
  display: "swap",
  preload: false,
  fallback: ["Georgia"],
});
const signature = localFont({
  src: "../../fonts/santeria-signature/Santeria Signature.ttf",
  weight: "400",
  variable: "--font-signature",
  display: "swap",
  preload: true,
  fallback: ["cursive"],
});
const dune = localFont({
  src: "../../fonts/dune/Dune_Rise.ttf",
  weight: "400",
  variable: "--font-dune",
  display: "swap",
  preload: false,
  fallback: ["Arial", "sans-serif"],
});
const broale = localFont({
  src: "../../fonts/broale/BroaleDemoRegular-XG6qG.ttf",
  weight: "400",
  variable: "--font-broale",
  display: "swap",
  preload: false,
  fallback: ["Arial", "sans-serif"],
});
const boska = localFont({
  src: "../../fonts/boska/Boska-Black.woff2",
  weight: "900",
  variable: "--font-accent",
  display: "swap",
  preload: false,
  fallback: ["Georgia"],
});

const title = "Prashant Yadav — Data Analyst & Web Developer";
const description = "Portfolio of Prashant Yadav — data analytics, machine learning projects, and web development.";

export const viewport: Viewport = {
  themeColor: "#171819",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  authors: [{ name: "Prashant Yadav" }],
  creator: "Prashant Yadav",
  keywords: ["Prashant Yadav", "Prashant Kumar Yadav", "Data Analyst", "Python", "SQL", "Power BI", "Machine Learning", "Next.js", "Web Developer"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title,
    description,
    siteName: "Prashant Yadav",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/Logo.png", apple: "/Logo.png" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Prashant Yadav",
    url: siteUrl,
    jobTitle: "Data Analyst and Web Developer",
    sameAs: ["https://www.linkedin.com/in/onycx/", "https://www.instagram.com/0nycx.dev/", "https://github.com/DazedSaturn07"],
  };

  return (
    <html lang="en" className={`${broale.variable} ${dune.variable} ${axel.variable} ${orbitron.variable} ${chillax.variable} ${gavency.variable} ${signature.variable} ${boska.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <SmoothScrolling>
          <a className="skip-to-content" href="#main-content">Skip to content</a>
          {children}
        </SmoothScrolling>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
