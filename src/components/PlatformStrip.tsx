const platforms = ['Workana', 'GetNinjas', '99Freelas', 'Upwork'];

const PlatformStrip = () => {
  return (
    <section className="py-14 bg-secondary/30">
      <div className="container mx-auto px-4 text-center">
        <p className="font-body text-sm text-muted-foreground mb-8">
          Agregamos resultados de
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {platforms.map((name) => (
            <div
              key={name}
              className="group flex flex-col items-center gap-2 cursor-default"
            >
              <span className="font-heading font-bold text-lg text-foreground/50 group-hover:text-foreground transition-all duration-250 relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-250 group-hover:after:w-full">
                {name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#29B2FE] pulse-dot" />
                <span className="font-body text-[10px] text-accent">Conectado</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformStrip;
