import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : err.message === 'User already registered'
        ? 'Este email já está cadastrado'
        : err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#060912' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 mx-auto mb-8 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary))' }}>
            <Search size={16} className="text-white" />
          </div>
          <span className="font-heading font-extrabold text-xl text-white">ikas</span>
        </button>

        {/* Card */}
        <div className="rounded-2xl p-8 border" style={{ background: '#0D1525', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h1 className="font-heading font-bold text-2xl text-white text-center mb-2">
            {isLogin ? 'Entrar na sua conta' : 'Criar sua conta'}
          </h1>
          <p className="font-body text-sm text-center mb-6" style={{ color: '#7A90B0' }}>
            {isLogin ? 'Acesse suas vagas e propostas' : 'Comece a encontrar vagas agora'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-body font-medium text-white mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none focus:ring-2 transition-all"
                  style={{ background: '#111B2E', border: '1px solid rgba(255,255,255,0.06)' }}
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-body font-medium text-white mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none focus:ring-2 transition-all"
                style={{ background: '#111B2E', border: '1px solid rgba(255,255,255,0.06)' }}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-white mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none focus:ring-2 transition-all pr-12"
                  style={{ background: '#111B2E', border: '1px solid rgba(255,255,255,0.06)' }}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#7A90B0' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm font-body text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-heading font-bold text-sm transition-colors disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))', color: '#060912' }}
            >
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-sm font-body mt-6" style={{ color: '#7A90B0' }}>
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-medium underline"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
