import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
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
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
