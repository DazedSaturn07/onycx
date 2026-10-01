import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "lenis/dist/lenis.css";
import "./site.css";

import SmoothScrolling from "@/components/SmoothScrolling";
import { siteUrl } from "@/lib/site-config";

const chillax = localFont({
  src: "../../fonts/chillax/Chillax-Variable.woff2",
  weight: "200 700",
  variable: "--font-body",
  display: "swap",
  fallback: ["Arial"],
});
const gavency = localFont({
  src: [
    { path: "../../fonts/gavency/Gavency-Condensed-demo.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/gavency/Gavency-Italic-demo.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia"],
});
const signature = localFont({
  src: "../../fonts/a-auto-signature-font/AAutoSignature-1GD9j.ttf",
  weight: "400",
  variable: "--font-signature",
  display: "swap",
  preload: true,
  fallback: ["cursive"],
});
const boska = localFont({
  src: "../../fonts/boska/Boska-Black.woff2",
  weight: "900",
  variable: "--font-accent",
  display: "swap",
  fallback: ["Georgia"],
});

const title = "Prashant Yadav — Data Analyst & Creative Developer";
const description = "Prashant Yadav turns complex data and ambitious ideas into clear analytics, practical machine learning, and polished digital experiences.";

export const viewport: Viewport = {
  themeColor: "#000000",
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
  keywords: ["Prashant Yadav", "Prashant Kumar Yadav", "Data Analyst", "Python", "SQL", "Power BI", "Machine Learning", "Next.js", "Creative Developer"],
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
    email: "mailto:prashants0325@gmail.com",
    jobTitle: "Data Analyst and Creative Developer",
    sameAs: ["https://www.linkedin.com/in/onycx/", "https://github.com/DazedSaturn07"],
  };

  return (
    <html lang="en" className={`${chillax.variable} ${gavency.variable} ${signature.variable} ${boska.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
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
