import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="bg-gold-gradient fixed start-4 top-4 z-[300] -translate-y-[250%] rounded-xl px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-lg transition-transform duration-200 focus:translate-y-0"
      >
        تخطَّ إلى المحتوى
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
