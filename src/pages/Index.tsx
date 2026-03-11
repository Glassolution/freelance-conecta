import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const LogoSvg = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="7.5" r="5" stroke="white" strokeWidth="2.2" fill="none" />
    <line x1="11.5" y1="11.5" x2="16" y2="16" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const ChevronSvg = () => (
  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 10L4 6h8z" /></svg>
);

const Index = () => {
  const navigate = useNavigate();
  const [activePain, setActivePain] = useState(0);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const featRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Count-up animation for stats
    const targets = [12400];
    statRefs.current.forEach((el, i) => {
      if (!el || i >= targets.length) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          const target = targets[i];
          let current = 0;
          const step = target / (1600 / 16);
          const interval = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = Math.floor(current).toLocaleString('pt-BR') + '+';
            if (current >= target) clearInterval(interval);
          }, 16);
          observer.disconnect();
        },
        { threshold: 0.5 }
      );
      observer.observe(el);
    });

    // Fade-in on scroll for feature cards
    featRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => {
            el.style.transition = 'opacity .4s ease, transform .4s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, i * 60);
          observer.disconnect();
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    });
  }, []);

  const painItems = [
    {
      icon: '\uD83D\uDD0D',
      title: 'Voc\u00ea perde tempo abrindo 4 plataformas diferentes',
      desc: 'Para encontrar um bom projeto, voc\u00ea precisa abrir Workana, GetNinjas, 99Freelas e Upwork separadamente \u2014 perdendo horas que poderiam ser usadas trabalhando.',
    },
    {
      icon: '\uD83D\uDCB8',
      title: 'Vagas boas somem r\u00e1pido e voc\u00ea fica de fora',
      desc: 'Sem um lugar centralizado, quando voc\u00ea finalmente v\u00ea a vaga, outra pessoa j\u00e1 fechou o projeto.',
    },
    {
      icon: '\u2B50',
      title: 'Dif\u00edcil saber qual plataforma vale mais o seu perfil',
      desc: 'Cada plataforma tem seu p\u00fablico e seus pre\u00e7os. Voc\u00ea s\u00f3 descobre depois de muito tempo perdido testando.',
    },
  ];

  const features = [
    { icon: '\uD83D\uDD0D', name: 'Vagas Centralizadas', desc: 'Um s\u00f3 lugar com vagas de todas as plataformas. Sem precisar abrir 4 abas diferentes.' },
    { icon: '\uD83D\uDD14', name: 'Alertas Instant\u00e2neos', desc: 'Receba notifica\u00e7\u00e3o assim que uma vaga da sua \u00e1rea aparecer. Seja o primeiro a se candidatar.' },
    { icon: '\u2696\uFE0F', name: 'Compare Oportunidades', desc: 'Veja side-by-side quais plataformas pagam mais para o seu tipo de servi\u00e7o.' },
    { icon: '\uD83D\uDCCA', name: 'Filtros Avan\u00e7ados', desc: 'Filtre por \u00e1rea, faixa de pagamento, prazo e plataforma preferida.' },
    { icon: '\uD83C\uDF0D', name: 'Vagas Nacionais e Internacionais', desc: 'Acesse projetos do Brasil e do exterior, incluindo vagas em d\u00f3lar via Upwork.' },
    { icon: '\uD83D\uDE80', name: 'Perfil \u00danico', desc: 'Em breve: crie um perfil e apare\u00e7a para clientes de todas as plataformas ao mesmo tempo.' },
  ];

  return (
    <>
      {/* NAV */}
      <div className="nav-wrapper">
        <nav className="landing-nav">
          <a href="#" className="logo">
            <div className="logo-icon"><LogoSvg /></div>
            <span className="logo-name">ikas</span>
          </a>
          <ul className="nav-links">
            <li><a href="#" className="active">In&#237;cio</a></li>
            <li><a href="#">Como Funciona</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}>Pre&#231;os</a></li>
            <li><a href="#">Para Profissionais</a></li>
          </ul>
          <div className="nav-right">
            <button className="btn-nav-login">Login</button>
            <button className="btn-nav-signup">Cadastrar</button>
          </div>
        </nav>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="badge-new">&#10022; Novo</span>
            Vagas Agregadas de 4 Plataformas
            <span className="badge-arrow">&rsaquo;</span>
          </div>

          <h1 className="hero-h1">
            Ganhe Dinheiro<br />
            Fazendo o que<br />
            Voc&#234; Sabe Fazer
          </h1>

          <p className="hero-p">
            Agregamos vagas de Workana, GetNinjas, 99Freelas e Upwork em um s&#243; lugar.
            Encontre clientes, feche projetos e aumente sua renda extra.
          </p>

          <div className="hero-btns">
            <button className="btn-orange" onClick={() => navigate('/dashboard')}>Encontrar Vagas</button>
            <button className="btn-ghost-dark">Ver Como Funciona</button>
          </div>
        </div>

        <div className="hero-right">
          <div className="illustration-wrap">
            <div className="ui-card">
              <div className="brand-icon"><LogoSvg /></div>

              <div className="ui-card-header">
                <div className="uic-check">&#10003;</div>
                <span className="uic-title">Vagas Dispon&#237;veis</span>
              </div>

              <div className="uic-big-num">12.4k</div>

              <div className="uic-label">Escolha sua &#225;rea</div>
              <div className="uic-options">
                <div className="uic-option selected">
                  <div className="uic-opt-icon">&#128187;</div>
                  Dev &amp; Tecnologia
                </div>
                <div className="uic-option">
                  <div className="uic-opt-icon">&#127912;</div>
                  Design &amp; Cria&#231;&#227;o
                </div>
              </div>

              <div className="uic-alert">
                <span className="uic-alert-icon">&#9889;</span>
                Novas vagas adicionadas agora
              </div>
            </div>

            <div className="box-illustration">
              <img
                src="/caixa.png"
                style={{ width: '100%', maxWidth: '680px', display: 'block', margin: '0 auto' }}
                alt="Caixa aberta"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="social-proof">
          <div className="sp-left">
            <div className="sp-label">Agregamos vagas de</div>
            <div className="sp-sub">Atualizadas em tempo real</div>
          </div>
          <div className="sp-logos">
            <div className="sp-logo"><div className="sp-logo-icon">W</div>Workana</div>
            <div className="sp-logo"><div className="sp-logo-icon">GN</div>GetNinjas</div>
            <div className="sp-logo"><div className="sp-logo-icon">99</div>99Freelas</div>
            <div className="sp-logo"><div className="sp-logo-icon">UP</div>Upwork</div>
          </div>
        </div>
      </div>

      {/* DARK SECTION */}
      <div className="dark-section">
        <div className="dark-inner">
          <div className="dark-eyebrow">
            <span className="de-icon">&#9889;</span>
            <span className="de-text">O Problema</span>
          </div>
          <h2 className="dark-title">
            Encontrar Clientes &#233;<br />
            Mais Dif&#237;cil do que Deveria Ser
          </h2>

          <div className="dark-grid">
            {/* Chat card */}
            <div className="chat-card">
              <div className="chat-speed-badge">&#9889; Vagas em tempo real</div>
              <div className="chat-window">
                <div className="chat-topbar">
                  <span className="chat-agent-label">Ikas Search</span>
                  <span className="chat-close">&times;</span>
                </div>
                <div className="chat-body">
                  <div>
                    <div className="chat-agent-name">Voc&#234;</div>
                    <div className="chat-msg chat-msg-user">Sou designer, quero projetos de logo para come&#231;ar</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div className="chat-agent-name" style={{ textAlign: 'right' }}>Ikas</div>
                    <div className="chat-msg chat-msg-ai">Encontrei 4.120 projetos de design dispon&#237;veis. GetNinjas a partir de R$ 80, Workana a partir de R$ 150.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="chat-avatar">IK</div>
                    <div style={{ height: '8px', width: '100%', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '60%', background: '#e5e7eb', animation: 'load 1.5s ease-in-out infinite' }}></div>
                    </div>
                  </div>
                </div>
                <div className="chat-footer">
                  <div className="chat-icons">
                    <span>&#128206;</span><span>&#128522;</span><span>&#127908;</span>
                  </div>
                  <div className="chat-send">&rarr;</div>
                </div>
              </div>
            </div>

            {/* Pain points */}
            <div className="pain-list">
              {painItems.map((item, i) => (
                <div
                  key={i}
                  className={`pain-item${activePain === i ? ' active' : ''}`}
                  onClick={() => setActivePain(i)}
                >
                  <div className="pi-header">
                    <span className="pi-icon">{item.icon}</span>
                    <span className={`pi-title${activePain !== i ? ' muted' : ''}`}>{item.title}</span>
                  </div>
                  <div className="pi-desc">{item.desc}</div>
                  <a href="#" className="pi-link">Veja como resolvemos &rarr;</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="features-section">
        <div className="feat-header">
          <div className="feat-eyebrow">Recursos</div>
          <h2 className="feat-title">Tudo que voc&#234; precisa<br />para trabalhar mais</h2>
        </div>
        <div className="feat-grid">
          {features.map((f, i) => (
            <div
              key={i}
              className="feat-card"
              ref={(el) => { featRefs.current[i] = el; }}
            >
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-name">{f.name}</div>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-section">
        <div className="stats-inner">
          <div className="stat-cell">
            <div className="stat-n" ref={(el) => { statRefs.current[0] = el; }}>0</div>
            <div className="stat-l">Vagas Ativas Agora</div>
          </div>
          <div className="stat-cell">
            <div className="stat-n">4</div>
            <div className="stat-l">Plataformas Integradas</div>
          </div>
          <div className="stat-cell">
            <div className="stat-n">4.8&#9733;</div>
            <div className="stat-l">Avalia&#231;&#227;o dos Usu&#225;rios</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2 className="cta-title">Pronto para Aumentar<br />sua Renda Extra?</h2>
        <p className="cta-sub">Mais de 12.000 vagas dispon&#237;veis agora mesmo. Gratuito para come&#231;ar.</p>
        <div className="cta-btns">
          <button className="btn-orange" onClick={() => navigate('/dashboard')}>Encontrar Vagas Agora</button>
          <button className="btn-ghost-dark">Ver Como Funciona</button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <footer className="landing-footer">
          <div>
            <div className="f-logo">
              <div className="f-logo-icon"><LogoSvg /></div>
              ikas
            </div>
            <p className="f-tag">A forma mais inteligente de freelancers encontrarem mais trabalho.</p>
            <div className="f-socials">
              <a href="#" className="f-soc">in</a>
              <a href="#" className="f-soc">ig</a>
              <a href="#" className="f-soc">tw</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Plataforma</h4>
            <ul>
              <li><a href="#">Explorar Vagas</a></li>
              <li><a href="#">Como Funciona</a></li>
              <li><a href="#">Para Freelancers</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Suporte</h4>
            <ul>
              <li><a href="#">Central de Ajuda</a></li>
              <li><a href="#">Contato</a></li>
              <li><a href="#">Termos de Uso</a></li>
              <li><a href="#">Privacidade</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Parceiros</h4>
            <ul>
              <li><a href="#">Workana</a></li>
              <li><a href="#">GetNinjas</a></li>
              <li><a href="#">99Freelas</a></li>
              <li><a href="#">Upwork</a></li>
            </ul>
          </div>
        </footer>
        <div className="footer-bottom">&copy; 2025 Ikas. Todos os direitos reservados.</div>
      </div>
    </>
  );
};

export default Index;
