import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tags = [
  { emoji: '🎨', label: 'Design' },
  { emoji: '💻', label: 'Dev Web' },
  { emoji: '📣', label: 'Marketing' },
  { emoji: '🎬', label: 'Vídeo' },
  { emoji: '📱', label: 'Apps' },
];

const particles = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 6 + Math.random() * 4,
}));

const Hero = () => {
  const [query, setQuery] = useState('');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(hsl(220 50% 22% / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, hsl(220 50% 22% / 0.4) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-accent/[0.07] blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-background/50 blur-[200px]" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-accent/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-20">
        <motion.h1
          className="font-heading font-bold text-4xl md:text-6xl lg:text-[64px] leading-tight text-foreground mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Encontre o Freelancer
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="relative inline-block">
              Ideal
              <span className="absolute -bottom-1 left-0 h-3 bg-primary/30 rounded-sm brush-stroke" style={{ width: 0 }} />
            </span>{' '}
            para o Seu Projeto
          </motion.span>
        </motion.h1>

        <motion.p
          className="font-body text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          Buscamos em Workana, GetNinjas, 99Freelas e Upwork
          <br className="hidden md:block" /> ao mesmo tempo. Você compara e contrata.
        </motion.p>

        {/* Search bar */}
        <motion.div
          className="max-w-[680px] mx-auto mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center bg-input border border-border rounded-xl p-1.5 gap-1.5">
            <div className="flex items-center flex-1 gap-2 pl-3">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: designer de logo, desenvolvedor React..."
                className="bg-transparent flex-1 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none py-2"
              />
            </div>
            <button className="hidden sm:flex items-center gap-1.5 text-sm font-body text-muted-foreground px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors shrink-0">
              Todas as categorias
              <ChevronDown size={14} />
            </button>
            <Button className="bg-primary text-primary-foreground font-body font-semibold text-sm px-6 rounded-lg hover:bg-primary/90">
              Buscar
            </Button>
          </div>
        </motion.div>

        {/* Tag chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          {tags.map((tag) => (
            <button
              key={tag.label}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-sm font-body text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-250"
            >
              <span>{tag.emoji}</span>
              {tag.label}
            </button>
          ))}
        </motion.div>

        {/* Secondary CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Button
            variant="outline"
            className="border-foreground/20 text-foreground font-body text-sm hover:bg-foreground/5"
          >
            Sou Freelancer <ArrowRight size={16} />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
