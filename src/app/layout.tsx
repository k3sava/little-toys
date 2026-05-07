import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  DM_Sans,
  JetBrains_Mono,
  Noto_Serif_JP,
  Source_Serif_4,
} from "next/font/google";
import { BlobCanvas } from "@/components/blob-canvas";
import { ShareButton } from "@/components/share-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { JsonLd, rootLd } from "@/lib/json-ld";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

// Editorial: Cormorant Garamond for display (headings), Source Serif 4 for body
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial-display",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-editorial-body",
});

// Zen: Noto Serif JP reads meditative even in English
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-zen-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://toys.iamkesava.com"),
  title: "little toys — creative experiments by Kesava",
  description:
    "Creative experiments and interactive toys that run in your browser. Music, visuals, physics, generative art.",
  authors: [{ name: "Kesava" }],
  alternates: { canonical: "https://toys.iamkesava.com" },
  openGraph: {
    title: "little toys, creative experiments by Kesava",
    description:
      "Creative experiments and interactive toys that run in your browser.",
    url: "https://toys.iamkesava.com",
    siteName: "little toys",
    type: "website",
    images: [{ url: "https://toys.iamkesava.com/og/default.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "little toys, creative experiments by Kesava",
    description: "Creative experiments and interactive toys in your browser.",
    images: ["https://toys.iamkesava.com/og/default.svg"],
  },
  themeColor: "#0f0f1e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetBrainsMono.variable} ${cormorant.variable} ${sourceSerif.variable} ${notoSerifJP.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(!t){t="brutalist";localStorage.setItem("theme",t)}if(t&&t!=="default")document.documentElement.setAttribute("data-theme",t);else document.documentElement.removeAttribute("data-theme")}catch(e){}})()`,
          }}
        />
        <JsonLd data={rootLd()} />
      </head>
      <body className="font-sans antialiased">
        <div className="kami-mobile-bar" aria-hidden="true" />
        <BlobCanvas />
        <div style={{ position: "relative", zIndex: 10 }}>{children}</div>
        <ShareButton />
        <ThemeSwitcher />
      </body>
    </html>
  );
}
