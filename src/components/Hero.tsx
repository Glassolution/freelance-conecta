import { motion } from 'framer-motion';

const platforms = ['Workana', 'GetNinjas', '99Freelas', 'Upwork'];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <img
        src="/images/hero-bg.jpg"
        alt="Developer working on laptop"
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
      />

      {/* Dark overlay — strong left, transparent right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(6,9,18,0.95) 0%, rgba(6,9,18,0.80) 50%, rgba(6,9,18,0.30) 100%)',
        }}
      />

      {/* Mobile overlay — heavier for readability */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: 'rgba(6,9,18,0.90)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-[55%] max-lg:max-w-full">
          {/* Pill badge */}
          <motion.div {...fadeUp(0)}>
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-body font-medium"
              style={{
                background: 'rgba(245,197,24,0.12)',
                border: '1px solid rgba(245,197,24,0.3)',
                color: 'hsl(var(--primary))',
              }}
            >
              ✦ Meta-search de Freelancers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-heading font-extrabold text-[40px] md:text-[56px] lg:text-[72px] uppercase leading-[1.0] text-foreground mt-6"
            {...fadeUp(0)}
          >
            A FORMA MAIS
            <br />
            INTELIGENTE DE
            <br />
            ENCONTRAR
            <br />
            FREELANCERS
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="font-body text-muted-foreground text-base md:text-lg max-w-[480px] mt-6"
            {...fadeUp(0.15)}
          >
            Buscamos simultaneamente em Workana, GetNinjas,
            99Freelas e Upwork. Compare tudo em um só lugar.
          </motion.p>

          {/* Buttons */}
          <motion.div className="flex flex-wrap items-center gap-4 mt-8" {...fadeUp(0.25)}>
            <button className="bg-primary text-primary-foreground font-heading font-bold text-base px-8 py-3.5 rounded-full hover:bg-primary/90 transition-colors">
              Buscar Agora
            </button>
            <a
              href="#como-funciona"
              className="font-body font-medium text-foreground text-sm hover:underline transition-colors"
            >
              Ver Como Funciona →
            </a>
          </motion.div>

          {/* Platform badges */}
          <motion.div className="mt-8" {...fadeUp(0.35)}>
            <p className="font-body text-xs text-muted-foreground mb-3">Buscamos em:</p>
            <div className="flex flex-wrap items-center gap-2">
              {platforms.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-body font-medium text-foreground border border-border"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
