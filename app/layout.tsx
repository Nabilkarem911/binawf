import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "موهبة فنان | التربية الفنية بمدرسة عبد الرحمن بن عوف الابتدائية بجدة",
    template: "%s | موهبة فنان",
  },
  description:
    "بوابة التربية الفنية في مدرسة عبد الرحمن بن عوف الابتدائية بجدة. أخبار، معارض، إبداعات طلاب، دروس، جوائز وإنجازات.",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "موهبة فنان",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${notoSansArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">{children}</body>
    </html>
  );
}
