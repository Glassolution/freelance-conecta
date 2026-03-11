import { motion } from 'framer-motion';
import { Search, Zap, Handshake } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    num: '1',
    icon: Search,
    title: 'Busque',
    desc: 'Digite o que você precisa e selecione filtros de categoria, preço e localização.',
  },
  {
    num: '2',
    icon: Zap,
    title: 'Comparamos',
    desc: 'Buscamos simultaneamente no Workana, GetNinjas, 99Freelas e Upwork por você.',
  },
  {
    num: '3',
    icon: Handshake,
    title: 'Contrate',
    desc: 'Veja resultados unificados, compare preços e contrate direto na plataforma original.',
  },
];

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-28 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            Como o Trampos Funciona
          </h2>
          <p className="font-body text-muted-foreground">Em 3 passos simples</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Dotted connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t-2 border-dashed border-border" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                className="relative bg-card border border-border border-l-4 border-l-primary rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                {/* Large decorative number */}
                <span className="absolute top-4 right-4 font-heading font-bold text-6xl text-accent/[0.12]">
                  {step.num}
                </span>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
