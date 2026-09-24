import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <section className="gradient-mesh grain relative flex-1 overflow-hidden">
      <div className="container-page relative z-10 flex flex-col items-center py-20 text-center lg:py-28">
        <span className="glass mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-gold">
          <Compass className="h-8 w-8" />
        </span>
        <p className="font-display text-7xl font-extrabold text-gold-light sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
          الصفحة غير موجودة
        </h1>
        <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
          ربما انتقل المحتوى الذي تبحث عنه أو تغيّر رابطه. جرّب البحث أو العودة إلى الصفحة الرئيسية.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-gold-gradient inline-flex h-11 items-center gap-2 rounded-full px-7 text-sm font-bold text-gold-foreground shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Home className="h-4 w-4" />
            العودة للرئيسية
          </Link>
          <Link
            href="/search"
            className="glass inline-flex h-11 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            <Search className="h-4 w-4" />
            بحث في الموقع
          </Link>
        </div>
      </div>
    </section>
  );
}
