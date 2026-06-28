import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, KeyRound } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || 'AIzaSyC9cT3pE_lc8Xt6Z3-cq80UhST2Mam2xkM');
  const [inputKey, setInputKey] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSaveKey = () => {
    localStorage.setItem('gemini_api_key', inputKey);
    setApiKey(inputKey);
  };

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;
    
    const userMsg = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Busca dados do firebase
      const prodSnap = await getDocs(collection(db, 'produtos'));
      const movSnap = await getDocs(collection(db, 'movimentacoes'));
      const produtos = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const movimentacoes = movSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const systemPrompt = `Você é um assistente de almoxarifado de uma quermesse. 
Aqui estão os produtos em estoque: ${JSON.stringify(produtos)}.
Aqui estão as últimas movimentações: ${JSON.stringify(movimentacoes)}.
Se o usuário pedir para registrar uma saída ou entrada de algo, responda EXATAMENTE com um JSON neste formato: {"action": "registrar", "tipo": "Saída", "produto_id": "id-do-produto", "quantidade": 1, "responsavel": "nome"}
Se for apenas uma pergunta, responda normalmente ajudando o usuário.`;

      const historyForApi = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const chat = model.startChat({
        history: [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "model", parts: [{ text: "Entendido." }] }, ...historyForApi]
      });

      const result = await chat.sendMessage(userMsg);
      const responseText = result.response.text();

      // Check if it's a JSON action
      try {
        const jsonMatch = responseText.match(/\{.*\}/s);
        if (jsonMatch) {
          const actionData = JSON.parse(jsonMatch[0]);
          if (actionData.action === "registrar") {
            // Firebase Action
            await addDoc(collection(db, 'movimentacoes'), {
              produto_id: actionData.produto_id,
              tipo: actionData.tipo,
              quantidade: actionData.quantidade,
              responsavel: actionData.responsavel || 'IA Assistente',
              data_hora: new Date().toISOString()
            });

            const prodRef = doc(db, 'produtos', actionData.produto_id);
            const prodSnapData = await getDoc(prodRef);
            if (prodSnapData.exists()) {
              const prodData: any = prodSnapData.data();
              let novaQtd = prodData.quantidade || 0;
              if (actionData.tipo === 'Entrada') novaQtd += actionData.quantidade;
              if (actionData.tipo === 'Saída') novaQtd -= actionData.quantidade;
              await updateDoc(prodRef, { quantidade: novaQtd });
            }

            setMessages(prev => [...prev, { role: 'ai', text: `✅ Sucesso! Registrei a ${actionData.tipo} de ${actionData.quantidade} unidade(s) para ${actionData.responsavel}. O estoque foi atualizado!` }]);
            return;
          }
        }
      } catch (e) {
        // Not JSON, just normal text
      }

      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: `❌ Erro ao falar com a IA: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--accent-color)', color: 'white',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, transition: 'transform 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Janela do Chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '350px', height: '500px',
          background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)',
          borderRadius: '20px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)', zIndex: 1000, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '1rem', background: 'linear-gradient(to right, #f97316, #fcd34d)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={20} /> Assistente Inteligente
            </h4>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          {/* Configuração de API Key */}
          {!apiKey ? (
            <div style={{ padding: '2rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', textAlign: 'center' }}>
              <KeyRound size={40} style={{ color: 'var(--accent-color)', margin: '0 auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'white' }}>Configure sua IA</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Para a IA funcionar, precisamos de uma Chave API do Google Gemini (é gratuita!).
              </p>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                Clique aqui para gerar a sua chave
              </a>
              <input 
                type="password"
                className="form-control"
                placeholder="Cole sua chave aqui..."
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                style={{ marginTop: '1rem' }}
              />
              <button className="btn btn-primary" onClick={handleSaveKey}>Salvar Chave</button>
            </div>
          ) : (
            <>
              {/* Área de Mensagens */}
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '0.9rem' }}>
                    Olá! Sou seu assistente de almoxarifado.<br/>Você pode me perguntar o que está em falta ou pedir para registrar a saída de itens!
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} style={{ 
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(0,0,0,0.3)',
                    color: 'white', padding: '0.75rem 1rem', borderRadius: '15px',
                    borderBottomRightRadius: m.role === 'user' ? '0' : '15px',
                    borderBottomLeftRadius: m.role === 'ai' ? '0' : '15px',
                    maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4'
                  }}>
                    {m.text}
                  </div>
                ))}
                {loading && (
                  <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Pensando...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Digite sua mensagem..." 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  disabled={loading}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.75rem' }}
                  onClick={handleSendMessage}
                  disabled={loading}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
