import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import AISection from "@/components/landing/AISection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SecurityComplianceSection from "@/components/landing/SecurityComplianceSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import FooterSection from "@/components/landing/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <ShowcaseSection />
      <AISection />
      <UseCasesSection />
      <FeaturesSection />
      <SecurityComplianceSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
};

export default Index;
