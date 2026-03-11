import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const platforms = [
  { name: 'Workana' },
  { name: 'GetNinjas' },
  { name: '99Freelas' },
  { name: 'Upwork' },
];

const floatingCards = [
  { text: '52.300+', label: 'Projetos', delay: 0, top: '15%', right: '5%' },
  { text: '4.8 ★', label: 'Avaliação', delay: 0.8, top: '50%', right: '0%' },
  { text: '● Atualizado agora', label: '', delay: 1.6, top: '75%', right: '15%' },
];

const headlineWords = ['A', 'FORMA', 'MAIS', 'INTELIGENTE', 'DE', 'ENCONTRAR', 'FREELANCERS'];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 hero-grid opacity-30" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* LEFT — 55% */}
          <div className="w-full lg:w-[55%]">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full holo-border bg-card/60 mb-8"
            >
              <span className="text-sm font-body text-muted-foreground">✦ Meta-search de Freelancers</span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-[72px] uppercase leading-[1.0] text-foreground mb-6">
              {headlineWords.map((word, i) => (
                <motion.span
                  key={i}
                  className={`inline-block mr-[0.3em] ${word === 'FREELANCERS' ? 'holo-text' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Subtext */}
            <motion.p
              className="font-body text-muted-foreground text-base md:text-lg max-w-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Buscamos simultaneamente em Workana, GetNinjas,
              99Freelas e Upwork. Compare tudo em um só lugar.
            </motion.p>

            {/* Buttons */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
            >
              <Button className="bg-primary text-primary-foreground font-body font-medium text-base px-8 py-3 h-auto rounded-full hover:bg-primary/90">
                Buscar Agora
              </Button>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-1.5 text-foreground font-body font-medium text-sm hover:text-muted-foreground transition-colors"
              >
                Ver Como Funciona <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>

          {/* RIGHT — 45% */}
          <div className="w-full lg:w-[45%] relative flex items-center justify-center min-h-[350px] md:min-h-[450px]">
            {/* Morphing blob */}
            <div
              className="w-[280px] h-[280px] md:w-[380px] md:h-[380px] opacity-70"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #38bdf8, #34d399, #f472b6)',
                animation: 'blob-morph 8s ease-in-out infinite, blob-rotate 20s linear infinite',
                borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
                filter: 'blur(2px)',
              }}
            />

            {/* Floating glass cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                className="absolute glass-card rounded-xl px-4 py-3"
                style={{
                  top: card.top,
                  right: card.right,
                  animation: `float-bob ${3 + i * 0.5}s ease-in-out ${card.delay}s infinite`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + card.delay * 0.3, duration: 0.5 }}
              >
                {card.text.includes('●') ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#4ade80' }} />
                    <span className="font-body text-sm text-muted-foreground">Atualizado agora</span>
                  </div>
                ) : (
                  <>
                    <div className={`font-heading font-bold text-lg ${card.text.includes('★') ? 'text-primary' : 'holo-text'}`}>
                      {card.text}
                    </div>
                    <div className="font-body text-xs text-muted-foreground">{card.label}</div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Platform badges */}
        <motion.div
          className="mt-16 md:mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p className="font-body text-sm text-muted-foreground text-center mb-5">
            Agregamos resultados de:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="glass-card rounded-xl px-5 py-3 flex items-center gap-3"
              >
                <span className="font-heading font-bold text-sm text-foreground/80">{p.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#4ade80' }} />
                  <span className="font-body text-[10px]" style={{ color: '#4ade80' }}>ao vivo</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
