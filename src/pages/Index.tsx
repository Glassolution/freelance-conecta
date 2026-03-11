import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';

const Index = () => {
  return (
    <div className="noise-bg min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
      </main>
    </div>
  );
};

export default Index;
