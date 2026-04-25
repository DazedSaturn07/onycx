import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-satoshi",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-cabinet",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Prashant Kumar Yadav - Data Analyst & Vibe Coder",
  description:
    "Cinematic portfolio for Prashant Kumar Yadav, a Data Analyst and Vibe Coder specializing in Python, SQL, Power BI, Machine Learning, and AI-driven web experiences.",
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
    title: "Prashant Kumar Yadav - Data Analyst & Vibe Coder",
    description:
      "Transforming raw data into actionable insights with analytics, ML, and modern web experiences.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prashant Kumar Yadav - Data Analyst & Vibe Coder",
    description:
      "Transforming raw data into actionable insights with analytics, ML, and modern web experiences.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
