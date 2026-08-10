import type { Metadata } from "next";
import { Fraunces, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";

import { DraftModeBanner } from "@/components/DraftModeBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_NAME } from "@/lib/siteStructure";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-jp",
  display: "swap",
});

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "40代からの介護・老後の不安を、わかりやすく具体的に解説するメディア",
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.trim(),
        },
      }
    : {}),
};

/** Next.js 16 + Turbopack 開発時の performance.measure 例外を抑止（Dev overlay 用） */
const DEV_PERFORMANCE_MEASURE_PATCH = `(function(){try{var p=window.performance;if(!p||typeof p.measure!=="function"||p.__nextDevMeasurePatched)return;var o=p.measure.bind(p);p.measure=function(){try{return o.apply(p,arguments)}catch(e){var m=(e&&e.message)||"";if(m.indexOf("negative time stamp")!==-1||m.indexOf("cannot be negative")!==-1)return undefined;throw e}};p.__nextDevMeasurePatched=true}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${fraunces.variable} ${notoSerif.variable} ${notoSans.variable}`}
      suppressHydrationWarning
    >
      <body className="site-body" suppressHydrationWarning>
        {process.env.NODE_ENV === "development" ? (
          <script dangerouslySetInnerHTML={{ __html: DEV_PERFORMANCE_MEASURE_PATCH }} />
        ) : null}
        <div className="site-atmosphere" aria-hidden="true" />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <DraftModeBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
