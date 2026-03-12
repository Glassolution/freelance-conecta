import { Linkedin, Instagram, Twitter } from 'lucide-react';
import MarkfyLogo from '@/components/MarkfyLogo';

const Footer = () => {
  return (
    <footer className="border-t border-border py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MarkfyLogo size={24} />
              <span className="font-heading font-bold text-lg text-foreground">Markfy</span>
            </div>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              A forma mais inteligente de encontrar freelancers no Brasil.
            </p>
            <div className="flex gap-3 mt-4">
              {[Linkedin, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-4">Plataforma</h4>
            {['Marketplace', 'Como Funciona', 'Para Freelancers', 'Blog'].map((l) => (
              <a key={l} href="#" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-2.5">
                {l}
              </a>
            ))}
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-4">Suporte</h4>
            {['Central de Ajuda', 'Contato', 'Termos de Uso', 'Privacidade'].map((l) => (
              <a key={l} href="#" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-2.5">
                {l}
              </a>
            ))}
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-4">Plataformas Parceiras</h4>
            {['Workana', 'GetNinjas', '99Freelas', 'Upwork'].map((l) => (
              <a key={l} href="#" target="_blank" rel="noopener noreferrer" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-2.5">
                {l}
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="font-body text-xs text-muted-foreground text-center">
            © 2025 Markfy. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;