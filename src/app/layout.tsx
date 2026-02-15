import type { Metadata } from "next";
import { Inter, Space_Grotesk, Playfair_Display, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Prashant Kumar Yadav — Data Analyst & Vibe Coder",
  description:
    "Transforming raw data into actionable insights. Data Analyst and Vibe Coder specializing in Python, SQL, Power BI, Machine Learning, and AI-driven automation.",
  keywords: [
    "Data Analyst",
    "Vibe Coder",
    "Python",
    "Power BI",
    "SQL",
    "Data Analytics",
    "Machine Learning",
    "Data Visualization",
    "Portfolio",
    "Prashant Kumar Yadav",
  ],
  authors: [{ name: "Prashant Kumar Yadav" }],
  openGraph: {
    title: "Prashant Kumar Yadav — Data Analyst & Vibe Coder",
    description: "Transforming raw data into actionable insights with analytics, ML, and modern tools.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prashant Kumar Yadav — Data Analyst & Vibe Coder",
    description: "Transforming raw data into actionable insights with analytics, ML, and modern tools.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import SmoothScroll from "@/components/SmoothScroll";
import { PreloadProvider } from "@/context/PreloadContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} ${syne.variable} font-sans antialiased`}
      >
        <PreloadProvider>
          <SmoothScroll>
            {/* Skip to content for accessibility */}
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            {children}
          </SmoothScroll>
        </PreloadProvider>
      </body>
    </html>
  );
}
