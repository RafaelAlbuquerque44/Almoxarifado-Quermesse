import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, AlertTriangle, ArrowDownCircle, PieChart } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>({
    totalProdutos: 0,
    estoqueCritico: [],
    ultimasRetiradas: [],
    categorias: []
  });

  useEffect(() => {
    let prods: any[] = [];
    let movs: any[] = [];

    const calculateDashboard = () => {
      const criticos = prods.filter(p => p.quantidade <= p.estoque_minimo);
      const ultimas = movs.filter(m => m.tipo === 'Saída').sort((a,b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()).slice(0, 5);
      
      const catsMap: any = {};
      prods.forEach(p => {
        catsMap[p.categoria] = (catsMap[p.categoria] || 0) + 1;
      });
      const categorias = Object.keys(catsMap).map(k => ({ categoria: k, count: catsMap[k] }));

      setData({
        totalProdutos: prods.length,
        estoqueCritico: criticos,
        ultimasRetiradas: ultimas,
        categorias
      });
    };

    const unsubP = onSnapshot(collection(db, 'produtos'), (snap) => {
      prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      calculateDashboard();
    });

    const unsubM = onSnapshot(collection(db, 'movimentacoes'), (snap) => {
      movs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      calculateDashboard();
    });

    return () => { unsubP(); unsubM(); };
  }, []);

  return (
    <div className="main-content slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Visão Geral</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Acompanhe o ritmo da Quermesse em tempo real</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total de Produtos</p>
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{data.totalProdutos}</h3>
            </div>
            <div style={{ background: 'rgba(249, 115, 22, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-color)' }}>
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: data.estoqueCritico.length > 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#ef4444', marginBottom: '0.5rem', fontWeight: 600 }}>Avisos de Estoque</p>
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{data.estoqueCritico.length}</h3>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Categorias Ativas</p>
              <h3 style={{ fontSize: '2rem', margin: 0 }}>{data.categorias.length}</h3>
            </div>
            <div style={{ background: 'rgba(252, 211, 77, 0.2)', padding: '1rem', borderRadius: '12px', color: '#fcd34d' }}>
              <PieChart size={24} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <ArrowDownCircle size={20} color="var(--accent-color)" /> Últimas Retiradas
          </h3>
          {data.ultimasRetiradas.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma retirada registrada ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.ultimasRetiradas.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>{r.responsavel}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>ID Produto: {r.produto_id.slice(0,6)}...</p>
                  </div>
                  <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.2rem' }}>-{r.quantidade}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.estoqueCritico.length > 0 && (
          <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#ef4444' }}>
              <AlertTriangle size={20} /> Precisam de Reposição
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.estoqueCritico.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>{c.nome}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Mínimo: {c.estoque_minimo}</p>
                  </div>
                  <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.2rem' }}>{c.quantidade} un.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
