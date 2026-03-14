import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MarkfyLogo from '@/components/MarkfyLogo';

const TYPING_SPEED = 40;
const PAUSE_BETWEEN = 800;

const goalChips = [
  'Encontrar vagas como freelancer',
  'Anunciar meus serviços',
  'Contratar freelancers',
  'Explorar o marketplace',
];

const profileChips = [
  'Desenvolvimento Web/Mobile',
  'Marketing Digital',
  'Design & Criação',
  'Edição de Vídeo',
  'Outro',
];

function useTypewriter(lines: string[], onDone: () => void) {
  const [display, setDisplay] = useState('');
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [typing, setTyping] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!typing || lineIdx >= lines.length) return;
    const line = lines[lineIdx];
    if (charIdx <= line.length) {
      const t = setTimeout(() => {
        const built = lines.slice(0, lineIdx).join('\n') + (lineIdx > 0 ? '\n' : '') + line.slice(0, charIdx);
        setDisplay(built);
        if (charIdx === line.length) {
          if (lineIdx < lines.length - 1) {
            setTimeout(() => {
              setLineIdx(lineIdx + 1);
              setCharIdx(0);
            }, PAUSE_BETWEEN);
          } else {
            setTyping(false);
            if (!doneRef.current) {
              doneRef.current = true;
              onDone();
            }
          }
        } else {
          setCharIdx(charIdx + 1);
        }
      }, TYPING_SPEED);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx, typing, lines, onDone]);

  return { display, typing };
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=intro, 1=q1, 2=q2, 3=done
  const [showQuestion, setShowQuestion] = useState(false);
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [input, setInput] = useState('');
  const [logoVisible, setLogoVisible] = useState(false);
  const [showDoneButton, setShowDoneButton] = useState(false);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || '';

  // Check if already onboarded
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('onboarding_completed').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed) navigate('/pricing', { replace: true });
      });
  }, [user, navigate]);

  // Logo fade in
  useEffect(() => {
    const t = setTimeout(() => setLogoVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const introLines = ['Olá! Sou a Markfy AI.', 'Antes de começar, me conta um pouco sobre você.'];
  const onIntroDone = useCallback(() => {
    setTimeout(() => { setStep(1); setShowQuestion(true); }, 600);
  }, []);
  const { display: introText, typing: introTyping } = useTypewriter(step === 0 ? introLines : [], onIntroDone);

  // Step 2 typewriter
  const s2Lines = ['Entendido! Última pergunta:'];
  const onS2Done = useCallback(() => {
    setTimeout(() => setShowQuestion(true), 400);
  }, []);
  const { display: s2Text, typing: s2Typing } = useTypewriter(step === 2 ? s2Lines : [], onS2Done);

  // Step 3 typewriter
  const s3Lines = [
    `Perfeito${userName ? ', ' + userName : ''}! Configurei a Markfy para o seu perfil.`,
    'Para acessar todas as vagas e recursos, escolha seu plano abaixo.',
  ];
  const onS3Done = useCallback(() => {
    setTimeout(() => setShowDoneButton(true), 1500);
  }, []);
  const { display: s3Text } = useTypewriter(step === 3 ? s3Lines : [], onS3Done);

  const submitAnswer = () => {
    if (!input.trim()) return;
    if (step === 1) {
      setAnswer1(input.trim());
      setInput('');
      setShowQuestion(false);
      setStep(2);
    } else if (step === 2) {
      setAnswer2(input.trim());
      setInput('');
      setShowQuestion(false);
      setStep(3);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase.from('profiles').update({ onboarding_completed: true } as any).eq('id', user.id);
    }
    navigate('/pricing', { replace: true });
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_goal: answer1,
        onboarding_profile: answer2,
      } as any).eq('id', user.id);
    }
    navigate('/pricing', { replace: true });
  };

  const currentStep = step >= 2 ? 2 : 1;

  return (
    <div style={{ minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {/* Progress dots */}
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: currentStep === 1 ? 8 : 6, height: currentStep === 1 ? 8 : 6, borderRadius: '50%', background: currentStep === 1 ? '#29B2FE' : '#e5e7eb', transition: 'all 0.3s' }} />
        <div style={{ width: currentStep === 2 ? 8 : 6, height: currentStep === 2 ? 8 : 6, borderRadius: '50%', background: currentStep === 2 ? '#29B2FE' : '#e5e7eb', transition: 'all 0.3s' }} />
      </div>

      <div style={{ maxWidth: 600, width: '100%' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, opacity: logoVisible ? 1 : 0, transition: 'opacity 0.8s ease', display: 'flex', justifyContent: 'center' }}>
          <MarkfyLogo size={64} />
        </div>

        {/* Step 0: Intro */}
        {step === 0 && (
          <div style={{ textAlign: 'center', minHeight: 80 }}>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#111827', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {introText}
              {introTyping && <span style={{ animation: 'blink 1s step-end infinite', borderRight: '2px solid #29B2FE', marginLeft: 2 }}>&nbsp;</span>}
            </p>
          </div>
        )}

        {/* Step 1: Question 1 */}
        {step === 1 && (
          <div style={{ opacity: showQuestion ? 1 : 0, transition: 'opacity 0.5s ease', transform: showQuestion ? 'translateY(0)' : 'translateY(10px)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 24 }}>
              Qual é o seu principal objetivo na Markfy?
            </h2>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                placeholder="Digite sua resposta ou escolha abaixo"
                style={{ width: '100%', padding: '16px 52px 16px 20px', border: '2px solid #29B2FE', borderRadius: 16, boxShadow: '0 4px 24px rgba(41,178,254,0.15)', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', color: '#111827' }}
              />
              <button onClick={submitAnswer} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#29B2FE', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowRight size={16} color="white" />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {goalChips.map(c => (
                <button key={c} onClick={() => { setInput(c); }} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #29B2FE', background: 'white', color: '#29B2FE', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >{c}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Transition + Question 2 */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', minHeight: 40, marginBottom: 24 }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', whiteSpace: 'pre-line' }}>
                {s2Text}
                {s2Typing && <span style={{ animation: 'blink 1s step-end infinite', borderRight: '2px solid #29B2FE', marginLeft: 2 }}>&nbsp;</span>}
              </p>
            </div>
            {showQuestion && (
              <div style={{ opacity: showQuestion ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 24 }}>
                  Qual área melhor descreve seu trabalho?
                </h2>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                    placeholder="Digite sua resposta ou escolha abaixo"
                    style={{ width: '100%', padding: '16px 52px 16px 20px', border: '2px solid #29B2FE', borderRadius: 16, boxShadow: '0 4px 24px rgba(41,178,254,0.15)', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', color: '#111827' }}
                  />
                  <button onClick={submitAnswer} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#29B2FE', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <ArrowRight size={16} color="white" />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {profileChips.map(c => (
                    <button key={c} onClick={() => setInput(c)} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #29B2FE', background: 'white', color: '#29B2FE', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >{c}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#111827', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 32 }}>
              {s3Text}
            </p>
            {showDoneButton && (
              <button
                onClick={handleFinish}
                style={{ width: '100%', padding: '16px 24px', borderRadius: 14, background: '#29B2FE', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'pulseBtn 2s ease-in-out infinite', fontFamily: 'Inter, sans-serif' }}
              >
                Ver Planos <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}

        {/* Skip */}
        <button onClick={handleSkip} style={{ display: 'block', margin: '48px auto 0', background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
        >
          Pular por agora →
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1 }
          51%, 100% { opacity: 0 }
        }
        @keyframes pulseBtn {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(41,178,254,0.25); }
          50% { transform: scale(1.02); box-shadow: 0 6px 32px rgba(41,178,254,0.4); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
