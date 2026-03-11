import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 10847, suffix: '+', label: 'Freelancers Ativos' },
  { value: 52300, suffix: '+', label: 'Projetos Publicados' },
  { value: 4.8, suffix: ' ★', label: 'Avaliação Média', decimals: 1 },
];

function useCountUp(target: number, inView: boolean, decimals = 0, duration = 1500) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, decimals, duration]);

  return count;
}

const StatItem = ({ value, suffix, label, decimals = 0, inView }: {
  value: number; suffix: string; label: string; decimals?: number; inView: boolean;
}) => {
  const count = useCountUp(value, inView, decimals);
  const formatted = decimals > 0
    ? count.toFixed(decimals)
    : count.toLocaleString('pt-BR');

  return (
    <div className="text-center px-8 py-6">
      <div className="font-heading font-bold text-3xl md:text-5xl holo-text">
        {formatted}{suffix}
      </div>
      <div className="font-body text-sm text-muted-foreground mt-2">{label}</div>
    </div>
  );
};

const StatsBar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-surface border-y border-border">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center md:divide-x divide-border py-4">
        {stats.map((s) => (
          <StatItem key={s.label} {...s} inView={inView} />
        ))}
      </div>
    </section>
  );
};

export default StatsBar;
