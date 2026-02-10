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
  title: "Prashant Kumar Yadav — Full-Stack Developer & ML Engineer",
  description:
    "Building intelligent, scalable web solutions. Full-Stack Developer and ML Engineer specializing in Next.js, TypeScript, Python, and Machine Learning.",
  keywords: [
    "Full-Stack Developer",
    "ML Engineer",
    "Next.js",
    "TypeScript",
    "Machine Learning",
    "React",
    "Portfolio",
    "Prashant Kumar Yadav",
  ],
  authors: [{ name: "Prashant Kumar Yadav" }],
  openGraph: {
    title: "Prashant Kumar Yadav — Full-Stack Developer & ML Engineer",
    description: "Building intelligent, scalable web solutions with modern technologies.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prashant Kumar Yadav — Full-Stack Developer & ML Engineer",
    description: "Building intelligent, scalable web solutions with modern technologies.",
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
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} ${syne.variable} font-sans antialiased`}
      >
        {/* Skip to content for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
