import { useMemo } from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import LandingNavbar from "@/components/landing/LandingNavbar";
import FooterSection from "@/components/landing/FooterSection";
import { usePublicSiteContent } from "@/hooks/usePublicSiteContent";
import { LEGAL_PAGES } from "@/lib/site-content";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";

const PublicContent = () => {
  const { pathname } = useLocation();
  const { general, legal, loading } = usePublicSiteContent();

  const page = useMemo(
    () => LEGAL_PAGES.find((p) => p.path === pathname),
    [pathname],
  );

  if (!page) return <Navigate to="/" replace />;

  const title = legal[page.titleKey as keyof typeof legal] as string;
  const body = legal[page.bodyKey as keyof typeof legal] as string;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNavbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                <Link to="/" className="hover:text-foreground">Accueil</Link>
                <span className="mx-2">/</span>
                {page.nav}
              </p>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-8">{title}</h1>
              <article className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_strong]:text-foreground">
                <ReactMarkdown>{body}</ReactMarkdown>
              </article>
              {page.slug === "contact" && (
                <div className="mt-10 rounded-2xl border border-border bg-card p-6 space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-foreground">
                    <Mail className="w-4 h-4 text-primary" />
                    <a className="hover:underline" href={`mailto:${general.supportEmail}`}>{general.supportEmail}</a>
                  </p>
                  {general.phone && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Phone className="w-4 h-4 text-primary" />
                      <a className="hover:underline" href={`tel:${general.phone.replace(/\s/g, "")}`}>{general.phone}</a>
                    </p>
                  )}
                  {general.address && (
                    <p className="flex items-center gap-2 text-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      {general.address}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default PublicContent;
