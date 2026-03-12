import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Eye, EyeOff, Mail, Lock, Search } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : err.message === 'User already registered'
          ? 'Este email já está cadastrado'
          : err.message || 'Ocorreu um erro'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-20 lg:px-24 py-12 bg-white">
        <div className="max-w-[400px] w-full mx-auto">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <Search size={18} className="text-white" />
            </div>
            <span className="font-heading font-extrabold text-xl text-[#060912]">Markfy</span>
          </button>

          {/* Title */}
          <h1 className="font-heading font-bold text-3xl text-[#060912] mb-8">
            {isLogin ? 'Sign in' : 'Sign up'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-body font-medium text-[#060912] mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="Seu nome"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-body text-[#060912] bg-[#F5F5F5] border border-[#E8E8E8] outline-none focus:border-[#060912] transition-colors placeholder:text-[#A0A0A0]"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]">
                    <Mail size={16} />
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-body font-medium text-[#060912] mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="johndoe@gmail.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-body text-[#060912] bg-[#F5F5F5] border border-[#E8E8E8] outline-none focus:border-[#060912] transition-colors placeholder:text-[#A0A0A0]"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]">
                  <Mail size={16} />
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-body font-medium text-[#060912] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-body text-[#060912] bg-[#F5F5F5] border border-[#E8E8E8] outline-none focus:border-[#060912] transition-colors placeholder:text-[#A0A0A0]"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]">
                  <Lock size={16} />
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#060912] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            {isLogin && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D0D0D0] accent-[#060912]"
                />
                <span className="text-sm font-body text-[#060912]">Remember me</span>
              </label>
            )}

            {error && (
              <p className="text-sm font-body text-red-500 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white transition-colors disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))' }}
            >
              {loading ? 'Aguarde...' : isLogin ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          {/* Toggle + Forgot */}
          <div className="mt-5 space-y-1">
            <p className="text-sm font-body text-[#A0A0A0]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="font-medium text-[#060912] underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
            {isLogin && (
              <button className="text-sm font-body text-[#A0A0A0] hover:text-[#060912] transition-colors">
                Forgot Password
              </button>
            )}
          </div>

          {/* Social */}
          <div className="flex items-center gap-4 mt-8">
            <button
              type="button"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) setError(error.message || 'Erro ao entrar com Google');
              }}
              className="w-12 h-12 rounded-full border border-[#E8E8E8] flex items-center justify-center hover:bg-[#F5F5F5] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#2563eb"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT — Dark panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{ background: '#060912' }}>
        {/* Decorative geometric shape */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div
            className="w-[500px] h-[500px]"
            style={{
              background: 'linear-gradient(135deg, #1a1f2e 0%, #2a2f3e 50%, #060912 100%)',
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              transform: 'rotate(-10deg)',
            }}
          />
        </div>

        {/* Subtle line accents */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
        <div className="absolute top-20 right-20 w-px h-40" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)' }} />

        {/* Content */}
        <div className="relative z-10 mt-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Search size={14} className="text-white" />
            </div>
            <span className="font-heading font-bold text-sm text-white/70">Markfy</span>
          </div>

          <h2 className="font-heading font-bold text-3xl text-white leading-tight mb-3">
            Bem-vindo ao ikas
          </h2>
          <p className="font-body text-sm text-white/50 max-w-sm mb-6 leading-relaxed">
            Ikas ajuda freelancers a encontrar as melhores vagas em todas as plataformas. 
            Junte-se a nós e comece a encontrar projetos hoje.
          </p>
          <p className="font-body text-sm text-white/40 mb-8">
            Mais de 12k profissionais já estão usando, é a sua vez
          </p>

          {/* Bottom card */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-heading font-bold text-lg text-white leading-snug mb-2">
              Encontre a vaga certa no lugar certo, candidate-se agora
            </h3>
            <p className="font-body text-sm text-white/40 mb-4">
              Esteja entre os primeiros a experimentar a forma mais fácil de começar a trabalhar como freelancer.
            </p>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {['#a78bfa', '#38bdf8', '#34d399', '#f472b6'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#060912] flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: color }}
                  >
                    {['AS', 'MK', 'JR', '+2'][i]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
