import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Mensagens = () => {
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
          Mensagens
        </h1>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 160px)', maxWidth: '1200px', margin: '0 auto', gap: '16px', padding: '0 16px 16px' }}>
        {/* Left - Conversation List */}
        <div
          style={{
            width: '300px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>💬</div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Nenhuma conversa</p>
        </div>

        {/* Right - Chat Area */}
        <div
          style={{
            flex: 1,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>👋</div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Selecione uma conversa para começar</p>
        </div>
      </div>
    </div>
  );
};

export default Mensagens;
