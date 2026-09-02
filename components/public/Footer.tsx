import { getSiteSettings } from "@/lib/site";

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="mt-auto w-full border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-right">
            <p className="font-semibold text-foreground">{settings.title}</p>
            <p className="text-sm text-muted-foreground">{settings.footerText || settings.subtitle}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} © جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
