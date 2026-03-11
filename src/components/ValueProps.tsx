import { motion } from 'framer-motion';
import { DollarSign, Star, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const props = [
  {
    icon: DollarSign,
    title: 'Compare Preços',
    desc: 'Veja de uma vez quanto o mesmo serviço custa em cada plataforma. Economize sem perder qualidade.',
  },
  {
    icon: Star,
    title: 'Avaliações Reais',
    desc: 'Exibimos as avaliações originais de cada plataforma. Transparência total antes de contratar.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagamento Seguro',
    desc: 'Você contrata diretamente na plataforma original, com todas as garantias que ela oferece.',
  },
];

const ValueProps = () => {
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
    <section ref={ref} className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground text-center mb-14">
          Por que usar o Trampos?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {props.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                className="bg-card border border-border rounded-2xl p-6 transition-all duration-250 hover:border-primary/40 hover:shadow-[0_0_30px_hsl(46_91%_52%/0.06)]"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {p.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
