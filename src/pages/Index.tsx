import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';
import Categories from '@/components/Categories';
import HowItWorks from '@/components/HowItWorks';
import ValueProps from '@/components/ValueProps';
import PlatformStrip from '@/components/PlatformStrip';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="noise-bg min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Categories />
        <HowItWorks />
        <ValueProps />
        <PlatformStrip />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
