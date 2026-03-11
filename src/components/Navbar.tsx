import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Explorar', 'Como Funciona', 'Para Freelancers'];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-background/80 border-b border-foreground/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <a href="/" className="font-heading font-bold text-xl text-foreground tracking-tight">
          Tramp<span className="relative">o<span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" /></span>s
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors duration-250"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-foreground font-body text-sm">
            Entrar
          </Button>
          <Button className="bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90">
            Cadastrar
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-foreground/[0.06] px-4 pb-6 pt-2">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="block py-3 text-sm font-body font-medium text-muted-foreground hover:text-foreground"
            >
              {link}
            </a>
          ))}
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" className="text-foreground font-body text-sm flex-1">
              Entrar
            </Button>
            <Button className="bg-primary text-primary-foreground font-body font-semibold text-sm flex-1">
              Cadastrar
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
