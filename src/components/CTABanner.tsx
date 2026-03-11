import { Button } from '@/components/ui/button';

const CTABanner = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(220 50% 16%), hsl(222 55% 21%))' }}>
      {/* Diagonal lines texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 20px,
            hsl(0 0% 100% / 0.3) 20px,
            hsl(0 0% 100% / 0.3) 21px
          )`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
          Pronto para encontrar o freelancer certo?
        </h2>
        <p className="font-body text-lg text-muted-foreground mb-8">
          Mais de 50.000 serviços disponíveis agora mesmo.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button className="bg-primary text-primary-foreground font-body font-semibold text-base px-8 py-3 h-auto hover:bg-primary/90">
            Buscar Serviços Agora
          </Button>
          <Button
            variant="outline"
            className="border-foreground/20 text-foreground font-body text-base px-8 py-3 h-auto hover:bg-foreground/5"
          >
            Ver Como Funciona
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
