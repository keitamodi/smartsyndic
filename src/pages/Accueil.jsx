import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import PricingSection from '@/components/landing/PricingSection';
import SignupSection from '@/components/landing/SignupSection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Accueil() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <PricingSection />
        <SignupSection />
      </main>
      <LandingFooter />
    </div>
  );
}