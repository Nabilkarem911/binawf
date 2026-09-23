import type { Metadata } from "next";
import { Tajawal, Alexandria } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
});

const alexandria = Alexandria({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "موهبة فنان | التربية الفنية بمدرسة عبد الرحمن بن عوف الابتدائية بجدة",
    template: "%s | موهبة فنان",
  },
  description:
    "بوابة التربية الفنية في مدرسة عبد الرحمن بن عوف الابتدائية بجدة. أخبار، معارض، إبداعات طلاب، دروس، جوائز وإنجازات.",
  keywords: ["التربية الفنية", "مدرسة ابتدائية", "جدة", "عبد الرحمن بن عوف", "موهبة فنان", "فنون", "طلاب", "معارض"],
  authors: [{ name: "مدرسة عبد الرحمن بن عوف الابتدائية" }],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: siteUrl,
    siteName: "موهبة فنان",
    title: "موهبة فنان | التربية الفنية بمدرسة عبد الرحمن بن عوف الابتدائية بجدة",
    description: "بوابة التربية الفنية في مدرسة عبد الرحمن بن عوف الابتدائية بجدة. أخبار، معارض، إبداعات طلاب، دروس، جوائز وإنجازات.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "موهبة فنان - مدرسة عبد الرحمن بن عوف الابتدائية",
  alternateName: "Binawf Art Education Platform",
  description: "بوابة التربية الفنية في مدرسة عبد الرحمن بن عوف الابتدائية بجدة",
  url: siteUrl,
  address: {
    "@type": "PostalAddress",
    addressLocality: "جدة",
    addressCountry: "SA",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${alexandria.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
