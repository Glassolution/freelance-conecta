import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

const MeusAnuncios = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px',
          }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
          Meus Anúncios
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '48px' }}>
          Crie e gerencie seus serviços na Markfy
        </p>

        {/* Empty State */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '2px dashed #29B2FE',
            padding: '64px 32px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Você ainda não tem anúncios
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            Crie seu primeiro serviço e comece a receber clientes
          </p>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#29B2FE',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Criar Anúncio
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeusAnuncios;
