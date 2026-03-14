import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarkfyLogo from '@/components/MarkfyLogo';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Marketplace', 'Como Funciona', 'Para Freelancers'];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border'
          : 'bg-transparent'
      }`}
      style={scrolled ? { background: 'rgba(6,9,18,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : undefined}
    >
      <nav className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <MarkfyLogo size={28} />
          <span className="font-heading font-extrabold text-xl text-foreground tracking-tight">Markfy</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
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
          <Button className="bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 rounded-full px-5">
            Criar Conta
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
        <div
          className="md:hidden border-b border-border px-4 pb-6 pt-2"
          style={{ background: 'rgba(6,9,18,0.95)', backdropFilter: 'blur(20px)' }}
        >
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
            <Button className="bg-primary text-primary-foreground font-body font-medium text-sm flex-1 rounded-full">
              Criar Conta
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;