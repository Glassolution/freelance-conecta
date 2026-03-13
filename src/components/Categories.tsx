import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const categories = [
  { emoji: '💻', name: 'Desenvolvimento Web', count: '3.240' },
  { emoji: '📱', name: 'Desenvolvimento de Apps', count: '1.890' },
  { emoji: '🎨', name: 'Design & Branding', count: '4.120' },
  { emoji: '📣', name: 'Marketing Digital', count: '2.760' },
  { emoji: '🎬', name: 'Vídeo & Animação', count: '980' },
  { emoji: '✍️', name: 'Redação & Conteúdo', count: '1.450' },
  { emoji: '📊', name: 'Consultoria & Negócios', count: '670' },
  { emoji: '🎵', name: 'Música & Áudio', count: '340' },
];

const Categories = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
          Explore por Categoria
        </h2>
        <p className="font-body text-muted-foreground mb-12">
          Serviços atualizados em tempo real das principais plataformas
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.name}
              className="group text-left bg-card border border-border rounded-2xl p-5 transition-all duration-250 hover:border-primary hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.4 }}
            >
              <span className="text-[32px] block mb-3 transition-transform duration-250 group-hover:scale-110">
                {cat.emoji}
              </span>
              <span className="font-heading font-semibold text-foreground block mb-1.5">
                {cat.name}
              </span>
              <span className="flex items-center gap-1.5 font-body text-xs text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-[#29B2FE] pulse-dot" />
                {cat.count} serviços disponíveis
                <span className="text-muted-foreground ml-1">ao vivo</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
